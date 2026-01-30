'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ClientAvatarProps {
  name: string;
  image?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export function ClientAvatar({ name, image, size = 'md', className }: ClientAvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  const colorIndex = name.charCodeAt(0) % 5;
  const colors = [
    'bg-gold/20 text-gold-dark',
    'bg-lavender/30 text-purple-700',
    'bg-sage/20 text-green-700',
    'bg-soft-gold/30 text-amber-700',
    'bg-dusty-rose/20 text-red-700',
  ];
  
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={image} alt={name} />
      <AvatarFallback className={cn('font-medium', colors[colorIndex])}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
