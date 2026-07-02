import Stripe from 'stripe';

// Server-only Stripe client. STRIPE_SECRET_KEY is NEVER exposed to the
// browser — only set in Vercel env vars and read here on the server.
//
// We don't pin an apiVersion so we automatically follow the SDK's latest
// default. If you need lock-in, set it explicitly here (e.g. '2024-12-18.acacia').
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Add it to Vercel environment variables.'
    );
  }
  _stripe = new Stripe(key, {
    typescript: true,
  });
  return _stripe;
}

// True when Stripe is configured. UI uses this to hide payment screens that
// would otherwise crash with a "missing key" error during a misconfigured deploy.
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
