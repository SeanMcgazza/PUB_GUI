'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  className?: string;
  iconColor?: string;
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  className,
  iconColor = 'text-gold'
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('shadow-soft hover:shadow-soft-lg transition-shadow', className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-semibold tracking-tight">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
              {trend && (
                <p className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-sage' : 'text-dusty-rose'
                )}>
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last week
                </p>
              )}
            </div>
            <div className={cn('p-3 rounded-xl bg-muted', iconColor)}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
