'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Calendar, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Notification {
  id: string;
  bookingId: string;
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  timestamp: number;
}

export function BookingNotifier() {
  const { bookings, getClientById, getServiceById, updateBookingStatus } = useStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const previousBookingCount = useRef(bookings.length);
  const previousBookingIds = useRef(new Set(bookings.map(b => b.id)));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Create audio element for notification sound
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JkZuTi4J4cXp/hoyQkI2FesCAf4eKgoeli32teleG');
  }, []);
  
  // Poll for new bookings
  useEffect(() => {
    const checkForNewBookings = () => {
      const currentIds = new Set(bookings.map(b => b.id));
      
      // Find new bookings
      bookings.forEach(booking => {
        if (!previousBookingIds.current.has(booking.id)) {
          const client = getClientById(booking.clientId);
          const service = getServiceById(booking.serviceId);
          
          if (client && service) {
            const newNotification: Notification = {
              id: `notif_${Date.now()}`,
              bookingId: booking.id,
              clientName: `${client.firstName} ${client.lastName}`,
              serviceName: service.name,
              date: booking.date,
              time: booking.startTime,
              timestamp: Date.now(),
            };
            
            setNotifications(prev => [newNotification, ...prev].slice(0, 10));
            setShowPanel(true);
            
            // Play sound
            if (audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
            
            // Browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('New Booking! 🎉', {
                body: `${client.firstName} booked ${service.name} for ${format(parseISO(booking.date), 'MMM d')} at ${booking.startTime}`,
                icon: '/favicon.ico',
              });
            }
          }
        }
      });
      
      previousBookingIds.current = currentIds;
      previousBookingCount.current = bookings.length;
    };
    
    // Check immediately and then every 2 seconds
    checkForNewBookings();
    const interval = setInterval(checkForNewBookings, 2000);
    
    return () => clearInterval(interval);
  }, [bookings, getClientById, getServiceById]);
  
  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
  
  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  const confirmBooking = (bookingId: string, notifId: string) => {
    updateBookingStatus(bookingId, 'confirmed');
    dismissNotification(notifId);
  };
  
  const unreadCount = notifications.length;
  
  return (
    <>
      {/* Floating notification button */}
      <motion.button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 w-14 h-14 bg-gold rounded-full shadow-lg flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={unreadCount > 0 ? { 
          boxShadow: ['0 0 0 0 rgba(212, 165, 116, 0.7)', '0 0 0 20px rgba(212, 165, 116, 0)'],
        } : {}}
        transition={unreadCount > 0 ? { 
          duration: 1.5, 
          repeat: Infinity,
        } : {}}
      >
        <Bell className="w-6 h-6 text-white" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center"
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>
      
      {/* Notification panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-40 right-4 md:bottom-24 md:right-8 z-50 w-80 max-h-96 bg-white rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            <div className="p-4 border-b border-border bg-cream flex items-center justify-between">
              <h3 className="font-semibold text-warm-brown">New Bookings</h3>
              <button onClick={() => setShowPanel(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No new bookings</p>
                  <p className="text-sm mt-1">New bookings will appear here instantly</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 hover:bg-cream/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-warm-brown truncate">
                            {notif.clientName}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {notif.serviceName}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{format(parseISO(notif.date), 'MMM d')} at {notif.time}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => confirmBooking(notif.bookingId, notif.id)}
                          className="flex-1 bg-sage hover:bg-sage/90 text-white"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => dismissNotification(notif.id)}
                          className="flex-1"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-border bg-cream">
              <Link href="/app/bookings">
                <Button variant="ghost" className="w-full text-sm">
                  View all bookings →
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Toast notification for new bookings */}
      <AnimatePresence>
        {notifications.length > 0 && !showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-40 right-4 md:bottom-24 md:right-24 z-40"
          >
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-white rounded-xl shadow-lg border-2 border-gold p-4 max-w-xs"
            >
              <p className="font-semibold text-warm-brown">🎉 New booking!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {notifications[0]?.clientName} just booked
              </p>
              <button
                onClick={() => setShowPanel(true)}
                className="text-sm text-gold font-medium mt-2"
              >
                View details →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
