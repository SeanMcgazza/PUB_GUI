'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ClientCard } from '@/components/cards/client-card';
import { ServiceCard } from '@/components/cards/service-card';
import { TimeSlot } from '@/components/ui/time-slot';
import { ClientAvatar } from '@/components/ui/client-avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, Check, Search, Calendar, 
  Clock, Euro, Sparkles, User, AlertTriangle
} from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { Client, Service } from '@/types';
import confetti from 'canvas-confetti';

const STEPS = ['Client', 'Service', 'Date & Time', 'Confirm'];

// Generate time slots from 9am to 6pm
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 9; hour < 18; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

export default function NewBookingPage() {
  const router = useRouter();
  const { clients, services, categories, addBooking, getBookingsForDate } = useStore();
  
  const [step, setStep] = useState(0);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const timeSlots = generateTimeSlots();
  const existingBookings = getBookingsForDate(selectedDate);
  
  // Check if a time slot is available
  const isSlotAvailable = (time: string) => {
    if (!selectedService) return true;
    
    const [hour, min] = time.split(':').map(Number);
    const startMinutes = hour * 60 + min;
    const endMinutes = startMinutes + selectedService.duration;
    
    return !existingBookings.some(booking => {
      const [bStartH, bStartM] = booking.startTime.split(':').map(Number);
      const [bEndH, bEndM] = booking.endTime.split(':').map(Number);
      const bookingStart = bStartH * 60 + bStartM;
      const bookingEnd = bEndH * 60 + bEndM;
      
      return (startMinutes < bookingEnd && endMinutes > bookingStart);
    });
  };
  
  const calculateEndTime = (startTime: string, duration: number) => {
    const [hour, min] = startTime.split(':').map(Number);
    const totalMinutes = hour * 60 + min + duration;
    const endHour = Math.floor(totalMinutes / 60);
    const endMin = totalMinutes % 60;
    return `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
  };
  
  const filteredClients = clients.filter((client) => {
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    return fullName.includes(clientSearch.toLowerCase()) ||
           client.phone.includes(clientSearch);
  });
  
  const activeServices = services.filter(s => s.isActive);
  
  const canProceed = () => {
    switch (step) {
      case 0: return selectedClient !== null;
      case 1: return selectedService !== null;
      case 2: return selectedDate && selectedTime;
      case 3: return true;
      default: return false;
    }
  };
  
  const handleSubmit = () => {
    if (!selectedClient || !selectedService || !selectedTime) return;
    
    addBooking({
      businessId: 'biz_001',
      clientId: selectedClient.id,
      serviceId: selectedService.id,
      date: selectedDate,
      startTime: selectedTime,
      endTime: calculateEndTime(selectedTime, selectedService.duration),
      status: 'pending',
      price: selectedService.price,
      notes: notes || undefined,
    });
    
    setIsSuccess(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4A574', '#B8A4C9', '#7DB87D', '#E5C07B'],
    });
  };
  
  if (isSuccess) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-12 h-12 text-sage" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-warm-brown mb-2">Booking Created! 🎉</h1>
          <p className="text-muted-foreground mb-8">
            {selectedClient?.firstName}&apos;s appointment has been scheduled
          </p>
          
          <Card className="shadow-soft mb-8 text-left">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <ClientAvatar 
                  name={`${selectedClient?.firstName} ${selectedClient?.lastName}`} 
                  size="lg"
                />
                <div>
                  <p className="font-semibold text-lg">
                    {selectedClient?.firstName} {selectedClient?.lastName}
                  </p>
                  <p className="text-muted-foreground">{selectedService?.name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <Calendar className="w-5 h-5 mx-auto mb-1 text-gold" />
                  <p className="text-sm font-medium">
                    {format(parseISO(selectedDate), 'MMM d')}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-lavender" />
                  <p className="text-sm font-medium">{selectedTime}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <Euro className="w-5 h-5 mx-auto mb-1 text-sage" />
                  <p className="text-sm font-medium">€{selectedService?.price}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push('/app/bookings')}>
              View Bookings
            </Button>
            <Button 
              className="bg-gold hover:bg-gold-dark text-white"
              onClick={() => {
                setIsSuccess(false);
                setStep(0);
                setSelectedClient(null);
                setSelectedService(null);
                setSelectedTime(null);
                setNotes('');
              }}
            >
              Book Another
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Button 
          variant="ghost" 
          onClick={() => step > 0 ? setStep(step - 1) : router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step > 0 ? 'Back' : 'Cancel'}
        </Button>
        
        <h1 className="text-2xl md:text-3xl font-bold text-warm-brown">New Booking</h1>
        
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mt-4">
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
                <div className={`w-8 h-0.5 mx-1 ${
                  i < step ? 'bg-sage' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2">{STEPS[step]}</p>
      </motion.div>
      
      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {filteredClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onClick={() => setSelectedClient(client)}
                  isSelected={selectedClient?.id === client.id}
                  compact
                />
              ))}
            </div>
          </motion.div>
        )}
        
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {categories.map((category) => {
              const categoryServices = activeServices.filter(s => s.categoryId === category.id);
              if (categoryServices.length === 0) return null;
              
              return (
                <div key={category.id} className="mb-6">
                  <h3 className="font-semibold text-warm-brown mb-3">{category.name}</h3>
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
        
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Date Selection */}
            <div className="mb-6">
              <h3 className="font-semibold text-warm-brown mb-3">Select Date</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {Array.from({ length: 14 }, (_, i) => {
                  const date = addDays(new Date(), i);
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const isSelected = selectedDate === dateStr;
                  
                  return (
                    <motion.button
                      key={dateStr}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setSelectedTime(null);
                      }}
                      className={`
                        flex flex-col items-center p-3 rounded-xl min-w-[70px] transition-all
                        ${isSelected 
                          ? 'bg-gold text-white' 
                          : 'bg-white border border-border hover:border-gold'}
                      `}
                    >
                      <span className="text-xs">{format(date, 'EEE')}</span>
                      <span className="text-lg font-semibold">{format(date, 'd')}</span>
                      <span className="text-xs">{format(date, 'MMM')}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
            
            {/* Time Selection */}
            <div>
              <h3 className="font-semibold text-warm-brown mb-3">Select Time</h3>
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
        
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="shadow-soft mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gold/10 rounded-lg">
                    <User className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">
                      {selectedClient?.firstName} {selectedClient?.lastName}
                    </p>
                  </div>
                </div>
                
                {/* Allergy warning */}
                {selectedClient?.allergies && (
                  <div className="flex items-center gap-2 p-2 bg-dusty-rose/10 rounded-lg text-dusty-rose">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{selectedClient.allergies}</span>
                  </div>
                )}
                
                {/* Service */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-lavender/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-lavender" />
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
                  <div className="p-2 bg-sage/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-sage" />
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
                
                {/* Hair Formula */}
                {selectedClient?.hairFormula && (
                  <div className="p-3 bg-lavender/10 rounded-lg">
                    <p className="text-sm font-medium text-lavender mb-1">Hair Formula</p>
                    <p className="text-sm font-mono">{selectedClient.hairFormula}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Notes */}
            <div className="mb-6">
              <label className="text-sm font-medium text-warm-brown mb-2 block">
                Notes (optional)
              </label>
              <Textarea
                placeholder="Any special notes for this appointment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-end gap-3 mt-8 pt-4 border-t"
      >
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="bg-gold hover:bg-gold-dark text-white"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            className="bg-gold hover:bg-gold-dark text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            Create Booking
          </Button>
        )}
      </motion.div>
    </div>
  );
}
