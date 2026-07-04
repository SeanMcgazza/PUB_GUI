import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type Stripe from 'stripe';
import { getStripe, isStripeConfigured } from '@/lib/stripe/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Stripe sends raw JSON; we MUST NOT have Next.js parse it before we verify
// the signature, so we read with request.text() and pass the raw string to
// stripe.webhooks.constructEvent. The signature in the Stripe-Signature
// header is computed against the raw body.

export const runtime = 'nodejs'; // node, not edge — needs the Stripe SDK

// The webhook uses the SERVICE-ROLE client (createAdminClient, bypasses RLS)
// because it arrives unauthenticated and must INSERT orders/order_items +
// UPDATE pubs. It only ever runs in response to a Stripe-signature-verified
// event, never on raw end-user input.

// 6-digit, crypto-strong confirmation code (replaces Math.random; C7).
function generateConfirmationCode(): string {
  return String(crypto.randomInt(100000, 1000000));
}

// True when a Postgres error is a unique-constraint violation on the given
// index name. supabase-js surfaces the SQLSTATE in `code` and the index name
// in `message`/`details`.
function isUniqueViolation(err: unknown, indexName: string): boolean {
  const e = err as { code?: string; message?: string; details?: string } | null;
  if (!e || e.code !== '23505') return false;
  const haystack = `${e.message ?? ''} ${e.details ?? ''}`;
  return haystack.includes(indexName);
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
  const sb = createAdminClient();

  const meta = pi.metadata || {};
  const pubId = meta.pubId;
  const tableId = meta.tableId;
  const sessionToken = meta.sessionToken;
  const confirmationCode = meta.confirmationCode;
  const notes = meta.notes || null;
  // Items may arrive whole (`items`) or chunked across `items_0..n` when the
  // JSON exceeded Stripe's 500-char metadata value limit (see payment-intent).
  let itemsJson = meta.items;
  if (!itemsJson && meta.items_chunks) {
    const n = parseInt(meta.items_chunks, 10);
    if (Number.isFinite(n) && n > 0 && n <= 50) {
      itemsJson = Array.from({ length: n }, (_, i) => meta[`items_${i}`] ?? '').join('');
    }
  }

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
    ageRestricted?: boolean;
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

  // If any line is age-restricted, the order needs a staff ID check at handoff.
  // No personal data is stored — just this status + a timestamp when decided.
  const idCheckStatus = items.some((i) => i.ageRestricted)
    ? 'pending'
    : 'not_required';

  // Insert the Order row. Retry on the rare confirmation-code collision
  // (idx_orders_active_code_uq) with a fresh code — the customer only ever
  // sees the persisted code, so regenerating here is invisible to them. A
  // payment_intent_id collision means a concurrent delivery already created
  // the order → idempotent success.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: any = null;
  let code = confirmationCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error: orderErr } = await sb
      .from('orders')
      .insert({
        pub_id: pubId,
        table_id: tableId || null,
        session_token: sessionToken,
        confirmation_code: code,
        total: totalEuros,
        notes,
        status: 'pending',
        id_check_status: idCheckStatus,
        payment_intent_id: pi.id,
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!orderErr && data) {
      order = data;
      break;
    }
    if (isUniqueViolation(orderErr, 'idx_orders_payment_intent_uq')) {
      return; // already created by another delivery
    }
    if (isUniqueViolation(orderErr, 'idx_orders_active_code_uq')) {
      code = generateConfirmationCode();
      continue;
    }
    console.error('Failed to insert order from webhook', orderErr);
    return;
  }
  if (!order) {
    console.error('Could not insert order after confirmation-code retries');
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
  const sb = createAdminClient();
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
  const sb = createAdminClient();
  await sb
    .from('pubs')
    .update({
      stripe_account_id: null,
      stripe_charges_enabled: false,
    })
    .eq('stripe_account_id', accountId);
}
