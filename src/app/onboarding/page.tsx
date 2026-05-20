'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode } from '@/lib/demo-data';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Beer,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  ExternalLink,
  Copy,
  QrCode,
  UtensilsCrossed,
} from 'lucide-react';

const TOTAL_STEPS = 5;

const defaultCategories = [
  { name: 'Beers', emoji: '🍺' },
  { name: 'Wines', emoji: '🍷' },
  { name: 'Spirits', emoji: '🥃' },
  { name: 'Soft Drinks', emoji: '🥤' },
  { name: 'Cocktails', emoji: '🍹' },
  { name: 'Food', emoji: '🍔' },
  { name: 'Snacks', emoji: '🥜' },
  { name: 'Coffee', emoji: '☕' },
];

const defaultMenuItems: Record<string, Array<{ name: string; price: number; description?: string }>> = {
  Beers: [
    { name: 'House Lager', price: 5.50, description: 'Pint of refreshing lager' },
    { name: 'IPA', price: 6.00, description: 'Hoppy India Pale Ale' },
    { name: 'Guinness', price: 5.80, description: 'Classic Irish stout' },
    { name: 'Craft Ale', price: 6.50, description: 'Rotating guest ale' },
  ],
  Wines: [
    { name: 'House White', price: 5.50, description: 'Crisp and refreshing' },
    { name: 'House Red', price: 5.50, description: 'Smooth and fruity' },
    { name: 'Prosecco', price: 7.00, description: '125ml glass' },
  ],
  Spirits: [
    { name: 'Gin & Tonic', price: 8.00 },
    { name: 'Vodka & Mixer', price: 7.00 },
    { name: 'Whisky', price: 6.00, description: 'Single measure' },
    { name: 'Rum & Coke', price: 7.00 },
  ],
  'Soft Drinks': [
    { name: 'Coca Cola', price: 3.00 },
    { name: 'Lemonade', price: 2.80 },
    { name: 'Orange Juice', price: 3.20 },
    { name: 'Sparkling Water', price: 2.50 },
  ],
  Food: [
    { name: 'Fish & Chips', price: 14.00, description: 'Beer battered cod, chunky chips, mushy peas' },
    { name: 'Burger & Fries', price: 13.00, description: '6oz beef patty, brioche bun, house sauce' },
    { name: 'Pie of the Day', price: 12.00, description: 'Ask staff for today\'s pie' },
  ],
  Snacks: [
    { name: 'Pork Scratchings', price: 3.00 },
    { name: 'Mixed Nuts', price: 3.50 },
    { name: 'Crisps', price: 1.50 },
  ],
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

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [pubName, setPubName] = useState('');
  const [slug, setSlug] = useState('');
  const [tableCount, setTableCount] = useState('8');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Beers', 'Wines', 'Soft Drinks']);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  // Pre-fill from user metadata if available
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.business_name) {
        const name = user.user_metadata.business_name;
        setPubName(name);
        setSlug(generateSlug(name));
      }
    };
    loadUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNameChange = (name: string) => {
    setPubName(name);
    setSlug(generateSlug(name));
  };

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const handleComplete = useCallback(async () => {
    if (saving || saved) return;
    setSaving(true);
    setError('');

    // Demo mode: simulate a successful save without persisting anywhere.
    // The real persistence path requires a Supabase project + an authed user.
    if (isDemoMode()) {
      setSaved(true);
      try {
        const confettiModule = await import('canvas-confetti');
        confettiModule.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore confetti errors
      }
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check slug uniqueness
      const { data: existingPub } = await supabase
        .from('pubs')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existingPub) {
        throw new Error(`The URL "${slug}" is already taken. Please choose a different name.`);
      }

      // 1. Create the pub
      const { data: pub, error: pubError } = await supabase
        .from('pubs')
        .insert({
          owner_id: user.id,
          name: pubName,
          slug: slug,
        })
        .select()
        .single();

      if (pubError) throw pubError;

      // 2. Create tables
      const tables = Array.from({ length: parseInt(tableCount) }, (_, i) => ({
        pub_id: pub.id,
        number: i + 1,
        qr_token: crypto.randomUUID(),
      }));

      const { error: tablesError } = await supabase.from('tables').insert(tables);
      if (tablesError) throw tablesError;

      // 3. Create menu categories and items
      for (let i = 0; i < selectedCategories.length; i++) {
        const catName = selectedCategories[i];
        const { data: category, error: catError } = await supabase
          .from('menu_categories')
          .insert({
            pub_id: pub.id,
            name: catName,
            order: i,
          })
          .select()
          .single();

        if (catError) throw catError;

        const items = defaultMenuItems[catName] || [];
        if (items.length > 0) {
          const { error: itemsError } = await supabase.from('menu_items').insert(
            items.map((item) => ({
              pub_id: pub.id,
              category_id: category.id,
              name: item.name,
              price: item.price,
              description: item.description || null,
            }))
          );
          if (itemsError) throw itemsError;
        }
      }

      setSaved(true);

      // Fire confetti
      try {
        const confettiModule = await import('canvas-confetti');
        confettiModule.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore confetti errors
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSaving(false);
    }
  }, [saving, saved, supabase, pubName, slug, tableCount, selectedCategories]);

  useEffect(() => {
    if (step === 4 && !saved && !saving) {
      handleComplete();
    }
  }, [step, saved, saving, handleComplete]);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/order/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canContinue = (): boolean => {
    switch (step) {
      case 0: return true;
      case 1: return pubName.trim().length >= 2 && slug.length >= 2;
      case 2: return parseInt(tableCount) >= 1;
      case 3: return selectedCategories.length > 0;
      default: return false;
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

  // Step Renderers
  const renderWelcome = () => (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="p-5 bg-amber-600 rounded-3xl mb-8 shadow-lg"
      >
        <Beer className="w-12 h-12 text-white" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl md:text-4xl font-bold text-foreground mb-3 text-center"
      >
        Welcome to BarTab
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-center max-w-md mb-10 text-lg"
      >
        Let&apos;s get your pub set up in just a few minutes. Customers will be ordering
        via QR code in no time!
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          onClick={goNext}
          className="bg-amber-600 hover:bg-amber-700 text-white px-10 py-6 text-lg rounded-full shadow-lg"
        >
          Let&apos;s Go
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );

  const renderPubName = () => (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
          What&apos;s your pub called?
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          This is how customers will see you
        </p>

        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Pub Name</label>
            <Input
              value={pubName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. The Red Lion"
              className="text-lg py-6 bg-card"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Your ordering link
            </label>
            <div className="flex items-center gap-2 p-3 bg-card rounded-xl border">
              <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">bartab.app/order/</span>
              <input
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '')
                  )
                }
                className="text-sm font-medium text-amber-600 bg-transparent outline-none flex-1 min-w-0"
                placeholder="your-pub"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={goNext}
            disabled={!canContinue()}
            className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderTables = () => (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[color:var(--theme-primary)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            How many tables do you have?
          </h2>
          <p className="text-muted-foreground">
            We&apos;ll generate a unique QR code for each one
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="text-center">
            <Input
              type="number"
              min="1"
              max="100"
              value={tableCount}
              onChange={(e) => setTableCount(e.target.value)}
              className="text-4xl font-bold text-center py-8 w-32 mx-auto"
            />
            <p className="text-sm text-muted-foreground mt-2">
              You can add or remove tables later
            </p>
          </div>

          <div className="flex justify-center gap-2">
            {[4, 8, 12, 20].map((num) => (
              <Button
                key={num}
                variant={tableCount === num.toString() ? 'default' : 'outline'}
                onClick={() => setTableCount(num.toString())}
                className={cn(
                  tableCount === num.toString() && 'bg-amber-600 hover:bg-amber-700'
                )}
              >
                {num}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={goNext}
            disabled={!canContinue()}
            className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40"
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
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[color:var(--theme-primary)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            What do you serve?
          </h2>
          <p className="text-muted-foreground">
            We&apos;ll add starter items for each category
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {defaultCategories.map((cat) => {
            const isSelected = selectedCategories.includes(cat.name);
            return (
              <button
                key={cat.name}
                onClick={() => toggleCategory(cat.name)}
                className={cn(
                  'p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all',
                  isSelected
                    ? 'border-[color:var(--theme-primary)] bg-[color:var(--theme-primary)]/15 shadow'
                    : 'border-glass bg-card hover:border-[color:var(--theme-primary)]/60'
                )}
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className={cn(
                  'text-sm font-medium',
                  isSelected ? 'text-amber-600' : 'text-foreground'
                )}>
                  {cat.name}
                </span>
                {isSelected && (
                  <div className="w-5 h-5 bg-amber-600 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedCategories.length > 0 && (
          <p className="text-sm text-muted-foreground text-center mb-6">
            We&apos;ll create{' '}
            {selectedCategories.reduce((sum, cat) => sum + (defaultMenuItems[cat]?.length || 0), 0)}{' '}
            starter menu items. You can customise them later.
          </p>
        )}

        <div className="flex justify-between">
          <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={goNext}
            disabled={!canContinue()}
            className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40"
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
              <div className="w-20 h-20 bg-[color:var(--theme-primary)]/20 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Setting up your pub...</h2>
            <p className="text-muted-foreground">
              Creating your menu, tables, and QR codes
            </p>
          </>
        ) : error ? (
          <>
            <div className="w-20 h-20 bg-[color:var(--theme-danger)]/15 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">😥</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button
              onClick={() => {
                setError('');
                setSaving(false);
                handleComplete();
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Try Again
            </Button>
            <Button variant="ghost" onClick={() => setStep(3)} className="ml-2">
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
              <div className="w-20 h-20 bg-[color:var(--theme-success)]/15 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-[color:var(--theme-success)]" />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="text-3xl font-bold text-foreground mb-2">You&apos;re all set! 🎉</h2>
              <p className="text-muted-foreground mb-8">
                <strong className="text-foreground">{pubName}</strong> is ready to take orders.
              </p>

              <div className="bg-card rounded-2xl border p-6 mb-8 shadow">
                <p className="text-sm text-muted-foreground mb-3">Your ordering page</p>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <ExternalLink className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-600 font-medium">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/order/{slug}
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
                      <Check className="w-4 h-4 mr-1 text-[color:var(--theme-success)]" />
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

              <div className="bg-card border-glass rounded-2xl p-4 mb-8 text-left">
                <p className="text-sm font-medium text-foreground mb-3">What we set up:</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[color:var(--theme-success)] shrink-0" />
                    <span>{pubName} profile with ordering link</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[color:var(--theme-success)] shrink-0" />
                    <span>{tableCount} tables with unique QR codes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[color:var(--theme-success)] shrink-0" />
                    <span>
                      {selectedCategories.length} menu categories with{' '}
                      {selectedCategories.reduce((sum, cat) => sum + (defaultMenuItems[cat]?.length || 0), 0)}{' '}
                      starter items
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  router.push('/app');
                  router.refresh();
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-10 py-6 text-lg rounded-full shadow-lg"
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

  const stepRenderers = [
    renderWelcome,
    renderPubName,
    renderTables,
    renderCategories,
    renderComplete,
  ];

  return (
    <div className="min-h-screen bg-atmosphere">
      {/* Progress bar */}
      {step > 0 && step < 4 && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-[color:var(--theme-surface-card)] z-50">
          <motion.div
            className="h-full bg-amber-600"
            animate={{ width: `${(step / (TOTAL_STEPS - 2)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
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
