'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, User } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function NewClientPage() {
  const router = useRouter();
  const { addClient } = useStore();
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    hairFormula: '',
    allergies: '',
    preferences: '',
    notes: '',
  });
  
  const isValid = formData.firstName && formData.lastName && formData.email && formData.phone;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    
    addClient({
      businessId: 'biz_001',
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      hairFormula: formData.hairFormula || undefined,
      allergies: formData.allergies || undefined,
      preferences: formData.preferences || undefined,
      notes: formData.notes || undefined,
    });
    
    setIsSuccess(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#D4A574', '#B8A4C9', '#7DB87D'],
    });
    
    setTimeout(() => {
      router.push('/app/clients');
    }, 1500);
  };
  
  if (isSuccess) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-12 h-12 text-sage" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-warm-brown mb-2">Client Added! 🎉</h1>
          <p className="text-muted-foreground">
            {formData.firstName} {formData.lastName} has been added to your client book.
          </p>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <h1 className="text-2xl md:text-3xl font-bold text-warm-brown">Add Client</h1>
        <p className="text-muted-foreground">Add a new client to your book</p>
      </motion.div>
      
      <form onSubmit={handleSubmit}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Basic Info */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-gold" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Emma"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="O'Brien"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="emma@example.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+353 87 123 4567"
                  required
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Hair Info */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                🎨 Hair Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hairFormula">Hair Formula</Label>
                <Textarea
                  id="hairFormula"
                  value={formData.hairFormula}
                  onChange={(e) => setFormData({ ...formData, hairFormula: e.target.value })}
                  placeholder="e.g., 6N + 7G (1:1) 20vol, 35 mins"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Record colour formulas, processing times, etc.
                </p>
              </div>
              
              <div>
                <Label htmlFor="allergies">Allergies & Sensitivities</Label>
                <Input
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="e.g., PPD sensitive, latex allergy"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will show as a warning on bookings
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Notes */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                📝 Notes & Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="preferences">Preferences</Label>
                <Input
                  id="preferences"
                  value={formData.preferences}
                  onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                  placeholder="e.g., Tea with milk, prefers mornings"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any other notes about this client..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!isValid}
              className="bg-gold hover:bg-gold-dark text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
