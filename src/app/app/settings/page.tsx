'use client';

import { useState, useEffect } from 'react';
import { usePub } from '@/hooks/usePub';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { 
  Building2, Copy, Check, ExternalLink, Loader2
} from 'lucide-react';

export default function SettingsPage() {
  const { pub, updatePub } = usePub();
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [form, setForm] = useState({
    name: pub?.name || '',
    address: pub?.address || '',
    phone: pub?.phone || '',
    logo_url: pub?.logo_url || '',
  });

  // Sync form when pub finishes loading. Was previously useState(callback)
  // which is a lazy initializer and runs only once on mount when pub is null.
  useEffect(() => {
    if (pub) {
      setForm({
        name: pub.name || '',
        address: pub.address || '',
        phone: pub.phone || '',
        logo_url: pub.logo_url || '',
      });
    }
  }, [pub]);

  const orderingUrl = typeof window !== 'undefined' && pub
    ? `${window.location.origin}/order/${pub.slug}`
    : '';
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(orderingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleSave = async () => {
    if (!pub) return;
    
    setSaving(true);
    try {
      await updatePub({
        name: form.name,
        address: form.address || null,
        phone: form.phone || null,
        logo_url: form.logo_url || null,
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-muted-foreground">
          Manage your pub settings
        </p>
      </motion.div>
      
      <div className="space-y-6">
        {/* Business Info */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-700" />
              Pub Information
            </CardTitle>
            <CardDescription>
              Your pub details shown to customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Pub Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 High Street, London"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+44 20 1234 5678"
              />
            </div>
            
            <div>
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                type="url"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            
            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Ordering Link */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Your Ordering Link</CardTitle>
            <CardDescription>
              This is the base URL for your pub. Each table has a unique QR code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                value={orderingUrl}
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
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(orderingUrl, '_blank')}
                className="flex-shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-800">
                <strong>💡 Tip:</strong> Go to Tables → Generate QR codes for each table, 
                then print and place them on your tables. Customers scan to order!
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Pub Slug */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Your Pub Slug</CardTitle>
            <CardDescription>
              This is the unique identifier in your URL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                value={pub?.slug || ''}
                readOnly
                className="font-mono text-sm bg-gray-50"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              The slug was set during onboarding and cannot be changed.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
