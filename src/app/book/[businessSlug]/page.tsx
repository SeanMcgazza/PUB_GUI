'use client';

import { useState, useMemo, use } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ServiceCard } from '@/components/cards/service-card';
import { TimeSlot } from '@/components/ui/time-slot';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scissors, MapPin, ArrowLeft, ArrowRight, 
  Check, Calendar, Clock, User, Sparkles, Loader2
} from 'lucide-react';
import { format, addDays, parseISO, addHours, isAfter, getDay } from 'date-fns';
import { Service } from '@/types';
import confetti from 'canvas-confetti';
import { generateId, isValidEmail, isValidPhone, timeToMinutes } from '@/lib/utils';

const STEPS = ['Service', 'Date & Time', 'Your Details', 'Confirm'];
const BUFFER_MINUTES = 15;

export default function PublicBookingPage(
  props: { params: Promise<{ businessSlug: string }> }
) {
  // In Next.js 16, params is a Promise — unwrap it
  const { businessSlug } = use(props.params);
  const { business, services, categories, addBooking, addClient, getBookingsForDate, clients, availability } = useStore();
  
  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    phone?: string;
  }>({});
  
  const existingBookings = getBookingsForDate(selectedDate);
  const activeServices = services.filter(s => s.isActive);
  
  // Get day availability for selected date
  const getDayAvailability = (dateStr: string) => {
    const date = parseISO(dateStr);
    const dayOfWeek = getDay(date); // 0 = Sunday
    return availability.schedule.find(s => s.dayOfWeek === dayOfWeek);
  };
  
  // Generate time slots based on business hours for selected date
  const timeSlots = useMemo(() => {
    const dayAvail = getDayAvailability(selectedDate);
    if (!dayAvail || !dayAvail.isOpen || dayAvail.blocks.length === 0) {
      return [];
    }
    
    const slots: string[] = [];
    
    dayAvail.blocks.forEach(block => {
      const startMinutes = timeToMinutes(block.start);
      const endMinutes = timeToMinutes(block.end);
      
      for (let mins = startMinutes; mins < endMinutes; mins += 30) {
        const hour = Math.floor(mins / 60);
        const min = mins % 60;
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        
        // Check if time is during a break
        const isDuringBreak = dayAvail.breaks.some(brk => {
          const breakStart = timeToMinutes(brk.start);
          const breakEnd = timeToMinutes(brk.end);
          return mins >= breakStart && mins < breakEnd;
        });
        
        if (!isDuringBreak) {
          slots.push(timeStr);
        }
      }
    });
    
    return slots;
  }, [selectedDate, availability]);
  
  // Check if slot is available (considers bookings, buffer, and booking notice)
  const isSlotAvailable = (time: string) => {
    if (!selectedService) return true;
    
    const dayAvail = getDayAvailability(selectedDate);
    if (!dayAvail || !dayAvail.isOpen) return false;
    
    const startMinutes = timeToMinutes(time);
    const endMinutes = startMinutes + selectedService.duration;
    
    // Check if service fits within business hours
    const fitsInBusinessHours = dayAvail.blocks.some(block => {
      const blockStart = timeToMinutes(block.start);
      const blockEnd = timeToMinutes(block.end);
      return startMinutes >= blockStart && endMinutes <= blockEnd;
    });
    
    if (!fitsInBusinessHours) return false;
    
    // Check if service overlaps with breaks
    const overlapWithBreak = dayAvail.breaks.some(brk => {
      const breakStart = timeToMinutes(brk.start);
      const breakEnd = timeToMinutes(brk.end);
      return (startMinutes < breakEnd && endMinutes > breakStart);
    });
    
    if (overlapWithBreak) return false;
    
    // Check booking notice (can't book within X hours)
    const slotDateTime = new Date(`${selectedDate}T${time}`);
    const minBookingTime = addHours(new Date(), business.bookingNotice);
    if (!isAfter(slotDateTime, minBookingTime)) return false;
    
    // Check conflicts with existing bookings (including buffer time)
    const hasConflict = existingBookings.some(booking => {
      const bookingStart = timeToMinutes(booking.startTime);
      const bookingEnd = timeToMinutes(booking.endTime);
      const bookingEndWithBuffer = bookingEnd + BUFFER_MINUTES;
      return (startMinutes < bookingEndWithBuffer && endMinutes > bookingStart);
    });
    
    return !hasConflict;
  };
  
  // Check if a day is open
  const isDayOpen = (dateStr: string) => {
    const dayAvail = getDayAvailability(dateStr);
    return dayAvail?.isOpen ?? false;
  };
  
  const calculateEndTime = (startTime: string, duration: number) => {
    const [hour, min] = startTime.split(':').map(Number);
    const totalMinutes = hour * 60 + min + duration;
    const endHour = Math.floor(totalMinutes / 60);
    const endMin = totalMinutes % 60;
    return `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
  };
  
  // Validate form fields
  const validateForm = () => {
    const errors: { email?: string; phone?: string } = {};
    
    if (!isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!isValidPhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const canProceed = () => {
    switch (step) {
      case 0: return selectedService !== null;
      case 1: return selectedDate && selectedTime && isDayOpen(selectedDate);
      case 2: {
        const hasRequiredFields = formData.firstName && formData.lastName && formData.email && formData.phone;
        const hasValidEmail = isValidEmail(formData.email);
        const hasValidPhone = isValidPhone(formData.phone);
        return hasRequiredFields && hasValidEmail && hasValidPhone;
      }
      case 3: return true;
      default: return false;
    }
  };
  
  const handleSubmit = async () => {
    if (!selectedService || !selectedTime) return;
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Check if client exists by email
      let clientId = clients.find(c => c.email === formData.email)?.id;
      
      if (!clientId) {
        // Generate client ID BEFORE adding to ensure we have the correct ID
        clientId = generateId('cli');
        /* eslint-disable @typescript-eslint/no-explicit-any */
        addClient({
          id: clientId, // Pass the pre-generated ID
          businessId: business.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        } as any);
        /* eslint-enable @typescript-eslint/no-explicit-any */
      }
      
      addBooking({
        businessId: business.id,
        clientId: clientId,
        serviceId: selectedService.id,
        date: selectedDate,
        startTime: selectedTime,
        endTime: calculateEndTime(selectedTime, selectedService.duration),
        status: 'pending',
        price: selectedService.price,
      });
      
      setIsSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4A574', '#B8A4C9', '#7DB87D', '#E5C07B'],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-12 h-12 text-sage" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-warm-brown mb-2">Booking Requested! 🎉</h1>
          <p className="text-muted-foreground mb-8">
            {business.name} will confirm your appointment shortly.
          </p>
          
          <Card className="shadow-soft text-left">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Booking Details</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-gold" />
                  <div>
                    <p className="font-medium">{selectedService?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedService?.duration} mins • €{selectedService?.price}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-lavender" />
                  <div>
                    <p className="font-medium">
                      {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedTime} - {selectedService && calculateEndTime(selectedTime!, selectedService.duration)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-lavender/10 rounded-lg">
                <p className="text-sm text-lavender font-medium">📧 Check your email</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We&apos;ve sent a confirmation to {formData.email}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <p className="text-sm text-muted-foreground mt-6">
            {business.cancellationPolicy}
          </p>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-border py-6">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-warm-brown">{business.name}</h1>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
            <MapPin className="w-4 h-4" />
            <span>{business.address}, {business.city}</span>
          </div>
        </div>
      </header>
      
      {/* Progress */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${i < step ? 'bg-sage text-white' : 
                  i === step ? 'bg-gold text-white' : 
                  'bg-muted text-muted-foreground'}
              `}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 mx-1 ${
                  i < step ? 'bg-sage' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2">{STEPS[step]}</p>
      </div>
      
      {/* Content */}
      <div className="container max-w-2xl mx-auto px-4 pb-24">
        <AnimatePresence mode="wait">
          {/* Step 0: Select Service */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-semibold text-warm-brown mb-4">
                Choose a Service
              </h2>
              
              {categories.map((category) => {
                const categoryServices = activeServices.filter(s => s.categoryId === category.id);
                if (categoryServices.length === 0) return null;
                
                return (
                  <div key={category.id} className="mb-6">
                    <h3 className="font-medium text-muted-foreground mb-3">{category.name}</h3>
                    <div className="space-y-3">
                      {categoryServices.map((service) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          onSelect={() => setSelectedService(service)}
                          isSelected={selectedService?.id === service.id}
                          showActions={false}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
          
          {/* Step 1: Select Date & Time */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-semibold text-warm-brown mb-4">
                Choose Date & Time
              </h2>
              
              {/* Date Selection */}
              <div className="mb-6">
                <h3 className="font-medium text-muted-foreground mb-3">Select Date</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {Array.from({ length: 14 }, (_, i) => {
                    const date = addDays(new Date(), i + 1);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const isSelected = selectedDate === dateStr;
                    const isOpen = isDayOpen(dateStr);
                    
                    return (
                      <motion.button
                        key={dateStr}
                        whileHover={isOpen ? { scale: 1.05 } : {}}
                        whileTap={isOpen ? { scale: 0.95 } : {}}
                        onClick={() => {
                          if (isOpen) {
                            setSelectedDate(dateStr);
                            setSelectedTime(null);
                          }
                        }}
                        disabled={!isOpen}
                        className={`
                          flex flex-col items-center p-3 rounded-xl min-w-[70px] transition-all
                          ${!isOpen 
                            ? 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                            : isSelected 
                              ? 'bg-gold text-white' 
                              : 'bg-white border border-border hover:border-gold'}
                        `}
                      >
                        <span className="text-xs">{format(date, 'EEE')}</span>
                        <span className="text-lg font-semibold">{format(date, 'd')}</span>
                        <span className="text-xs">{isOpen ? format(date, 'MMM') : 'Closed'}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              
              {/* Time Selection */}
              <div>
                <h3 className="font-medium text-muted-foreground mb-3">Select Time</h3>
                <div className="flex flex-wrap gap-2">
                  {timeSlots.map((time) => {
                    const available = isSlotAvailable(time);
                    return (
                      <TimeSlot
                        key={time}
                        time={time}
                        isSelected={selectedTime === time}
                        isDisabled={!available}
                        onClick={() => available && setSelectedTime(time)}
                      />
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Step 2: Your Details */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-semibold text-warm-brown mb-4">
                Your Details
              </h2>
              
              <Card className="shadow-soft">
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="Emma"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="O'Brien"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
                      }}
                      placeholder="emma@example.com"
                      className={formErrors.email ? 'border-red-500' : ''}
                    />
                    {formErrors.email && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined });
                      }}
                      placeholder="+353 87 123 4567"
                      className={formErrors.phone ? 'border-red-500' : ''}
                    />
                    {formErrors.phone && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.phone}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {/* Step 3: Confirm */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-semibold text-warm-brown mb-4">
                Confirm Booking
              </h2>
              
              <Card className="shadow-soft">
                <CardContent className="p-6 space-y-4">
                  {/* Service */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${selectedService?.color}20` }}>
                      <Sparkles className="w-5 h-5" style={{ color: selectedService?.color }} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Service</p>
                      <p className="font-medium">{selectedService?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedService?.duration} mins • €{selectedService?.price}
                      </p>
                    </div>
                  </div>
                  
                  {/* Date & Time */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-lavender/20 rounded-lg">
                      <Calendar className="w-5 h-5 text-lavender" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date & Time</p>
                      <p className="font-medium">
                        {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedTime} - {selectedService && calculateEndTime(selectedTime!, selectedService.duration)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Client */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sage/20 rounded-lg">
                      <User className="w-5 h-5 text-sage" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Your Details</p>
                      <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                      <p className="text-sm text-muted-foreground">{formData.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <p className="text-sm text-muted-foreground mt-4">
                {business.cancellationPolicy}
              </p>
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4">
        <div className="container max-w-2xl mx-auto flex gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 bg-gold hover:bg-gold-dark text-white"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-gold hover:bg-gold-dark text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Booking
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
