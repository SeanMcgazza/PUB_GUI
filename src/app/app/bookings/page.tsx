'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { BookingCard } from '@/components/cards/booking-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ClipboardList } from 'lucide-react';
import { format, isAfter, parseISO, isBefore, startOfDay } from 'date-fns';
import Link from 'next/link';

export default function BookingsPage() {
  const { bookings, getClientById, getServiceById, updateBookingStatus } = useStore();
  const [tab, setTab] = useState('upcoming');
  
  const today = startOfDay(new Date());
  
  const upcomingBookings = bookings
    .filter(b => {
      const bookingDate = parseISO(b.date);
      return (isAfter(bookingDate, today) || format(bookingDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) && 
             b.status !== 'cancelled' && b.status !== 'completed' && b.status !== 'no-show';
    })
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  
  const pastBookings = bookings
    .filter(b => {
      const bookingDate = parseISO(b.date);
      return isBefore(bookingDate, today) || b.status === 'completed' || b.status === 'no-show';
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  
  const cancelledBookings = bookings
    .filter(b => b.status === 'cancelled')
    .sort((a, b) => b.date.localeCompare(a.date));
  
  const renderBookings = (bookingList: typeof bookings) => {
    if (bookingList.length === 0) {
      return (
        <EmptyState
          icon={ClipboardList}
          title="No bookings"
          description="No bookings found in this category"
        />
      );
    }
    
    return (
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {bookingList.map((booking) => {
            const client = getClientById(booking.clientId);
            const service = getServiceById(booking.serviceId);
            if (!client || !service) return null;
            
            return (
              <BookingCard
                key={booking.id}
                booking={booking}
                client={client}
                service={service}
                showDate
                onConfirm={(b) => updateBookingStatus(b.id, 'confirmed')}
                onCancel={(b) => updateBookingStatus(b.id, 'cancelled')}
                onComplete={(b) => updateBookingStatus(b.id, 'completed')}
                onNoShow={(b) => updateBookingStatus(b.id, 'no-show')}
              />
            );
          })}
        </AnimatePresence>
      </div>
    );
  };
  
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-warm-brown">Bookings</h1>
          <p className="text-muted-foreground">
            Manage all your appointments
          </p>
        </div>
        
        <Link href="/app/bookings/new">
          <Button className="bg-gold hover:bg-gold-dark text-white w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </Link>
      </motion.div>
      
      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted w-full md:w-auto">
          <TabsTrigger value="upcoming" className="flex-1 md:flex-none">
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex-1 md:flex-none">
            Past ({pastBookings.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex-1 md:flex-none">
            Cancelled ({cancelledBookings.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-6">
          {renderBookings(upcomingBookings)}
        </TabsContent>
        
        <TabsContent value="past" className="mt-6">
          {renderBookings(pastBookings)}
        </TabsContent>
        
        <TabsContent value="cancelled" className="mt-6">
          {renderBookings(cancelledBookings)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
