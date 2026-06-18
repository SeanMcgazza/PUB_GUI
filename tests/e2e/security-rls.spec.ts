import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * Security regression tests for the RLS lockdown
 * (supabase/migrations/0001_security_hardening.sql).
 *
 * Asserts that the ANON key — the one shipped in every customer's browser —
 * CANNOT do the things the audit flagged (C1, C2, C3, C5), and that the
 * SECURITY DEFINER functions are the only public read path.
 *
 * Requires a real Supabase project WITH the migration applied, plus the
 * service-role key (to set up a probe order and discover a valid token).
 * Auto-skips otherwise, so it's safe to commit and won't run in demo CI.
 *
 * Run:  NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
 *       SUPABASE_SERVICE_ROLE_KEY=... npx playwright test security-rls
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const skip = !URL || URL.includes('placeholder') || !ANON || !SERVICE;
test.skip(
  skip,
  'Needs real Supabase + SUPABASE_SERVICE_ROLE_KEY with migration 0001 applied'
);

const anon = createClient(URL, ANON);
const admin = createClient(URL, SERVICE ?? '', {
  auth: { persistSession: false },
});

let pubId: string;
let pubSlug: string;
let qrToken: string;
let probeOrderId: string;
let probeSession: string;

test.beforeAll(async () => {
  // Discover a pub + table with the service role (anon can't read them anymore).
  const { data: pub } = await admin
    .from('pubs')
    .select('id, slug')
    .limit(1)
    .single();
  pubId = pub!.id;
  pubSlug = pub!.slug;

  const { data: table } = await admin
    .from('tables')
    .select('id, qr_token')
    .eq('pub_id', pubId)
    .limit(1)
    .single();
  qrToken = table!.qr_token;

  // Plant a probe order so "anon can't read orders" is a meaningful assertion.
  probeSession = `sec-test-${Date.now()}`;
  const { data: order } = await admin
    .from('orders')
    .insert({
      pub_id: pubId,
      table_id: table!.id,
      session_token: probeSession,
      confirmation_code: '999999',
      total: 9.99,
      status: 'pending',
      payment_status: 'paid',
    })
    .select('id')
    .single();
  probeOrderId = order!.id;
});

test.afterAll(async () => {
  if (probeOrderId) await admin.from('orders').delete().eq('id', probeOrderId);
});

test.describe('RLS lockdown — anon key is denied', () => {
  test('anon cannot read any orders (C2)', async () => {
    const { data } = await anon.from('orders').select('*');
    expect(data ?? []).toHaveLength(0);
  });

  test('anon cannot read table qr_tokens (C3)', async () => {
    const { data } = await anon.from('tables').select('qr_token');
    expect(data ?? []).toHaveLength(0);
  });

  test('anon cannot read pubs / stripe_account_id (C5)', async () => {
    const { data } = await anon.from('pubs').select('id, stripe_account_id');
    expect(data ?? []).toHaveLength(0);
  });

  test('anon cannot INSERT an order (C1)', async () => {
    const { error } = await anon.from('orders').insert({
      pub_id: pubId,
      session_token: 'attacker',
      confirmation_code: '0000',
      total: 0,
      status: 'pending',
      payment_status: 'paid',
    });
    expect(error).not.toBeNull(); // RLS rejects the insert
  });
});

test.describe('RLS lockdown — definer functions are the only public path', () => {
  test('get_ordering_context returns the pub+table for a valid token', async () => {
    const { data } = await anon.rpc('get_ordering_context', {
      p_slug: pubSlug,
      p_qr_token: qrToken,
    });
    expect(data).not.toBeNull();
    expect((data as { pub: { id: string } }).pub.id).toBe(pubId);
  });

  test('get_ordering_context returns null for a wrong token (no enumeration)', async () => {
    const { data } = await anon.rpc('get_ordering_context', {
      p_slug: pubSlug,
      p_qr_token: 'definitely-not-a-real-token',
    });
    expect(data).toBeNull();
  });

  test('get_order_status returns only the matching session, nothing else', async () => {
    const { data: mine } = await anon.rpc('get_order_status', {
      p_session_token: probeSession,
    });
    expect((mine as unknown[]) ?? []).toHaveLength(1);

    const { data: other } = await anon.rpc('get_order_status', {
      p_session_token: 'some-other-session-that-does-not-exist',
    });
    expect((other as unknown[]) ?? []).toHaveLength(0);
  });
});
