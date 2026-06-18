'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePub } from '@/hooks/usePub';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import {
  Building2, Copy, Check, ExternalLink, Loader2, CreditCard, AlertCircle
} from 'lucide-react';

export default function SettingsPage() {
  const { pub, updatePub } = usePub();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Stripe Connect state — refreshed from /api/stripe/connect/status when
  // the user returns from the hosted onboarding (?stripe_connected=true).
  const [stripeStatus, setStripeStatus] = useState<{
    connected: boolean;
    chargesEnabled: boolean;
    requirements?: string[];
  } | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

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

    // logo_url is interpolated into CSS on the customer page, so force https
    // (matches the DB CHECK constraint; gives a friendly message instead of a
    // raw DB error). See audit C13.
    const logo = form.logo_url.trim();
    if (logo && !/^https:\/\//i.test(logo)) {
      alert('Logo URL must start with https://');
      return;
    }

    setSaving(true);
    try {
      await updatePub({
        name: form.name,
        address: form.address || null,
        phone: form.phone || null,
        logo_url: logo || null,
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Refresh Stripe Connect status from the server. Called on mount, when the
  // user returns from onboarding, and after clicking Connect.
  const refreshStripeStatus = useCallback(async () => {
    setStripeLoading(true);
    setStripeError(null);
    try {
      const res = await fetch('/api/stripe/connect/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStripeStatus({
        connected: Boolean(data.connected),
        chargesEnabled: Boolean(data.chargesEnabled),
        requirements: data.requirements ?? [],
      });
    } catch (err) {
      console.error('Stripe status error:', err);
      setStripeError('Could not load Stripe status');
    } finally {
      setStripeLoading(false);
    }
  }, []);

  // Initial status load.
  useEffect(() => {
    if (pub) refreshStripeStatus();
  }, [pub, refreshStripeStatus]);

  // If the user just returned from Stripe onboarding, re-check status.
  useEffect(() => {
    if (searchParams.get('stripe_connected') === 'true') {
      refreshStripeStatus();
    }
  }, [searchParams, refreshStripeStatus]);

  // Click handler for Connect Stripe / Continue onboarding.
  const handleConnectStripe = async () => {
    setStripeLoading(true);
    setStripeError(null);
    try {
      const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to start Stripe onboarding');
      }
      // Redirect into Stripe's hosted onboarding flow.
      window.location.href = data.url;
    } catch (err) {
      console.error('Connect Stripe error:', err);
      setStripeError(err instanceof Error ? err.message : 'Failed');
      setStripeLoading(false);
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
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your pub settings
        </p>
      </motion.div>
      
      <div className="space-y-6">
        {/* Business Info */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
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
            
            <div className="mt-4 p-4 bg-[color:var(--theme-surface-elevated)] rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>💡 Tip:</strong> Go to Tables → Generate QR codes for each table, 
                then print and place them on your tables. Customers scan to order!
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Stripe Connect — receive card payments */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              Receive payments
            </CardTitle>
            <CardDescription>
              Connect Stripe so customers can pay by card. Money goes directly
              to your bank account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stripeError && (
              <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{stripeError}</span>
              </div>
            )}

            {stripeLoading && !stripeStatus ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking Stripe status…
              </div>
            ) : stripeStatus?.connected && stripeStatus.chargesEnabled ? (
              // Fully connected and ready to accept payments.
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Stripe connected — ready to accept payments</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Customer payments will be deposited to the bank account you
                  registered with Stripe. Stripe takes ~1.4% + €0.25 per EU card.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://dashboard.stripe.com/test', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Stripe dashboard
                </Button>
              </div>
            ) : stripeStatus?.connected && !stripeStatus.chargesEnabled ? (
              // Started but didn't finish — show "Continue onboarding".
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Stripe needs more info</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Onboarding isn&apos;t complete yet. Stripe still needs some details
                  before payments can be accepted.
                </p>
                {stripeStatus.requirements && stripeStatus.requirements.length > 0 && (
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {stripeStatus.requirements.slice(0, 5).map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                )}
                <Button
                  onClick={handleConnectStripe}
                  disabled={stripeLoading}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {stripeLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Continue Stripe onboarding
                </Button>
              </div>
            ) : (
              // Not yet connected.
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sign up your business with Stripe — takes about 5 minutes.
                  You&apos;ll provide your bank IBAN and a few business details;
                  Stripe handles PCI compliance and pays you out.
                </p>
                <Button
                  onClick={handleConnectStripe}
                  disabled={stripeLoading}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {stripeLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <CreditCard className="w-4 h-4 mr-2" />
                  Connect Stripe
                </Button>
              </div>
            )}
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
                className="font-mono text-sm bg-[color:var(--theme-surface-card-hover)]/40"
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
