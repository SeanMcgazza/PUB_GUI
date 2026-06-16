import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, isStripeConfigured } from '@/lib/stripe/server';
import { createClient as createAdminSupabaseClient } from '@supabase/supabase-js';

// Stripe sends raw JSON; we MUST NOT have Next.js parse it before we verify
// the signature, so we read with request.text() and pass the raw string to
// stripe.webhooks.constructEvent. The signature in the Stripe-Signature
// header is computed against the raw body.

export const runtime = 'nodejs'; // node, not edge — needs the Stripe SDK

// We use the SERVICE ROLE key here because:
//   - the webhook arrives unauthenticated (no user cookie)
//   - we need to INSERT into orders/order_items + UPDATE pubs
// RLS would block these from an anon client. Service role bypasses RLS.
// This route never receives input from end users — it only runs in response
// to Stripe's verified webhooks.
function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'Webhook needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }
  return createAdminSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET is not set' },
      { status: 500 }
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('Webhook signature verification failed:', msg);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${msg}` },
      { status: 400 }
    );
  }

  // Acknowledge the event quickly. Stripe retries on non-2xx for ~3 days.
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      case 'account.application.deauthorized':
        // For this event, the deauthorizing connected-account id is on the
        // event itself (event.account), not in data.object (which is the
        // Application that was revoked).
        await handleAccountDeauthorized(event.account);
        break;
      default:
        // Unhandled event types are fine — Stripe sends a lot and we don't
        // need all of them. Just 200 so it stops retrying.
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error(`Webhook handler error for ${event.type}:`, msg);
    return NextResponse.json(
      { error: `Handler failed: ${msg}` },
      { status: 500 }
    );
  }
}

/**
 * Payment succeeded — create the order in Supabase using metadata stashed
 * on the Payment Intent at creation time.
 *
 * Idempotent: if an order with this payment_intent_id already exists,
 * we just mark it paid (Stripe occasionally redelivers webhooks).
 */
async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const sb = getServiceRoleClient();

  const meta = pi.metadata || {};
  const pubId = meta.pubId;
  const tableId = meta.tableId;
  const sessionToken = meta.sessionToken;
  const confirmationCode = meta.confirmationCode;
  const notes = meta.notes || null;
  const itemsJson = meta.items;

  if (!pubId || !sessionToken || !confirmationCode || !itemsJson) {
    console.error('payment_intent.succeeded missing required metadata', meta);
    return;
  }

  // Idempotency: skip if we've already created the order for this intent.
  const { data: existing } = await sb
    .from('orders')
    .select('id')
    .eq('payment_intent_id', pi.id)
    .maybeSingle();
  if (existing) {
    // Still flip payment_status in case a previous delivery beat us before
    // the metadata-driven order existed; idempotent update is fine.
    await sb
      .from('orders')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    return;
  }

  type ValidatedItem = {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
  };
  let items: ValidatedItem[];
  try {
    items = JSON.parse(itemsJson) as ValidatedItem[];
  } catch {
    console.error('payment_intent.succeeded items metadata not JSON');
    return;
  }

  const totalEuros = items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  // Insert the Order row.
  const { data: order, error: orderErr } = await sb
    .from('orders')
    .insert({
      pub_id: pubId,
      table_id: tableId || null,
      session_token: sessionToken,
      confirmation_code: confirmationCode,
      total: totalEuros,
      notes,
      status: 'pending',
      payment_intent_id: pi.id,
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (orderErr || !order) {
    console.error('Failed to insert order from webhook', orderErr);
    return;
  }

  // Insert the line items.
  const rows = items.map((i) => ({
    order_id: order.id,
    menu_item_id: i.menuItemId,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
  }));
  const { error: itemsErr } = await sb.from('order_items').insert(rows);
  if (itemsErr) {
    console.error('Failed to insert order_items from webhook', itemsErr);
  }
}

/**
 * Payment failed — log it; no order is created.
 * (Could optionally insert a failed order row for analytics; for the demo
 * we just keep the orders table clean.)
 */
async function handlePaymentIntentFailed(pi: Stripe.PaymentIntent) {
  console.log(
    `Payment failed for intent ${pi.id}: ${pi.last_payment_error?.message}`
  );
}

/**
 * Connected account state changed — update charges_enabled so the Settings
 * page reflects reality without needing a manual refresh.
 */
async function handleAccountUpdated(account: Stripe.Account) {
  if (!account.id) return;
  const sb = getServiceRoleClient();
  await sb
    .from('pubs')
    .update({ stripe_charges_enabled: Boolean(account.charges_enabled) })
    .eq('stripe_account_id', account.id);
}

/**
 * Pub revoked our Connect access (e.g. deleted their Stripe account or
 * disconnected our platform). Clear the link so the Settings page shows
 * "Connect Stripe" again. The deauthorizing account id arrives as a
 * top-level string on the event rather than nested in data.object.
 */
async function handleAccountDeauthorized(accountId: string | null | undefined) {
  if (!accountId) return;
  const sb = getServiceRoleClient();
  await sb
    .from('pubs')
    .update({
      stripe_account_id: null,
      stripe_charges_enabled: false,
    })
    .eq('stripe_account_id', accountId);
}
