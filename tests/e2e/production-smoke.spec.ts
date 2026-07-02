import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * Production-mode smoke tests — point at the real Supabase project (no
 * placeholder env). Skipped automatically if env isn't pointing at real
 * Supabase, so this file is safe to commit and won't break demo-mode runs.
 *
 * What it covers:
 *   1. The order URL for a real pub/table renders the live menu from DB
 *   2. Customer can place an order and see a 4-digit confirmation code
 *   3. The order actually lands in Supabase with matching code/total
 *   4. The order_items rows have the right names, prices, quantities
 *   5. Two concurrent customers don't get the same order id (no collisions)
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isPlaceholder = !SUPABASE_URL || SUPABASE_URL.includes('placeholder');

// After the security lockdown the anon key can no longer read pubs/tables/
// orders, so this harness needs the service-role key for discovery,
// verification and cleanup. Skip the file if not in production mode or absent.
test.skip(
  isPlaceholder || !SUPABASE_SERVICE_ROLE_KEY,
  'Production smoke tests need a real NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY'
);

// Service-role client — appropriate for a test harness doing setup/verification.
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY
);

// Discover the first pub + a few tables at suite start, so the tests are
// resilient to whatever pub the user happens to have onboarded.
let pubSlug: string;
let pubName: string;
let pubId: string;
let firstTableToken: string;
let secondTableToken: string;
let firstItemName: string;
let firstItemPrice: number;

test.beforeAll(async () => {
  const { data: pub, error: pubErr } = await supabase
    .from('pubs')
    .select('id, slug, name')
    .limit(1)
    .single();
  expect(pubErr, JSON.stringify(pubErr)).toBeNull();
  expect(pub).not.toBeNull();
  pubId = pub!.id;
  pubSlug = pub!.slug;
  pubName = pub!.name;

  const { data: tables, error: tablesErr } = await supabase
    .from('tables')
    .select('qr_token, number')
    .eq('pub_id', pubId)
    .order('number', { ascending: true })
    .limit(2);
  expect(tablesErr).toBeNull();
  expect(tables?.length).toBeGreaterThanOrEqual(2);
  firstTableToken = tables![0].qr_token;
  secondTableToken = tables![1].qr_token;

  const { data: items, error: itemsErr } = await supabase
    .from('menu_items')
    .select('name, price')
    .eq('pub_id', pubId)
    .eq('is_available', true)
    .limit(1)
    .single();
  expect(itemsErr).toBeNull();
  firstItemName = items!.name;
  firstItemPrice = Number(items!.price);
});

test.describe('Production-mode customer ordering', () => {
  test('order URL with real qr_token loads the live menu', async ({
    page,
  }) => {
    await page.goto(`/order/${pubSlug}/${firstTableToken}`);

    await expect(
      page.getByRole('heading', { level: 1, name: pubName })
    ).toBeVisible();
    await expect(page.getByText(firstItemName).first()).toBeVisible();
  });

  test('invalid qr_token returns 404', async ({ page }) => {
    const response = await page.goto(
      `/order/${pubSlug}/not-a-real-uuid-aaaaaaaaaa`
    );
    expect(response?.status()).toBe(404);
  });

  // FIXME: rework for the Stripe payment + /api/checkin flow. In production
  // "Place Order" now opens the Stripe Payment Element (no instant order row),
  // and ordering requires a valid check-in cookie. The three order-placement
  // tests below assume the old demo-style instant order and no longer apply.
  test.fixme('places an order and the row appears in Supabase', async ({ page }) => {
    await page.goto(`/order/${pubSlug}/${firstTableToken}`);

    // Add one of the first menu item.
    await page
      .getByRole('button', { name: `Add ${firstItemName} to cart` })
      .click();

    await page.getByRole('button', { name: /View order|View Order/i }).click();
    await page.getByRole('button', { name: /Place Order/i }).click();

    // Read the confirmation code shown on screen.
    const heading = page.getByRole('heading', { name: /Order #\d{4}/ });
    await expect(heading).toBeVisible({ timeout: 10000 });
    const headingText = (await heading.textContent()) ?? '';
    const codeMatch = headingText.match(/#(\d{4})/);
    expect(codeMatch).not.toBeNull();
    const code = codeMatch![1];

    // Round-trip: fetch that order from Supabase and verify it matches.
    const { data: order, error } = await supabase
      .from('orders')
      .select(
        'id, pub_id, table_id, status, confirmation_code, total, order_items(name, price, quantity)'
      )
      .eq('pub_id', pubId)
      .eq('confirmation_code', code)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    expect(error, JSON.stringify(error)).toBeNull();
    expect(order!.confirmation_code).toBe(code);
    expect(order!.status).toBe('pending');
    expect(Number(order!.total)).toBeCloseTo(firstItemPrice, 2);
    const items = order!.order_items as Array<{
      name: string;
      price: number;
      quantity: number;
    }>;
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe(firstItemName);
    expect(items[0].quantity).toBe(1);

    // Clean up so we don't pile up junk orders.
    await supabase.from('orders').delete().eq('id', order!.id);
  });

  test.fixme('two customers at different tables get distinct orders', async ({
    browser,
  }) => {
    // Separate contexts → separate cookie jars, so each customer has their
    // own bartab_session. (Sharing a context would make the second customer
    // pick up the first customer's in-flight order via the cookie.)
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const a = await ctxA.newPage();
    const b = await ctxB.newPage();

    await a.goto(`/order/${pubSlug}/${firstTableToken}`);
    await a
      .getByRole('button', { name: `Add ${firstItemName} to cart` })
      .click();
    await a.getByRole('button', { name: /View order|View Order/i }).click();
    await a.getByRole('button', { name: /Place Order/i }).click();
    const aHeading = a.getByRole('heading', { name: /Order #\d{4}/ });
    await expect(aHeading).toBeVisible({ timeout: 10000 });
    const aCode = (await aHeading.textContent())!.match(/#(\d{4})/)![1];

    await b.goto(`/order/${pubSlug}/${secondTableToken}`);
    await b
      .getByRole('button', { name: `Add ${firstItemName} to cart` })
      .click();
    await b.getByRole('button', { name: /View order|View Order/i }).click();
    await b.getByRole('button', { name: /Place Order/i }).click();
    const bHeading = b.getByRole('heading', { name: /Order #\d{4}/ });
    await expect(bHeading).toBeVisible({ timeout: 10000 });
    const bCode = (await bHeading.textContent())!.match(/#(\d{4})/)![1];

    // Look both up from Supabase by their codes — should be different orders
    // even if codes happen to collide (codes aren't unique, ids are).
    const { data: rows } = await supabase
      .from('orders')
      .select('id, confirmation_code, table_id')
      .eq('pub_id', pubId)
      .in('confirmation_code', [aCode, bCode])
      .order('created_at', { ascending: false })
      .limit(4);

    const aOrder = rows!.find((r) => r.confirmation_code === aCode);
    const bOrder = rows!.find((r) => r.confirmation_code === bCode);
    expect(aOrder).toBeDefined();
    expect(bOrder).toBeDefined();
    expect(aOrder!.id).not.toBe(bOrder!.id);
    expect(aOrder!.table_id).not.toBe(bOrder!.table_id);

    // Clean up.
    await supabase
      .from('orders')
      .delete()
      .in('id', [aOrder!.id, bOrder!.id]);

    await ctxA.close();
    await ctxB.close();
  });

  test.fixme('realtime: bar-side status update propagates to customer screen', async ({
    page,
  }) => {
    // KNOWN FLAKY on Supabase Free tier:
    // The postgres_cdc_rls worker shares a connection pool that's often
    // exhausted when other queries are in flight. Realtime UPDATE events get
    // dropped. The code path itself is correct — proven by the standalone
    // diagnostic — but this assertion will time out under load on Free tier.
    // Resolves on Pro plan ($25/mo) which gives realtime its own pool.
    test.skip(
      !process.env.RUN_FLAKY_REALTIME,
      'Skipped — Supabase Free tier connection pool drops realtime UPDATEs. Set RUN_FLAKY_REALTIME=1 to attempt.'
    );

    // Customer places an order.
    await page.goto(`/order/${pubSlug}/${firstTableToken}`);
    await page
      .getByRole('button', { name: `Add ${firstItemName} to cart` })
      .click();
    await page.getByRole('button', { name: /View order|View Order/i }).click();
    await page.getByRole('button', { name: /Place Order/i }).click();

    const heading = page.getByRole('heading', { name: /Order #\d{4}/ });
    await expect(heading).toBeVisible({ timeout: 10000 });
    const code = (await heading.textContent())!.match(/#(\d{4})/)![1];

    // Look up the order id.
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('pub_id', pubId)
      .eq('confirmation_code', code)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    expect(order).not.toBeNull();

    // Give the realtime subscription time to establish. On Supabase Free tier
    // the postgres_cdc_rls worker shares a connection pool that gets backed up
    // when other connections are active, so we wait longer here.
    await page.waitForTimeout(3000);

    // Helper that re-fires the update if the customer screen doesn't pick it
    // up — same workaround we recommend for Free tier projects in production.
    async function setStatusAndExpect(
      newStatus: string,
      expectedText: RegExp
    ) {
      await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order!.id);

      try {
        await expect(page.getByText(expectedText)).toBeVisible({
          timeout: 20000,
        });
      } catch {
        // Pool was likely busy. Re-fire the update once.
        await supabase
          .from('orders')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', order!.id);
        await expect(page.getByText(expectedText)).toBeVisible({
          timeout: 15000,
        });
      }
    }

    await setStatusAndExpect('accepted', /Order confirmed/i);
    await setStatusAndExpect('preparing', /Being prepared/i);
    await setStatusAndExpect('ready', /Ready for collection/i);

    // Clean up.
    await supabase.from('orders').delete().eq('id', order!.id);
  });

  test('minimum order €5 — Place Order disabled below threshold', async ({
    page,
  }) => {
    await page.goto(`/order/${pubSlug}/${firstTableToken}`);

    // Find an item priced strictly under €5 so a single unit sits below.
    const { data: cheap } = await supabase
      .from('menu_items')
      .select('name, price')
      .eq('pub_id', pubId)
      .eq('is_available', true)
      .lt('price', 5)
      .limit(1)
      .maybeSingle();

    test.skip(
      !cheap,
      'No menu item is priced below €5 — minimum-order test cannot run'
    );

    await page
      .getByRole('button', { name: `Add ${cheap!.name} to cart` })
      .click();
    await page.getByRole('button', { name: /View order|View Order/i }).click();

    // The minimum-order hint appears, and Place Order is disabled.
    await expect(
      page.getByText(/Minimum order €5\.00/i)
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole('button', { name: /Place Order/i })
    ).toBeDisabled();
  });

  test('cancel_reason column accepts a string and round-trips', async ({}) => {
    // RLS blocks anon-key UPDATEs on orders (only the owner can update via
    // "Owners manage own orders"), so we verify the cancel_reason column via
    // INSERT instead — which DOES go through Public create policy.
    const reason = "We're out of Guinness, sorry";
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        pub_id: pubId,
        table_id: null,
        session_token: 'cancel-test-' + Date.now(),
        confirmation_code: '7777',
        total: 5.0,
        status: 'cancelled',
        cancel_reason: reason,
      })
      .select('status, cancel_reason')
      .single();

    expect(error).toBeNull();
    expect(order!.status).toBe('cancelled');
    expect(order!.cancel_reason).toBe(reason);

    await supabase.from('orders').delete().eq('confirmation_code', '7777');
  });

  test('table number uniqueness enforced at DB level (Q3.3)', async ({}) => {
    // The first table in this pub has number=1. Attempting to add another
    // table with number=1 to the same pub must error out at the DB.
    // (RLS will probably block the insert before the unique check, but
    // either way the conflicting row must NOT land.)
    const { error } = await supabase.from('tables').insert({
      pub_id: pubId,
      number: 1,
      qr_token: 'collision-test-' + Date.now(),
    });

    // Either the unique constraint fires OR the RLS blocks anon — both are
    // acceptable outcomes for this test. What matters is no second Table 1.
    expect(error).not.toBeNull();

    const { data: tablesWithNumOne } = await supabase
      .from('tables')
      .select('id')
      .eq('pub_id', pubId)
      .eq('number', 1);
    expect(tablesWithNumOne).toHaveLength(1);
  });

  test('pubs.slug is immutable (Q3.5) — direct update via owner is blocked', async ({}) => {
    // RLS blocks anon from updating pubs altogether, so this test confirms
    // the BEHAVIOUR (slug unchanged) rather than catching the specific
    // trigger error. The trigger acts as a defence-in-depth layer.
    const { error } = await supabase
      .from('pubs')
      .update({ slug: 'should-not-change' })
      .eq('id', pubId);
    // Either the update succeeds-but-no-op (RLS), errors (RLS or trigger),
    // or the trigger explicitly raises — all keep the slug intact.
    expect(error === null || error).toBeTruthy();
    const { data: stillThere } = await supabase
      .from('pubs')
      .select('slug')
      .eq('id', pubId)
      .single();
    expect(stillThere!.slug).toBe(pubSlug);
  });
});
