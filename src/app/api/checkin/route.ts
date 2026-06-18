import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isDemoMode } from '@/lib/demo-mode';
import {
  signTableSession,
  CHECKIN_COOKIE,
  CHECKIN_TTL_SECONDS,
} from '@/lib/table-session';

export const runtime = 'nodejs';

/**
 * POST /api/checkin  { slug, qrToken }
 *
 * "I scanned the QR at this table." Validates that the qr_token really belongs
 * to the pub (via the get_ordering_context definer function, so a guessed token
 * resolves to nothing), then mints a short-lived signed cookie that
 * /api/stripe/payment-intent requires before it will take an order.
 *
 * Demo mode is a no-op (no Supabase, no payments, no presence enforcement).
 */
export async function POST(request: NextRequest) {
  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  let body: { slug?: string; qrToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { slug, qrToken } = body;
  if (!slug || !qrToken) {
    return NextResponse.json({ error: 'Missing slug or qrToken' }, { status: 400 });
  }

  const sb = createAdminClient();

  // Throttle check-ins per IP so the endpoint can't be hammered to probe tokens.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { data: allowed } = await sb.rpc('check_rate_limit', {
    p_key: `checkin:${ip}`,
    p_max: 60,
    p_window_secs: 600,
  });
  if (allowed === false) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Resolve + validate the table belongs to the pub. Wrong token => null.
  const { data: ctx } = await sb.rpc('get_ordering_context', {
    p_slug: slug,
    p_qr_token: qrToken,
  });
  if (!ctx) {
    return NextResponse.json({ error: 'Invalid table code' }, { status: 404 });
  }

  const c = ctx as unknown as { pub: { id: string }; table: { id: string } };
  const token = signTableSession(c.pub.id, c.table.id);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(CHECKIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Secure only in production — dev/LAN testing runs over plain http.
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CHECKIN_TTL_SECONDS,
  });
  return res;
}
