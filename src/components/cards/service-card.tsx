'use client';

import { Service } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Euro, MoreVertical, Edit, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ServiceCardProps {
  service: Service;
  onEdit?: (service: Service) => void;
  onDelete?: (service: Service) => void;
  onToggleActive?: (service: Service) => void;
  onSelect?: (service: Service) => void;
  isSelected?: boolean;
  showActions?: boolean;
}

export function ServiceCard({ 
  service, 
  onEdit, 
  onDelete, 
  onToggleActive,
  onSelect,
  isSelected,
  showActions = true 
}: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          'shadow-soft hover:shadow-soft-lg transition-all cursor-pointer',
          isSelected && 'ring-2 ring-gold',
          !service.isActive && 'opacity-60'
        )}
        onClick={() => onSelect?.(service)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: service.color || '#D4A574' }}
                />
                <h3 className="font-semibold text-warm-brown">{service.name}</h3>
              </div>
              {service.description && (
                <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {service.duration} mins
                </span>
                <span className="flex items-center gap-1 font-medium text-warm-brown">
                  <Euro className="w-4 h-4" />
                  {service.price}
                </span>
              </div>
            </div>
            
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(service); }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleActive?.(service); }}>
                    {service.isActive ? 'Deactivate' : 'Activate'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onDelete?.(service); }}
                    className="text-dusty-rose"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {!service.isActive && (
            <Badge variant="secondary" className="mt-2">Inactive</Badge>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
