'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TimeSlotProps {
  time: string;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
}

export function TimeSlot({ time, isSelected, isDisabled, onClick }: TimeSlotProps) {
  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.05 } : undefined}
      whileTap={!isDisabled ? { scale: 0.95 } : undefined}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'px-4 py-2 rounded-full text-sm font-medium transition-all',
        'border-2',
        isSelected && 'bg-gold border-gold text-white',
        !isSelected && !isDisabled && 'bg-white border-border hover:border-gold hover:text-gold',
        isDisabled && 'bg-muted border-muted text-muted-foreground cursor-not-allowed opacity-50'
      )}
    >
      {time}
    </motion.button>
  );
}
