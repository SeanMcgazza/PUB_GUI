import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe, isStripeConfigured } from '@/lib/stripe/server';

/**
 * POST /api/stripe/connect/onboard
 *
 * Starts the Stripe Connect Express onboarding flow for the currently
 * signed-in pub owner. Two cases:
 *
 * 1. Pub has no stripe_account_id yet → create a fresh Express connected
 *    account, save the id, then create an account link (the hosted form URL)
 *    and return it.
 *
 * 2. Pub already has a stripe_account_id but charges_enabled is false (they
 *    started onboarding but didn't finish, or Stripe needs more info) →
 *    create a fresh account link against the same account and return it.
 *
 * The caller (Settings page) then `window.location.href`'s to that URL.
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe is not configured on the server' },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // Auth check: only the pub's owner can connect their Stripe.
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Find the pub owned by this user.
  const { data: pub, error: pubErr } = await sb
    .from('pubs')
    .select('id, name, slug, stripe_account_id, stripe_charges_enabled')
    .eq('owner_id', user.id)
    .single();
  if (pubErr || !pub) {
    return NextResponse.json(
      { error: 'No pub found for this owner' },
      { status: 404 }
    );
  }

  const stripe = getStripe();
  let accountId: string | null = pub.stripe_account_id;

  // Step 1: create the connected account if we don't have one yet.
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'IE',
      email: user.email ?? undefined,
      business_type: 'individual',
      // We're a software platform; collect payments on the pub's behalf.
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: pub.name,
        product_description: 'Drinks and food ordered via BarTab',
        mcc: '5813', // Drinking places (alcoholic beverages)
      },
      metadata: {
        bartab_pub_id: pub.id,
        bartab_pub_slug: pub.slug,
      },
    });
    accountId = account.id;

    // Save the account id to the pub so subsequent payments can route to it.
    const { error: updateErr } = await sb
      .from('pubs')
      .update({ stripe_account_id: accountId })
      .eq('id', pub.id);
    if (updateErr) {
      return NextResponse.json(
        { error: 'Failed to save Stripe account id', detail: updateErr.message },
        { status: 500 }
      );
    }
  }

  // Step 2: create the one-time onboarding link.
  // Prefer the configured app URL, then the server-derived origin. The client
  // Origin header is last resort only — it's attacker-controllable and ends up
  // in Stripe's return/refresh URLs.
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.nextUrl.origin ||
    request.headers.get('origin') ||
    '';

  const link = await stripe.accountLinks.create({
    account: accountId!,
    refresh_url: `${origin}/app/settings?stripe_refresh=true`,
    return_url: `${origin}/app/settings?stripe_connected=true`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: link.url });
}
