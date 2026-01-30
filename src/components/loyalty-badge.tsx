'use client';

import { motion } from 'framer-motion';
import { Star, Crown, Award, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoyaltyBadgeProps {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points?: number;
  showPoints?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const tierConfig = {
  bronze: {
    icon: Medal,
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    border: 'border-amber-200',
    label: 'Bronze',
  },
  silver: {
    icon: Award,
    color: 'text-gray-500',
    bg: 'bg-gray-100',
    border: 'border-gray-200',
    label: 'Silver',
  },
  gold: {
    icon: Star,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    border: 'border-yellow-200',
    label: 'Gold',
  },
  platinum: {
    icon: Crown,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    border: 'border-purple-200',
    label: 'Platinum',
  },
};

const sizeConfig = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function LoyaltyBadge({ tier, points, showPoints = false, size = 'sm' }: LoyaltyBadgeProps) {
  const config = tierConfig[tier];
  const Icon = config.icon;
  
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium border',
        config.bg,
        config.color,
        config.border,
        sizeConfig[size]
      )}
    >
      <Icon className={cn(
        size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
      )} />
      <span>{config.label}</span>
      {showPoints && points !== undefined && (
        <span className="opacity-75">• {points} pts</span>
      )}
    </motion.span>
  );
}

// Referral Badge
export function ReferralBadge({ count }: { count: number }) {
  if (count === 0) return null;
  
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-sage/20 text-sage font-medium"
    >
      <span>👥</span>
      <span>{count} referral{count !== 1 ? 's' : ''}</span>
    </motion.span>
  );
}
