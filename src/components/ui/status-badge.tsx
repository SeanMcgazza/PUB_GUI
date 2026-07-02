'use client';

import { BookingStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-soft-gold/20 text-amber-700 border-soft-gold',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-sage/20 text-green-700 border-sage',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-dusty-rose/20 text-red-700 border-dusty-rose',
  },
  completed: {
    label: 'Completed',
    className: 'bg-lavender/20 text-purple-700 border-lavender',
  },
  'no-show': {
    label: 'No Show',
    className: 'bg-gray-100 text-gray-600 border-gray-300',
  },
};

interface StatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
