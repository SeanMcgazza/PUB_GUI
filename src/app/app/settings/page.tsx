'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { 
  Building2, Clock, Globe,
  Copy, Check, ExternalLink
} from 'lucide-react';

export default function SettingsPage() {
  const { business, availability, updateBusiness, updateAvailability } = useStore();
  const [activeTab, setActiveTab] = useState('business');
  const [copied, setCopied] = useState(false);
  
  // Form states
  const [businessForm, setBusinessForm] = useState({
    name: business.name,
    email: business.email,
    phone: business.phone,
    address: business.address,
    city: business.city,
    description: business.description,
    cancellationPolicy: business.cancellationPolicy,
    bookingNotice: business.bookingNotice,
  });
  
  const bookingUrl = `https://chairtime.vercel.app/book/${business.slug}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleSaveBusiness = () => {
    updateBusiness(businessForm);
  };
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-warm-brown">Settings</h1>
        <p className="text-muted-foreground">
          Manage your business settings and preferences
        </p>
      </motion.div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted w-full md:w-auto">
          <TabsTrigger value="business">
            <Building2 className="w-4 h-4 mr-2" />
            Business
          </TabsTrigger>
          <TabsTrigger value="availability">
            <Clock className="w-4 h-4 mr-2" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="booking">
            <Globe className="w-4 h-4 mr-2" />
            Booking Page
          </TabsTrigger>
        </TabsList>
        
        {/* Business Settings */}
        <TabsContent value="business" className="mt-6 space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Your business details shown to clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Business Name</Label>
                  <Input
                    id="name"
                    value={businessForm.name}
                    onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={businessForm.phone}
                    onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={businessForm.email}
                  onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={businessForm.address}
                    onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={businessForm.city}
                    onChange={(e) => setBusinessForm({ ...businessForm, city: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={businessForm.description}
                  onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Booking Policies</CardTitle>
              <CardDescription>
                Rules for how clients can book
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notice">Minimum Notice (hours)</Label>
                <Input
                  id="notice"
                  type="number"
                  value={businessForm.bookingNotice}
                  onChange={(e) => setBusinessForm({ ...businessForm, bookingNotice: parseInt(e.target.value) || 0 })}
                  min={0}
                  className="w-32"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  How far in advance clients must book
                </p>
              </div>
              
              <Separator />
              
              <div>
                <Label htmlFor="cancellation">Cancellation Policy</Label>
                <Textarea
                  id="cancellation"
                  value={businessForm.cancellationPolicy}
                  onChange={(e) => setBusinessForm({ ...businessForm, cancellationPolicy: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={handleSaveBusiness} className="bg-gold hover:bg-gold-dark text-white">
              Save Changes
            </Button>
          </div>
        </TabsContent>
        
        {/* Availability Settings */}
        <TabsContent value="availability" className="mt-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Working Hours</CardTitle>
              <CardDescription>
                Set your weekly schedule and break times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availability.schedule.map((day, index) => (
                  <div key={day.dayOfWeek} className="flex items-center gap-4 py-3 border-b last:border-0">
                    <div className="w-24">
                      <span className={`font-medium ${!day.isOpen ? 'text-muted-foreground' : ''}`}>
                        {dayNames[day.dayOfWeek]}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={day.isOpen}
                        onChange={(e) => {
                          const newSchedule = [...availability.schedule];
                          newSchedule[index] = { ...day, isOpen: e.target.checked };
                          updateAvailability({ ...availability, schedule: newSchedule });
                        }}
                        className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
                      />
                      <span className="text-sm text-muted-foreground">Open</span>
                    </div>
                    
                    {day.isOpen && day.blocks[0] && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={day.blocks[0].start}
                          onChange={(e) => {
                            const newSchedule = [...availability.schedule];
                            newSchedule[index] = {
                              ...day,
                              blocks: [{ ...day.blocks[0], start: e.target.value }]
                            };
                            updateAvailability({ ...availability, schedule: newSchedule });
                          }}
                          className="w-32"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={day.blocks[0].end}
                          onChange={(e) => {
                            const newSchedule = [...availability.schedule];
                            newSchedule[index] = {
                              ...day,
                              blocks: [{ ...day.blocks[0], end: e.target.value }]
                            };
                            updateAvailability({ ...availability, schedule: newSchedule });
                          }}
                          className="w-32"
                        />
                        
                        {day.breaks[0] && (
                          <span className="text-sm text-muted-foreground ml-4">
                            Break: {day.breaks[0].start} - {day.breaks[0].end}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {!day.isOpen && (
                      <span className="text-sm text-muted-foreground">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Booking Page Settings */}
        <TabsContent value="booking" className="mt-6 space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Your Booking Link</CardTitle>
              <CardDescription>
                Share this link with clients so they can book online
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  value={bookingUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-sage" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(`/book/${business.slug}`, '_blank')}
                  className="flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="mt-4 p-4 bg-lavender/10 rounded-lg">
                <p className="text-sm text-lavender font-medium">💡 Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add this link to your Instagram bio, Facebook page, and Google Business listing 
                  to let clients book 24/7.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Booking Page Preview</CardTitle>
              <CardDescription>
                How your booking page looks to clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-cream">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">✂️</span>
                  </div>
                  <h3 className="text-xl font-semibold text-warm-brown">{business.name}</h3>
                  <p className="text-sm text-muted-foreground">{business.city}</p>
                </div>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  {business.description}
                </p>
                <Button className="w-full bg-gold hover:bg-gold-dark text-white">
                  Book Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
