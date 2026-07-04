import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe, isStripeConfigured } from '@/lib/stripe/server';
import { verifyTableSession, CHECKIN_COOKIE } from '@/lib/table-session';

export const runtime = 'nodejs';

// Minimum order value (€) — mirrors the value in ordering-client.tsx.
// Enforced here on the server so a tampered client can't bypass it.
const MIN_ORDER_VALUE = 5;
// Maximum order value (€) — sanity cap so a tampered/looped client can't
// create an absurd Payment Intent.
const MAX_ORDER_VALUE = 1000;
// Platform fee per order in cents. €0 = no cut for the platform; pub gets
// the full amount minus Stripe's own processing fee.
const PLATFORM_FEE_CENTS = 0;
// Abuse caps: per browser session and per IP, within a 10-minute window.
const RATE_LIMIT_WINDOW_SECS = 600;
const MAX_INTENTS_PER_SESSION = 8;
const MAX_INTENTS_PER_IP = 30;

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

/**
 * Stripe metadata values are limited to 500 characters. Split a long string
 * across `key_0`, `key_1`, ... plus `key_chunks` so the webhook can rebuild it.
 */
function chunkMetadata(key: string, value: string): Record<string, string> {
  const CHUNK = 450;
  if (value.length <= CHUNK) return { [key]: value };
  const out: Record<string, string> = {};
  let n = 0;
  for (let i = 0; i < value.length; i += CHUNK) {
    out[`${key}_${n++}`] = value.slice(i, i + CHUNK);
  }
  out[`${key}_chunks`] = String(n);
  return out;
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
    ageAcknowledged?: boolean;
    receiptEmail?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { pubSlug, tableToken, sessionToken, items, ageAcknowledged } = body;
  const notes = typeof body.notes === 'string' ? body.notes.slice(0, 480) : undefined;
  // Optional receipt email — validated, passed straight to Stripe, never stored.
  const receiptEmail =
    typeof body.receiptEmail === 'string' &&
    body.receiptEmail.length <= 254 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.receiptEmail)
      ? body.receiptEmail.trim()
      : undefined;
  if (!pubSlug || !tableToken || !sessionToken || !items?.length) {
    return NextResponse.json(
      { error: 'Missing pubSlug, tableToken, sessionToken, or items' },
      { status: 400 }
    );
  }

  // No user auth — customers are anonymous. We use the service-role client for
  // the server-side lookups/validation below (public RLS reads on pubs/tables
  // were removed in the security lockdown). Everything is validated here before
  // any Payment Intent is created.
  const sb = createAdminClient();

  // Abuse throttling: cap Payment Intent creation per session and per IP.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const [{ data: sessionOk }, { data: ipOk }] = await Promise.all([
    sb.rpc('check_rate_limit', {
      p_key: `pi:sess:${sessionToken}`,
      p_max: MAX_INTENTS_PER_SESSION,
      p_window_secs: RATE_LIMIT_WINDOW_SECS,
    }),
    sb.rpc('check_rate_limit', {
      p_key: `pi:ip:${ip}`,
      p_max: MAX_INTENTS_PER_IP,
      p_window_secs: RATE_LIMIT_WINDOW_SECS,
    }),
  ]);
  if (sessionOk === false || ipOk === false) {
    return NextResponse.json(
      { error: 'Too many orders in a short time. Please wait a moment.' },
      { status: 429 }
    );
  }

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

  // Presence enforcement: require a valid, unexpired check-in session minted by
  // /api/checkin when the customer scanned THIS table's QR. Combined with the
  // RLS lockdown (qr_tokens are no longer enumerable), this bounds ordering to
  // someone who physically scanned the table, within a time window — so a
  // shared link or stale tab stops working.
  const session = verifyTableSession(request.cookies.get(CHECKIN_COOKIE)?.value);
  if (!session || session.pubId !== pub.id || session.tableId !== table.id) {
    return NextResponse.json(
      {
        error:
          'Your table session has expired. Please re-scan the QR code at your table to order.',
        code: 'CHECKIN_REQUIRED',
      },
      { status: 403 }
    );
  }

  // Refetch prices server-side. NEVER trust client prices.
  const menuItemIds = items.map((i) => i.menuItemId);
  const { data: menuItems, error: menuErr } = await sb
    .from('menu_items')
    .select('id, name, price, is_available, age_restricted')
    .in('id', menuItemIds)
    .eq('pub_id', pub.id);
  if (menuErr || !menuItems) {
    return NextResponse.json(
      { error: 'Failed to load menu items' },
      { status: 500 }
    );
  }

  const itemsById = new Map(
    (menuItems as { id: string; name: string; price: number; is_available: boolean; age_restricted: boolean }[]).map(
      (m) => [m.id, m]
    )
  );

  // Build the validated line items.
  const validated: { menuItemId: string; name: string; price: number; quantity: number; ageRestricted: boolean }[] = [];
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
    const rawQty = Number(requested.quantity);
    if (!Number.isFinite(rawQty) || rawQty < 1) {
      return NextResponse.json(
        { error: `Invalid quantity for ${m.name}` },
        { status: 400 }
      );
    }
    const qty = Math.max(1, Math.min(99, Math.floor(rawQty)));
    validated.push({
      menuItemId: m.id,
      name: m.name,
      price: m.price,
      quantity: qty,
      ageRestricted: Boolean(m.age_restricted),
    });
  }

  // Age gate: if the cart contains any 18+ item, the customer must have ticked
  // the acknowledgment client-side. Enforced here too so a tampered client
  // can't skip it. No personal data is collected — staff still check ID at the
  // table; this is just the required acknowledgment.
  const hasAgeRestricted = validated.some((v) => v.ageRestricted);
  if (hasAgeRestricted && ageAcknowledged !== true) {
    return NextResponse.json(
      {
        error:
          'This order contains age-restricted items. Please confirm you are 18 or over and will show ID on request.',
        code: 'AGE_ACK_REQUIRED',
      },
      { status: 400 }
    );
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

  if (totalEuros > MAX_ORDER_VALUE) {
    return NextResponse.json(
      {
        error: `Order exceeds the maximum of €${MAX_ORDER_VALUE.toFixed(2)}. Please split it or order at the bar.`,
        total: totalEuros,
        maximum: MAX_ORDER_VALUE,
      },
      { status: 400 }
    );
  }

  // Round to cents to avoid Stripe rejecting fractional cents.
  const amountCents = Math.round(totalEuros * 100);

  // A 6-digit crypto-random code for the bar to call out / customer to repeat
  // back. The webhook re-rolls it on the rare active-order collision.
  const confirmationCode = String(crypto.randomInt(100000, 1000000));

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
      receipt_email: receiptEmail,
      metadata: {
        // Everything the webhook needs to construct the Order row.
        pubId: pub.id,
        pubSlug: pub.slug,
        tableId: table.id,
        sessionToken,
        confirmationCode,
        notes: (notes || '').slice(0, 480),
        // Items as JSON because metadata values are strings only. Stripe caps
        // each metadata VALUE at 500 chars, which a ~5-item cart exceeds — so
        // split the JSON across numbered keys (50 keys x 500 chars available).
        ...chunkMetadata('items', JSON.stringify(validated)),
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
