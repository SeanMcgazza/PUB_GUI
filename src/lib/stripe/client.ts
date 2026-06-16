import { loadStripe, type Stripe } from '@stripe/stripe-js';

// Browser-side Stripe.js loader. The publishable key (pk_test_... or pk_live_...)
// is safe to inline into the client bundle — it's intentionally public.
//
// loadStripe is cached per-key so calling getStripeJs() repeatedly across
// renders is fine.
let _stripePromise: Promise<Stripe | null> | null = null;

export function getStripeJs(): Promise<Stripe | null> {
  if (_stripePromise) return _stripePromise;
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    // Fail soft so a misconfigured deploy can still render the rest of the app.
    console.warn(
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set — Stripe payments will not work.'
    );
    _stripePromise = Promise.resolve(null);
    return _stripePromise;
  }
  _stripePromise = loadStripe(key);
  return _stripePromise;
}
