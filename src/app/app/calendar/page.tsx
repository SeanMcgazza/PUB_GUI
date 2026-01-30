'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientAvatar } from '@/components/ui/client-avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon
} from 'lucide-react';
import { 
  format, addDays, subDays, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameDay, isToday, addWeeks, subWeeks
} from 'date-fns';
import Link from 'next/link';

const HOURS = Array.from({ length: 11 }, (_, i) => i + 9); // 9am to 7pm

export default function CalendarPage() {
  const [view, setView] = useState<'day' | 'week' | 'agenda'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { getBookingsForDate, getBookingsForWeek, getClientById, getServiceById, updateBookingStatus } = useStore();
  
  const goToToday = () => setCurrentDate(new Date());
  const goBack = () => {
    if (view === 'day') setCurrentDate(subDays(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };
  const goForward = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };
  
  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
  });
  
  const todayBookings = getBookingsForDate(format(currentDate, 'yyyy-MM-dd'));
  const weekBookings = getBookingsForWeek(currentDate);
  
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-warm-brown">Calendar</h1>
          <p className="text-muted-foreground">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goForward}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Link href="/app/bookings/new">
            <Button className="bg-gold hover:bg-gold-dark text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </Link>
        </div>
      </motion.div>
      
      {/* View Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="mb-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
        </TabsList>
        
        <TabsContent value="day" className="mt-6">
          <Card className="shadow-soft overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-[60px_1fr]">
                {/* Time column */}
                <div className="border-r border-border">
                  {HOURS.map((hour) => (
                    <div 
                      key={hour} 
                      className="h-20 border-b border-border/50 text-xs text-muted-foreground p-2"
                    >
                      {format(new Date().setHours(hour, 0), 'h a')}
                    </div>
                  ))}
                </div>
                
                {/* Bookings column */}
                <div className="relative">
                  {HOURS.map((hour) => (
                    <div 
                      key={hour} 
                      className="h-20 border-b border-border/50"
                    />
                  ))}
                  
                  {/* Booking blocks */}
                  {todayBookings.map((booking) => {
                    const client = getClientById(booking.clientId);
                    const service = getServiceById(booking.serviceId);
                    if (!client || !service) return null;
                    
                    const [startHour, startMin] = booking.startTime.split(':').map(Number);
                    const [endHour, endMin] = booking.endTime.split(':').map(Number);
                    const top = ((startHour - 9) * 80) + (startMin / 60 * 80);
                    const duration = (endHour - startHour) * 60 + (endMin - startMin);
                    const height = (duration / 60) * 80;
                    
                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute left-2 right-2 rounded-lg p-2 shadow-soft overflow-hidden cursor-pointer hover:shadow-soft-lg transition-shadow"
                        style={{ 
                          top: `${top}px`, 
                          height: `${height}px`,
                          backgroundColor: service.color || '#D4A574',
                        }}
                      >
                        <div className="text-white">
                          <p className="font-medium text-sm truncate">
                            {client.firstName} {client.lastName}
                          </p>
                          <p className="text-xs opacity-90 truncate">{service.name}</p>
                          <p className="text-xs opacity-75">
                            {booking.startTime} - {booking.endTime}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="week" className="mt-6">
          <Card className="shadow-soft overflow-x-auto">
            <CardContent className="p-0 min-w-[700px]">
              {/* Week header */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
                <div className="p-2" />
                {weekDays.map((day) => (
                  <div 
                    key={day.toISOString()} 
                    className={`p-2 text-center border-l border-border ${
                      isToday(day) ? 'bg-gold/10' : ''
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
                    <p className={`text-lg font-semibold ${
                      isToday(day) ? 'text-gold' : 'text-warm-brown'
                    }`}>
                      {format(day, 'd')}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Time grid */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)]">
                {/* Time column */}
                <div>
                  {HOURS.map((hour) => (
                    <div 
                      key={hour} 
                      className="h-16 border-b border-border/50 text-xs text-muted-foreground p-1"
                    >
                      {format(new Date().setHours(hour, 0), 'h a')}
                    </div>
                  ))}
                </div>
                
                {/* Day columns */}
                {weekDays.map((day) => {
                  const dayBookings = getBookingsForDate(format(day, 'yyyy-MM-dd'));
                  
                  return (
                    <div key={day.toISOString()} className="relative border-l border-border">
                      {HOURS.map((hour) => (
                        <div 
                          key={hour} 
                          className={`h-16 border-b border-border/50 ${
                            isToday(day) ? 'bg-gold/5' : ''
                          }`}
                        />
                      ))}
                      
                      {/* Booking blocks */}
                      {dayBookings.map((booking) => {
                        const service = getServiceById(booking.serviceId);
                        if (!service) return null;
                        
                        const [startHour, startMin] = booking.startTime.split(':').map(Number);
                        const [endHour, endMin] = booking.endTime.split(':').map(Number);
                        const top = ((startHour - 9) * 64) + (startMin / 60 * 64);
                        const duration = (endHour - startHour) * 60 + (endMin - startMin);
                        const height = Math.max((duration / 60) * 64, 24);
                        
                        return (
                          <div
                            key={booking.id}
                            className="absolute left-0.5 right-0.5 rounded text-xs p-1 overflow-hidden"
                            style={{ 
                              top: `${top}px`, 
                              height: `${height}px`,
                              backgroundColor: service.color || '#D4A574',
                            }}
                          >
                            <p className="text-white font-medium truncate text-[10px]">
                              {booking.startTime}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="agenda" className="mt-6">
          <div className="space-y-4">
            {weekDays.map((day) => {
              const dayBookings = getBookingsForDate(format(day, 'yyyy-MM-dd'));
              if (dayBookings.length === 0) return null;
              
              return (
                <Card key={day.toISOString()} className="shadow-soft">
                  <CardContent className="p-4">
                    <h3 className={`font-semibold mb-3 ${
                      isToday(day) ? 'text-gold' : 'text-warm-brown'
                    }`}>
                      {isToday(day) ? 'Today' : format(day, 'EEEE, MMMM d')}
                    </h3>
                    <div className="space-y-2">
                      {dayBookings.map((booking) => {
                        const client = getClientById(booking.clientId);
                        const service = getServiceById(booking.serviceId);
                        if (!client || !service) return null;
                        
                        return (
                          <div 
                            key={booking.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <div 
                              className="w-1 h-10 rounded-full"
                              style={{ backgroundColor: service.color || '#D4A574' }}
                            />
                            <div className="w-16 text-sm font-medium text-gold">
                              {booking.startTime}
                            </div>
                            <ClientAvatar 
                              name={`${client.firstName} ${client.lastName}`} 
                              size="sm" 
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {client.firstName} {client.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {service.name} • {service.duration} mins
                              </p>
                            </div>
                            <StatusBadge status={booking.status} />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
