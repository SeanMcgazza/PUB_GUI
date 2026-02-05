'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  Scissors,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Building2,
  User,
  Users,
  MapPin,
  Clock,
  ExternalLink,
  Copy,
  Sparkles,
} from 'lucide-react';

// ============================================================
// Constants
// ============================================================

const TOTAL_STEPS = 6;

interface BusinessHour {
  day: string;
  dayIndex: number;
  open: boolean;
  openTime: string;
  closeTime: string;
}

const defaultHours: BusinessHour[] = [
  { day: 'Monday', dayIndex: 1, open: true, openTime: '09:00', closeTime: '18:00' },
  { day: 'Tuesday', dayIndex: 2, open: true, openTime: '09:00', closeTime: '18:00' },
  { day: 'Wednesday', dayIndex: 3, open: true, openTime: '09:00', closeTime: '18:00' },
  { day: 'Thursday', dayIndex: 4, open: true, openTime: '09:00', closeTime: '18:00' },
  { day: 'Friday', dayIndex: 5, open: true, openTime: '09:00', closeTime: '18:00' },
  { day: 'Saturday', dayIndex: 6, open: true, openTime: '09:00', closeTime: '17:00' },
  { day: 'Sunday', dayIndex: 0, open: false, openTime: '10:00', closeTime: '16:00' },
];

const roles = [
  { id: 'salon_owner', label: 'Salon Owner', icon: Building2, description: 'I own and run a salon' },
  { id: 'independent_stylist', label: 'Independent Stylist', icon: User, description: 'I work independently' },
  { id: 'salon_manager', label: 'Salon Manager', icon: Users, description: 'I manage a salon for someone' },
  { id: 'chair_renter', label: 'Chair Renter', icon: MapPin, description: 'I rent a chair in a salon' },
];

const serviceCategories = [
  { name: 'Cuts', emoji: '✂️' },
  { name: 'Colour', emoji: '🎨' },
  { name: 'Treatments', emoji: '💆' },
  { name: 'Blow Dry', emoji: '💨' },
  { name: 'Bridal', emoji: '💒' },
  { name: 'Barber', emoji: '💈' },
  { name: 'Extensions', emoji: '✨' },
  { name: 'Styling', emoji: '💇' },
];

const defaultServices: Record<string, Array<{ name: string; duration: number; price: number }>> = {
  Cuts: [
    { name: "Ladies' Cut & Blow Dry", duration: 60, price: 55 },
    { name: "Gents' Cut", duration: 30, price: 25 },
    { name: "Kids' Cut", duration: 30, price: 18 },
    { name: 'Dry Cut', duration: 45, price: 35 },
  ],
  Colour: [
    { name: 'Full Head Colour', duration: 90, price: 75 },
    { name: 'Root Touch-Up', duration: 60, price: 50 },
    { name: 'Full Highlights', duration: 120, price: 110 },
    { name: 'Balayage', duration: 150, price: 150 },
  ],
  Treatments: [
    { name: 'Olaplex Treatment', duration: 30, price: 35 },
    { name: 'Deep Conditioning', duration: 30, price: 25 },
    { name: 'Keratin Treatment', duration: 120, price: 180 },
  ],
  'Blow Dry': [
    { name: 'Blow Dry', duration: 45, price: 30 },
    { name: 'Blow Dry & Curls', duration: 45, price: 35 },
  ],
  Bridal: [
    { name: 'Bridal Hair Trial', duration: 90, price: 80 },
    { name: 'Bridal Hair', duration: 90, price: 120 },
    { name: 'Bridesmaids Hair', duration: 60, price: 65 },
  ],
  Barber: [
    { name: "Gents' Cut", duration: 30, price: 20 },
    { name: 'Beard Trim', duration: 15, price: 15 },
    { name: 'Cut & Beard', duration: 45, price: 30 },
    { name: 'Hot Towel Shave', duration: 30, price: 25 },
  ],
  Extensions: [
    { name: 'Tape Extensions', duration: 120, price: 200 },
    { name: 'Clip-In Extensions', duration: 90, price: 150 },
    { name: 'Extension Maintenance', duration: 60, price: 80 },
  ],
  Styling: [
    { name: 'Updo', duration: 60, price: 55 },
    { name: 'Special Occasion', duration: 60, price: 65 },
    { name: 'Blow Dry & Style', duration: 45, price: 35 },
  ],
};

const categoryColors: Record<string, string> = {
  Cuts: '#D4A574',
  Colour: '#B8A4C9',
  Treatments: '#E5C07B',
  'Blow Dry': '#7DB87D',
  Bridal: '#D98B8B',
  Barber: '#D4A574',
  Extensions: '#B8A4C9',
  Styling: '#7DB87D',
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const timeOptions = (() => {
  const options: string[] = [];
  for (let h = 7; h <= 22; h++) {
    options.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 22) options.push(`${String(h).padStart(2, '0')}:30`);
  }
  return options;
})();

// ============================================================
// Page Component
// ============================================================

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState('');
  const [salonName, setSalonName] = useState('');
  const [slug, setSlug] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [hours, setHours] = useState<BusinessHour[]>(defaultHours);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Pre-fill salon name from user metadata
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.business_name) {
        const name = user.user_metadata.business_name;
        setSalonName(name);
        setSlug(generateSlug(name));
      }
    };
    loadUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNameChange = (name: string) => {
    setSalonName(name);
    setSlug(generateSlug(name));
  };

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const updateHours = (index: number, field: keyof BusinessHour, value: string | boolean) => {
    setHours((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  };

  // Save all onboarding data to Supabase
  const handleComplete = useCallback(async () => {
    if (saving || saved) return;
    setSaving(true);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Update profile with business name, slug, and role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          business_name: salonName,
          slug: slug,
          role: role,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Create service categories and default services
      for (let i = 0; i < selectedCategories.length; i++) {
        const catName = selectedCategories[i];
        const { data: category, error: catError } = await supabase
          .from('service_categories')
          .insert({
            business_id: user.id,
            name: catName,
            order: i,
          })
          .select()
          .single();

        if (catError) throw catError;

        const defaults = defaultServices[catName] || [];
        if (defaults.length > 0) {
          const { error: svcError } = await supabase.from('services').insert(
            defaults.map((svc) => ({
              business_id: user.id,
              category_id: category.id,
              name: svc.name,
              duration: svc.duration,
              price: svc.price,
              color: categoryColors[catName] || '#D4A574',
            }))
          );
          if (svcError) throw svcError;
        }
      }

      // 3. Save booking settings with business hours
      const businessHoursJson = hours.map((h) => ({
        day: h.dayIndex,
        open: h.open,
        openTime: h.openTime,
        closeTime: h.closeTime,
      }));

      const { error: settingsError } = await supabase.from('booking_settings').upsert(
        {
          business_id: user.id,
          business_hours: businessHoursJson,
        },
        { onConflict: 'business_id' }
      );

      if (settingsError) throw settingsError;

      setSaved(true);

      // Fire confetti!
      try {
        const confettiModule = await import('canvas-confetti');
        confettiModule.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti is just eye candy, ignore failures
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSaving(false);
    }
  }, [saving, saved, supabase, salonName, slug, role, selectedCategories, hours]);

  // Trigger save when reaching completion step
  useEffect(() => {
    if (step === 5 && !saved && !saving) {
      handleComplete();
    }
  }, [step, saved, saving, handleComplete]);

  const copyLink = () => {
    navigator.clipboard.writeText(`https://chairtime.vercel.app/book/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Can the user proceed to the next step?
  const canContinue = (): boolean => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return !!role;
      case 2:
        return salonName.trim().length >= 2 && slug.length >= 2;
      case 3:
        return selectedCategories.length > 0;
      case 4:
        return hours.some((h) => h.open);
      default:
        return false;
    }
  };

  const goNext = () => {
    if (canContinue() && step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  // ============================================================
  // Step Renderers
  // ============================================================

  const renderWelcome = () => (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="p-5 bg-gold rounded-3xl mb-8 shadow-soft-lg"
      >
        <Scissors className="w-12 h-12 text-white" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl md:text-4xl font-bold text-warm-brown mb-3 text-center"
      >
        Welcome to ChairTime
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-center max-w-md mb-10 text-lg"
      >
        Let&apos;s get your salon set up in just a few minutes. We&apos;ll walk you through
        everything.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          onClick={goNext}
          className="btn-pill bg-gold hover:bg-gold-dark text-white px-10 py-6 text-lg shadow-soft"
        >
          Let&apos;s Go
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );

  const renderRole = () => (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <h2 className="text-2xl font-bold text-warm-brown mb-2 text-center">
          What describes you best?
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          This helps us tailor ChairTime to your needs
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={cn(
                'p-5 rounded-2xl border-2 text-left transition-all',
                role === r.id
                  ? 'border-gold bg-gold/5 shadow-soft'
                  : 'border-border bg-white hover:border-gold/50'
              )}
            >
              <r.icon
                className={cn('w-8 h-8 mb-3', role === r.id ? 'text-gold' : 'text-muted-foreground')}
              />
              <p className="font-semibold text-warm-brown">{r.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={goNext}
            disabled={!role}
            className="bg-gold hover:bg-gold-dark text-white disabled:opacity-40"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSalonName = () => (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <h2 className="text-2xl font-bold text-warm-brown mb-2 text-center">
          What&apos;s your salon called?
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          This is how clients will find you
        </p>

        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-warm-brown mb-2">Salon Name</label>
            <Input
              value={salonName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Sarah's Hair Studio"
              className="text-lg py-6 bg-white"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-brown mb-2">
              Your booking link
            </label>
            <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-border">
              <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">chairtime.vercel.app/book/</span>
              <input
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '')
                  )
                }
                className="text-sm font-medium text-gold bg-transparent outline-none flex-1 min-w-0"
                placeholder="your-salon"
              />
            </div>
            {slug && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Check className="w-3 h-3 text-sage" />
                Clients will book at this link
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={goNext}
            disabled={salonName.trim().length < 2 || slug.length < 2}
            className="bg-gold hover:bg-gold-dark text-white disabled:opacity-40"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderCategories = () => (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <h2 className="text-2xl font-bold text-warm-brown mb-2 text-center">
          What services do you offer?
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          Select all that apply — we&apos;ll add starter services for each
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {serviceCategories.map((cat) => {
            const isSelected = selectedCategories.includes(cat.name);
            return (
              <button
                key={cat.name}
                onClick={() => toggleCategory(cat.name)}
                className={cn(
                  'p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all',
                  isSelected
                    ? 'border-gold bg-gold/5 shadow-soft'
                    : 'border-border bg-white hover:border-gold/50'
                )}
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    isSelected ? 'text-gold' : 'text-warm-brown'
                  )}
                >
                  {cat.name}
                </span>
                {isSelected && (
                  <div className="w-5 h-5 bg-gold rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedCategories.length > 0 && (
          <p className="text-sm text-muted-foreground text-center mb-6">
            <Sparkles className="w-4 h-4 inline-block mr-1 text-gold" />
            We&apos;ll create{' '}
            {selectedCategories.reduce((sum, cat) => sum + (defaultServices[cat]?.length || 0), 0)}{' '}
            starter services across {selectedCategories.length} categories. You can customise them
            later.
          </p>
        )}

        <div className="flex justify-between">
          <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={goNext}
            disabled={selectedCategories.length === 0}
            className="bg-gold hover:bg-gold-dark text-white disabled:opacity-40"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderHours = () => (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <h2 className="text-2xl font-bold text-warm-brown mb-2 text-center">
          Set your opening hours
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          You can always change these later in settings
        </p>

        <div className="space-y-2 mb-8">
          {hours.map((h, i) => (
            <div
              key={h.day}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                h.open ? 'bg-white border-border' : 'bg-muted/50 border-transparent'
              )}
            >
              <span className="w-24 text-sm font-medium text-warm-brown shrink-0">
                {h.day.slice(0, 3)}
              </span>
              <Switch
                checked={h.open}
                onCheckedChange={(checked: boolean) => updateHours(i, 'open', checked)}
              />
              {h.open ? (
                <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                  <select
                    value={h.openTime}
                    onChange={(e) => updateHours(i, 'openTime', e.target.value)}
                    className="bg-muted rounded-lg px-2 py-1.5 text-sm border-0 outline-none text-warm-brown"
                  >
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span className="text-muted-foreground">to</span>
                  <select
                    value={h.closeTime}
                    onChange={(e) => updateHours(i, 'closeTime', e.target.value)}
                    className="bg-muted rounded-lg px-2 py-1.5 text-sm border-0 outline-none text-warm-brown"
                  >
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Closed</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={goNext}
            disabled={!hours.some((h) => h.open)}
            className="bg-gold hover:bg-gold-dark text-white disabled:opacity-40"
          >
            Finish Setup
            <Check className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {saving && !saved ? (
          <>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-8"
            >
              <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-gold animate-spin" />
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold text-warm-brown mb-2">Setting up your salon...</h2>
            <p className="text-muted-foreground">
              Creating your profile, services, and booking page
            </p>
          </>
        ) : error ? (
          <>
            <div className="w-20 h-20 bg-dusty-rose/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">😥</span>
            </div>
            <h2 className="text-2xl font-bold text-warm-brown mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button
              onClick={() => {
                setError('');
                setSaving(false);
                handleComplete();
              }}
              className="bg-gold hover:bg-gold-dark text-white"
            >
              Try Again
            </Button>
            <Button variant="ghost" onClick={() => setStep(4)} className="ml-2">
              Go Back
            </Button>
          </>
        ) : saved ? (
          <>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mb-8"
            >
              <div className="w-20 h-20 bg-sage/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-sage" />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="text-3xl font-bold text-warm-brown mb-2">You&apos;re all set! 🎉</h2>
              <p className="text-muted-foreground mb-8">
                <strong className="text-warm-brown">{salonName}</strong> is ready to accept
                bookings.
              </p>

              {/* Booking Link Preview */}
              <div className="bg-white rounded-2xl border border-border p-6 mb-8 shadow-soft">
                <p className="text-sm text-muted-foreground mb-3">Your booking page</p>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <ExternalLink className="w-4 h-4 text-gold" />
                  <span className="text-gold font-medium">
                    chairtime.vercel.app/book/{slug}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyLink}
                  className="mx-auto"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1 text-sage" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>

              {/* Summary */}
              <div className="bg-muted/50 rounded-2xl p-4 mb-8 text-left">
                <p className="text-sm font-medium text-warm-brown mb-3">What we set up:</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sage shrink-0" />
                    <span>{salonName} profile with booking link</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sage shrink-0" />
                    <span>
                      {selectedCategories.length} service categories with{' '}
                      {selectedCategories.reduce(
                        (sum, cat) => sum + (defaultServices[cat]?.length || 0),
                        0
                      )}{' '}
                      starter services
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sage shrink-0" />
                    <span>
                      Opening hours ({hours.filter((h) => h.open).length} days per week)
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  router.push('/app');
                  router.refresh();
                }}
                className="btn-pill bg-gold hover:bg-gold-dark text-white px-10 py-6 text-lg shadow-soft"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </>
        ) : null}
      </div>
    </div>
  );

  // ============================================================
  // Main Render
  // ============================================================

  const stepRenderers = [
    renderWelcome,
    renderRole,
    renderSalonName,
    renderCategories,
    renderHours,
    renderComplete,
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Progress bar - show only on middle steps */}
      {step > 0 && step < 5 && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
          <motion.div
            className="h-full bg-gold"
            animate={{ width: `${(step / (TOTAL_STEPS - 2)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Step indicator - show only on middle steps */}
      {step > 0 && step < 5 && (
        <div className="fixed top-4 right-4 z-50">
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Step {step} of 4
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {stepRenderers[step]()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
