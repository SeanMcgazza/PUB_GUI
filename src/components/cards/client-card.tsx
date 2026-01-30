'use client';

import { Client } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { ClientAvatar } from '@/components/ui/client-avatar';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface ClientCardProps {
  client: Client;
  onClick?: (client: Client) => void;
  isSelected?: boolean;
  compact?: boolean;
}

export function ClientCard({ client, onClick, isSelected, compact }: ClientCardProps) {
  const fullName = `${client.firstName} ${client.lastName}`;
  
  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card 
          className={cn(
            'shadow-soft hover:shadow-soft-lg transition-all cursor-pointer',
            isSelected && 'ring-2 ring-gold'
          )}
          onClick={() => onClick?.(client)}
        >
          <CardContent className="p-3 flex items-center gap-3">
            <ClientAvatar name={fullName} image={client.avatar} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{client.phone}</p>
            </div>
            {client.allergies && (
              <AlertTriangle className="w-4 h-4 text-dusty-rose flex-shrink-0" />
            )}
          </CardContent>
        </Card>
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
          'shadow-soft hover:shadow-soft-lg transition-all cursor-pointer',
          isSelected && 'ring-2 ring-gold'
        )}
        onClick={() => onClick?.(client)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <ClientAvatar name={fullName} image={client.avatar} size="lg" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-warm-brown">{fullName}</h3>
                {client.allergies && (
                  <Badge variant="destructive" className="bg-dusty-rose/20 text-dusty-rose border-dusty-rose text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Allergy
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  {client.phone}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  {client.email}
                </p>
              </div>
              
              {client.hairFormula && (
                <div className="mt-3 p-2 bg-lavender/10 rounded-lg">
                  <p className="text-xs font-medium text-lavender">Hair Formula</p>
                  <p className="text-sm text-warm-brown">{client.hairFormula}</p>
                </div>
              )}
              
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>{client.totalVisits} visits</span>
                <span>€{client.totalSpent} spent</span>
                {client.lastVisit && (
                  <span>
                    Last: {formatDistanceToNow(parseISO(client.lastVisit), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
