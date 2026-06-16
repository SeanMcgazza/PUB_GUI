import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe, isStripeConfigured } from '@/lib/stripe/server';

// Minimum order value (€) — mirrors the value in ordering-client.tsx.
// Enforced here on the server so a tampered client can't bypass it.
const MIN_ORDER_VALUE = 5;
// Platform fee per order in cents. €0 = no cut for the platform; pub gets
// the full amount minus Stripe's own processing fee.
const PLATFORM_FEE_CENTS = 0;

/**
 * POST /api/stripe/payment-intent
 *
 * Creates a Stripe Payment Intent for the cart. We use destination charges:
 * the customer is charged on the platform account, Stripe automatically
 * transfers the funds to the pub's connected account (less any platform fee
 * and Stripe processing).
 *
 * The Order row itself is NOT created here — it's created when the
 * `payment_intent.succeeded` webhook fires, after the payment has actually
 * cleared. All the data needed to construct the order is stored in the
 * Payment Intent's metadata so the webhook handler has everything.
 *
 * Body: {
 *   pubSlug: string,
 *   tableToken: string,
 *   sessionToken: string,
 *   items: [{ menuItemId: string, quantity: number }],
 *   notes?: string
 * }
 *
 * Returns: { clientSecret, paymentIntentId, amount }
 */
export async function POST(request: NextRequest) {
  // Wrap the whole handler so any unexpected throw returns a JSON error
  // instead of an empty 500 body (which the client can't parse).
  try {
    return await handle(request);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown server error';
    console.error('payment-intent route crashed:', err);
    return NextResponse.json(
      { error: `Server error: ${msg}` },
      { status: 500 }
    );
  }
}

async function handle(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe is not configured on the server' },
      { status: 500 }
    );
  }

  let body: {
    pubSlug?: string;
    tableToken?: string;
    sessionToken?: string;
    items?: { menuItemId: string; quantity: number }[];
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { pubSlug, tableToken, sessionToken, items, notes } = body;
  if (!pubSlug || !tableToken || !sessionToken || !items?.length) {
    return NextResponse.json(
      { error: 'Missing pubSlug, tableToken, sessionToken, or items' },
      { status: 400 }
    );
  }

  // No auth required — this endpoint is called by unauthenticated customers.
  // RLS allows public SELECT on pubs/tables/menu_items.
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // Look up the pub by slug.
  const { data: pub, error: pubErr } = await sb
    .from('pubs')
    .select('id, name, slug, stripe_account_id, stripe_charges_enabled')
    .eq('slug', pubSlug)
    .single();
  if (pubErr || !pub) {
    return NextResponse.json({ error: 'Pub not found' }, { status: 404 });
  }
  if (!pub.stripe_account_id) {
    return NextResponse.json(
      { error: 'This pub has not connected Stripe yet' },
      { status: 400 }
    );
  }
  // The pub started Stripe onboarding but hasn't finished — Stripe will
  // reject paymentIntents.create with transfer_data to an account that
  // can't accept charges. Return a friendly message instead of crashing.
  if (!pub.stripe_charges_enabled) {
    return NextResponse.json(
      {
        error:
          "This pub hasn't completed Stripe onboarding yet. The owner needs to finish in /app/settings → Continue Stripe onboarding.",
      },
      { status: 400 }
    );
  }

  // Verify the table belongs to this pub.
  const { data: table } = await sb
    .from('tables')
    .select('id, number, name, qr_token')
    .eq('qr_token', tableToken)
    .eq('pub_id', pub.id)
    .single();
  if (!table) {
    return NextResponse.json({ error: 'Table not found' }, { status: 404 });
  }

  // Refetch prices server-side. NEVER trust client prices.
  const menuItemIds = items.map((i) => i.menuItemId);
  const { data: menuItems, error: menuErr } = await sb
    .from('menu_items')
    .select('id, name, price, is_available')
    .in('id', menuItemIds)
    .eq('pub_id', pub.id);
  if (menuErr || !menuItems) {
    return NextResponse.json(
      { error: 'Failed to load menu items' },
      { status: 500 }
    );
  }

  const itemsById = new Map(
    (menuItems as { id: string; name: string; price: number; is_available: boolean }[]).map(
      (m) => [m.id, m]
    )
  );

  // Build the validated line items.
  const validated: { menuItemId: string; name: string; price: number; quantity: number }[] = [];
  for (const requested of items) {
    const m = itemsById.get(requested.menuItemId);
    if (!m) {
      return NextResponse.json(
        { error: `Menu item ${requested.menuItemId} not found in this pub` },
        { status: 400 }
      );
    }
    if (!m.is_available) {
      return NextResponse.json(
        { error: `${m.name} is no longer available` },
        { status: 400 }
      );
    }
    const qty = Math.max(1, Math.min(99, Math.floor(requested.quantity)));
    validated.push({
      menuItemId: m.id,
      name: m.name,
      price: m.price,
      quantity: qty,
    });
  }

  const totalEuros = validated.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  if (totalEuros < MIN_ORDER_VALUE) {
    return NextResponse.json(
      {
        error: `Minimum order value is €${MIN_ORDER_VALUE.toFixed(2)}`,
        total: totalEuros,
        minimum: MIN_ORDER_VALUE,
      },
      { status: 400 }
    );
  }

  // Round to cents to avoid Stripe rejecting fractional cents.
  const amountCents = Math.round(totalEuros * 100);

  // A short 4-digit code for the bar to call out / customer to repeat back.
  const confirmationCode = String(
    Math.floor(1000 + Math.random() * 9000)
  );

  const stripe = getStripe();
  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      // Destination charge: pub receives the money, platform optionally takes a fee.
      transfer_data: {
        destination: pub.stripe_account_id,
      },
      application_fee_amount: PLATFORM_FEE_CENTS,
      metadata: {
        // Everything the webhook needs to construct the Order row.
        pubId: pub.id,
        pubSlug: pub.slug,
        tableId: table.id,
        sessionToken,
        confirmationCode,
        notes: notes || '',
        // Items as JSON because metadata values are strings only.
        items: JSON.stringify(validated),
      },
      description: `${pub.name} — Table ${table.number} — Order #${confirmationCode}`,
    });
  } catch (stripeErr) {
    const msg =
      stripeErr instanceof Error ? stripeErr.message : 'Stripe rejected the payment';
    console.error('Stripe paymentIntents.create failed:', stripeErr);
    return NextResponse.json(
      {
        error: `Could not create payment: ${msg}`,
        // Hint for the common case: connected account not fully onboarded.
        hint: msg.toLowerCase().includes('capabilit')
          ? 'The pub needs to finish Stripe onboarding before accepting payments.'
          : undefined,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: amountCents,
    confirmationCode,
  });
}
