-- ============================================================================
-- 0001_security_hardening.sql
-- ============================================================================
-- Closes the launch-blocking security holes from the audit:
--   C1  public could INSERT arbitrary (unpaid/fake/spam) orders
--   C2  public could SELECT every order in the system
--   C3  public could SELECT every table's secret qr_token
--   C5  public could SELECT pubs.stripe_account_id / owner PII
--   C7  confirmation codes had no uniqueness
--   C10 no idempotency backstop on payment_intent_id
--
-- After this migration the ONLY ways to touch orders are:
--   * the Stripe webhook (service-role key, bypasses RLS) — creates orders
--   * the owner of the pub (authenticated, owner RLS) — manages orders
--   * a customer reading THEIR OWN order via get_order_status(session_token)
-- and public clients resolve a table ONLY via get_ordering_context(slug, token).
--
-- Idempotent: safe to re-run. Run in the Supabase SQL editor.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. ORDERS / ORDER_ITEMS — remove permissive public access (C1, C2)
-- ----------------------------------------------------------------------------
drop policy if exists "Public can create orders"       on public.orders;
drop policy if exists "Public can create order items"  on public.order_items;
drop policy if exists "Public can read own orders"      on public.orders;
drop policy if exists "Public can read order items"     on public.order_items;
-- "Owners manage own orders" / "Owners manage own order items" remain.

-- ----------------------------------------------------------------------------
-- 2. PUBS / TABLES — remove broad public SELECT (C3, C5)
--    Menu stays publicly readable (a menu is not sensitive).
-- ----------------------------------------------------------------------------
drop policy if exists "Public can read pub info" on public.pubs;
drop policy if exists "Public can read tables"   on public.tables;
-- "Owners manage own pub" / "Owners manage own tables" remain.

-- ----------------------------------------------------------------------------
-- 3. Integrity constraints (C7, C10)
-- ----------------------------------------------------------------------------
-- One order per Stripe Payment Intent — backstops the webhook's check-then-insert.
create unique index if not exists idx_orders_payment_intent_uq
  on public.orders(payment_intent_id)
  where payment_intent_id is not null;

-- Confirmation codes unique among *active* orders in a pub so two in-flight
-- orders can't share a code. Collected/cancelled excluded so codes recycle.
create unique index if not exists idx_orders_active_code_uq
  on public.orders(pub_id, confirmation_code)
  where status in ('pending','accepted','preparing','ready');

-- logo_url is interpolated into CSS on the customer page — force https so it
-- can't be used to inject CSS (C13). NOT VALID first so existing rows don't
-- block the migration; validated immediately after.
do $$ begin
  alter table public.pubs
    add constraint pubs_logo_url_https
    check (logo_url is null or logo_url ~* '^https://') not valid;
exception when duplicate_object then null; end $$;
alter table public.pubs validate constraint pubs_logo_url_https;

-- ----------------------------------------------------------------------------
-- 4. get_ordering_context(slug, qr_token) — replaces public pubs/tables reads.
--    Returns pub (safe columns only) + table + menu, ONLY when the token
--    matches a table in that pub. A wrong/guessed token returns NULL, so the
--    table list can't be enumerated.
-- ----------------------------------------------------------------------------
create or replace function public.get_ordering_context(p_slug text, p_qr_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pub   public.pubs;
  v_table public.tables;
begin
  select * into v_pub from public.pubs where slug = p_slug;
  if not found then return null; end if;

  select * into v_table
    from public.tables
   where pub_id = v_pub.id and qr_token = p_qr_token;
  if not found then return null; end if;

  return jsonb_build_object(
    'pub', jsonb_build_object(
      'id', v_pub.id,
      'name', v_pub.name,
      'slug', v_pub.slug,
      'logo_url', v_pub.logo_url,
      'settings', v_pub.settings,
      'stripe_charges_enabled', v_pub.stripe_charges_enabled
    ),
    'table', jsonb_build_object(
      'id', v_table.id,
      'number', v_table.number,
      'name', v_table.name,
      'qr_token', v_table.qr_token,   -- echoed back to the caller who supplied it
      'status', v_table.status
    ),
    'categories', coalesce((
      select jsonb_agg(
               jsonb_build_object('id', c.id, 'pub_id', c.pub_id,
                                  'name', c.name, 'order', c."order")
               order by c."order")
        from public.menu_categories c
       where c.pub_id = v_pub.id), '[]'::jsonb),
    'menu_items', coalesce((
      select jsonb_agg(
               jsonb_build_object('id', m.id, 'pub_id', m.pub_id,
                                  'category_id', m.category_id, 'name', m.name,
                                  'description', m.description, 'price', m.price,
                                  'image_url', m.image_url, 'is_available', m.is_available)
               order by m.name)
        from public.menu_items m
       where m.pub_id = v_pub.id and m.is_available = true), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_ordering_context(text, text) from public;
grant execute on function public.get_ordering_context(text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. get_order_status(session_token) — replaces public orders SELECT.
--    A customer reads ONLY orders tied to their own unguessable session token.
-- ----------------------------------------------------------------------------
create or replace function public.get_order_status(p_session_token text)
returns setof public.orders
language sql
security definer
set search_path = public, pg_temp
as $$
  select * from public.orders where session_token = p_session_token
$$;

revoke all on function public.get_order_status(text) from public;
grant execute on function public.get_order_status(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6. Rate limiting (C6) — Postgres-backed fixed window, no external infra.
--    check_rate_limit(key, max, window_secs) => true if allowed, false if over.
-- ----------------------------------------------------------------------------
create table if not exists public.rate_limits (
  key          text primary key,
  count        int         not null default 0,
  window_start timestamptz not null default now()
);
alter table public.rate_limits enable row level security;
-- No policies => no anon/authenticated direct access. Only the SECURITY
-- DEFINER function below (runs as table owner) can read/write it.

create or replace function public.check_rate_limit(
  p_key text, p_max int, p_window_secs int
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count int;
begin
  insert into public.rate_limits as rl (key, count, window_start)
       values (p_key, 1, now())
  on conflict (key) do update
       set count = case
                     when rl.window_start < now() - make_interval(secs => p_window_secs)
                     then 1
                     else rl.count + 1
                   end,
           window_start = case
                     when rl.window_start < now() - make_interval(secs => p_window_secs)
                     then now()
                     else rl.window_start
                   end
  returning count into v_count;

  return v_count <= p_max;
end;
$$;

revoke all on function public.check_rate_limit(text, int, int) from public;
grant execute on function public.check_rate_limit(text, int, int) to anon, authenticated;

commit;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ----------------------------------------------------------------------------
-- * Set TABLE_SESSION_SECRET (>=16 chars random) in the app env for the new
--   /api/checkin presence flow.
-- * Optional housekeeping: occasionally prune old rate_limit buckets, e.g.
--     delete from public.rate_limits where window_start < now() - interval '1 day';
-- ============================================================================
