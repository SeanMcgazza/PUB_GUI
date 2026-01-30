'use client';

import { Booking, Client, Service } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { ClientAvatar } from '@/components/ui/client-avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Clock, Euro, MoreVertical, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface BookingCardProps {
  booking: Booking;
  client: Client;
  service: Service;
  onClick?: (booking: Booking) => void;
  onConfirm?: (booking: Booking) => void;
  onCancel?: (booking: Booking) => void;
  onComplete?: (booking: Booking) => void;
  onNoShow?: (booking: Booking) => void;
  showDate?: boolean;
  compact?: boolean;
}

export function BookingCard({ 
  booking, 
  client, 
  service,
  onClick,
  onConfirm,
  onCancel,
  onComplete,
  onNoShow,
  showDate = false,
  compact = false
}: BookingCardProps) {
  const fullName = `${client.firstName} ${client.lastName}`;
  const isPast = booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'no-show';
  
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 py-2"
      >
        <div className="w-14 text-center">
          <p className="text-sm font-semibold text-gold">{booking.startTime}</p>
        </div>
        <div 
          className="w-1 h-10 rounded-full"
          style={{ backgroundColor: service.color || '#D4A574' }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{fullName}</p>
          <p className="text-sm text-muted-foreground truncate">{service.name}</p>
        </div>
        <StatusBadge status={booking.status} />
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          'shadow-soft hover:shadow-soft-lg transition-all cursor-pointer overflow-hidden',
          isPast && 'opacity-75'
        )}
        onClick={() => onClick?.(booking)}
      >
        <div 
          className="h-1.5"
          style={{ backgroundColor: service.color || '#D4A574' }}
        />
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <ClientAvatar name={fullName} image={client.avatar} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-warm-brown">{fullName}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {booking.status === 'pending' && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onConfirm?.(booking); }}>
                        <Check className="w-4 h-4 mr-2 text-sage" />
                        Confirm
                      </DropdownMenuItem>
                    )}
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onComplete?.(booking); }}>
                          <Check className="w-4 h-4 mr-2 text-lavender" />
                          Mark Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onNoShow?.(booking); }}>
                          <AlertCircle className="w-4 h-4 mr-2" />
                          No Show
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); onCancel?.(booking); }}
                          className="text-dusty-rose"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">{service.name}</p>
              
              <div className="flex items-center flex-wrap gap-3 text-sm">
                {showDate && (
                  <span className="text-muted-foreground">
                    {format(parseISO(booking.date), 'EEE, MMM d')}
                  </span>
                )}
                <span className="flex items-center gap-1 text-gold font-medium">
                  <Clock className="w-4 h-4" />
                  {booking.startTime} - {booking.endTime}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Euro className="w-4 h-4" />
                  {booking.price}
                </span>
                <StatusBadge status={booking.status} />
              </div>
              
              {booking.notes && (
                <p className="mt-2 text-sm text-muted-foreground italic">
                  &quot;{booking.notes}&quot;
                </p>
              )}
              
              {client.allergies && (
                <div className="mt-2 flex items-center gap-1 text-xs text-dusty-rose">
                  <AlertCircle className="w-3 h-3" />
                  {client.allergies}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
