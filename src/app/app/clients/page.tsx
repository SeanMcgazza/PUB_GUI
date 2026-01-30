'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { ClientCard } from '@/components/cards/client-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ClientAvatar } from '@/components/ui/client-avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Users, Phone, Mail, AlertTriangle, 
  Calendar, Euro, Clock, X, Edit, Trash
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Client } from '@/types';

export default function ClientsPage() {
  const { clients, bookings, getServiceById, deleteClient } = useStore();
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const filteredClients = clients.filter((client) => {
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    return fullName.includes(search.toLowerCase()) || 
           client.email.toLowerCase().includes(search.toLowerCase()) ||
           client.phone.includes(search);
  });
  
  const clientBookings = selectedClient 
    ? bookings.filter(b => b.clientId === selectedClient.id).sort((a, b) => b.date.localeCompare(a.date))
    : [];
  
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-warm-brown">Clients</h1>
          <p className="text-muted-foreground">
            {clients.length} clients in your book
          </p>
        </div>
        
        <Button className="bg-gold hover:bg-gold-dark text-white w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </motion.div>
      
      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>
      
      {/* Client List */}
      <AnimatePresence mode="popLayout">
        {filteredClients.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredClients.map((client) => (
              <Sheet key={client.id}>
                <SheetTrigger asChild>
                  <div onClick={() => setSelectedClient(client)}>
                    <ClientCard client={client} />
                  </div>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                  {selectedClient && (
                    <>
                      <SheetHeader className="text-left">
                        <div className="flex items-start gap-4">
                          <ClientAvatar 
                            name={`${selectedClient.firstName} ${selectedClient.lastName}`} 
                            size="lg" 
                          />
                          <div className="flex-1">
                            <SheetTitle className="text-xl">
                              {selectedClient.firstName} {selectedClient.lastName}
                            </SheetTitle>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedClient.allergies && (
                                <span className="inline-flex items-center gap-1 bg-dusty-rose/20 text-dusty-rose px-2 py-0.5 rounded-full text-xs">
                                  <AlertTriangle className="w-3 h-3" />
                                  Allergy Alert
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </SheetHeader>
                      
                      <div className="mt-6 space-y-6">
                        {/* Contact Info */}
                        <div className="space-y-2">
                          <a 
                            href={`tel:${selectedClient.phone}`}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{selectedClient.phone}</span>
                          </a>
                          <a 
                            href={`mailto:${selectedClient.email}`}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{selectedClient.email}</span>
                          </a>
                        </div>
                        
                        {/* Hair Formula */}
                        {selectedClient.hairFormula && (
                          <Card className="border-lavender/30 bg-lavender/5">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-lavender mb-2 flex items-center gap-2">
                                🎨 Hair Formula
                              </h4>
                              <p className="text-warm-brown font-mono text-sm">
                                {selectedClient.hairFormula}
                              </p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Allergies */}
                        {selectedClient.allergies && (
                          <Card className="border-dusty-rose/30 bg-dusty-rose/5">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-dusty-rose mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Allergies
                              </h4>
                              <p className="text-warm-brown text-sm">
                                {selectedClient.allergies}
                              </p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Preferences & Notes */}
                        {(selectedClient.preferences || selectedClient.notes) && (
                          <div className="space-y-3">
                            {selectedClient.preferences && (
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Preferences</h4>
                                <p className="text-sm">{selectedClient.preferences}</p>
                              </div>
                            )}
                            {selectedClient.notes && (
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
                                <p className="text-sm">{selectedClient.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-gold">{selectedClient.totalVisits}</p>
                            <p className="text-xs text-muted-foreground">Visits</p>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-sage">€{selectedClient.totalSpent}</p>
                            <p className="text-xs text-muted-foreground">Total Spent</p>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-lavender">
                              {selectedClient.lastVisit 
                                ? format(parseISO(selectedClient.lastVisit), 'MMM d')
                                : '-'}
                            </p>
                            <p className="text-xs text-muted-foreground">Last Visit</p>
                          </div>
                        </div>
                        
                        {/* Visit History */}
                        <div>
                          <h4 className="font-semibold mb-3">Visit History</h4>
                          {clientBookings.length > 0 ? (
                            <div className="space-y-2">
                              {clientBookings.slice(0, 5).map((booking) => {
                                const service = getServiceById(booking.serviceId);
                                if (!service) return null;
                                
                                return (
                                  <div 
                                    key={booking.id}
                                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                                  >
                                    <div 
                                      className="w-1 h-8 rounded-full"
                                      style={{ backgroundColor: service.color || '#D4A574' }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{service.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {format(parseISO(booking.date), 'MMM d, yyyy')} at {booking.startTime}
                                      </p>
                                    </div>
                                    <StatusBadge status={booking.status} />
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No visits yet</p>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t">
                          <Button variant="outline" className="flex-1">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            className="text-dusty-rose hover:text-dusty-rose"
                            onClick={() => {
                              if (confirm('Delete this client?')) {
                                deleteClient(selectedClient.id);
                                setSelectedClient(null);
                              }
                            }}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </SheetContent>
              </Sheet>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title={search ? 'No clients found' : 'No clients yet'}
            description={search ? 'Try a different search term' : 'Add your first client to get started'}
            action={{
              label: 'Add Client',
              onClick: () => {},
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
