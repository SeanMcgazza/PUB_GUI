import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe, isStripeConfigured } from '@/lib/stripe/server';

export const runtime = 'nodejs';

/**
 * POST /api/orders/cancel  { orderId, reason? }
 *
 * Cancels an order AND refunds the customer if it was paid. Prepaid-first
 * means an order can never be cancelled without giving the money back —
 * previously the dashboard cancelled rows directly in Supabase and the
 * customer's payment silently stayed with the pub.
 *
 * Authorization: the caller must be the signed-in owner of the order's pub.
 * We rely on RLS ("Owners manage own orders") — the owner-scoped client simply
 * cannot see or update anyone else's orders.
 */
export async function POST(request: NextRequest) {
  let body: { orderId?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { orderId } = body;
  const reason = typeof body.reason === 'string' ? body.reason.slice(0, 300) : null;
  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
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

  // RLS-scoped read: only returns the order if this user owns the pub.
  const { data: order, error: orderErr } = await sb
    .from('orders')
    .select('id, status, payment_status, payment_intent_id, confirmation_code')
    .eq('id', orderId)
    .maybeSingle();
  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.status === 'cancelled') {
    // Idempotent: already cancelled. Report whether it was refunded.
    return NextResponse.json({
      ok: true,
      alreadyCancelled: true,
      refunded: order.payment_status === 'refunded',
    });
  }

  if (order.status === 'collected') {
    return NextResponse.json(
      { error: 'Collected orders cannot be cancelled. Refund at the till if needed.' },
      { status: 400 }
    );
  }

  // 1. Refund first, then cancel. If the refund fails we leave the order
  //    active and tell the staff member — never cancel-without-refund.
  let refunded = false;
  if (order.payment_status === 'paid' && order.payment_intent_id) {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured — cannot refund this paid order.' },
        { status: 500 }
      );
    }
    const stripe = getStripe();
    try {
      await stripe.refunds.create(
        {
          payment_intent: order.payment_intent_id,
          reason: 'requested_by_customer',
          // Destination charge: pull the transferred funds back from the
          // connected account so the platform isn't left covering the refund.
          reverse_transfer: true,
        },
        // Idempotency: retrying a failed request never double-refunds.
        { idempotencyKey: `refund-${order.id}` }
      );
      refunded = true;
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'charge_already_refunded') {
        refunded = true; // fine — treat as refunded and continue
      } else {
        console.error(`Refund failed for order ${order.id}:`, e.message);
        return NextResponse.json(
          {
            error:
              'Refund failed, so the order was NOT cancelled. Please retry, or refund manually in Stripe.',
            detail: e.message,
          },
          { status: 502 }
        );
      }
    }
  }

  // 2. Cancel the order (owner-scoped update; RLS enforces ownership).
  const { error: updateErr } = await sb
    .from('orders')
    .update({
      status: 'cancelled',
      cancel_reason: reason,
      payment_status: refunded ? 'refunded' : order.payment_status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
  if (updateErr) {
    // Refund succeeded but the row update failed — surface loudly.
    console.error(`Order ${order.id} refunded but cancel update failed:`, updateErr);
    return NextResponse.json(
      { error: 'Refund issued, but updating the order failed. Refresh and retry.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, refunded });
}
