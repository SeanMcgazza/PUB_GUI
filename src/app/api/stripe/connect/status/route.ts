import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe, isStripeConfigured } from '@/lib/stripe/server';

/**
 * GET /api/stripe/connect/status
 *
 * Returns the current Stripe Connect status for the signed-in owner's pub.
 * Used by the Settings page after onboarding returns, to:
 *   - confirm Stripe is fully set up
 *   - update pub.stripe_charges_enabled in the DB if it changed
 *
 * Webhooks (`account.updated`) are the authoritative source — this route
 * is a UI nicety so the Settings page reflects state immediately without
 * waiting for a webhook round-trip.
 */
export async function GET() {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { configured: false, error: 'Stripe is not configured' },
      { status: 200 }
    );
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: pub } = await sb
    .from('pubs')
    .select('id, stripe_account_id, stripe_charges_enabled')
    .eq('owner_id', user.id)
    .single();

  if (!pub) {
    return NextResponse.json({ connected: false });
  }

  if (!pub.stripe_account_id) {
    return NextResponse.json({
      connected: false,
      chargesEnabled: false,
    });
  }

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(pub.stripe_account_id);

  const chargesEnabled = Boolean(account.charges_enabled);
  // Sync DB flag if Stripe says something different to what we have stored.
  if (chargesEnabled !== pub.stripe_charges_enabled) {
    await sb
      .from('pubs')
      .update({ stripe_charges_enabled: chargesEnabled })
      .eq('id', pub.id);
  }

  return NextResponse.json({
    connected: true,
    chargesEnabled,
    detailsSubmitted: Boolean(account.details_submitted),
    payoutsEnabled: Boolean(account.payouts_enabled),
    accountId: pub.stripe_account_id,
    // Useful debug info for the demo
    requirements: account.requirements?.currently_due ?? [],
  });
}
