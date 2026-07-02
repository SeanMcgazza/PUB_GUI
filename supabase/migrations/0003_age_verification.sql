-- ============================================================================
-- 0003_age_verification.sql
-- ============================================================================
-- Age verification WITHOUT collecting any personal data. Alcohol (and any other
-- 18+ item) is flagged on the menu; the customer ticks an 18+ acknowledgment at
-- checkout; and staff physically check ID when the drinks reach the table,
-- recording only a status + timestamp on the ORDER (never tied to a person).
--
--   menu_items.age_restricted  — owner marks which items need an ID check.
--   orders.id_check_status     — not_required | pending | verified | refused
--   orders.id_checked_at       — when staff recorded the outcome.
--
-- No date of birth, no ID image, no customer identity is stored anywhere.
--
-- Idempotent. Run after 0002, in the Supabase SQL editor.
-- ============================================================================

begin;

alter table public.menu_items
  add column if not exists age_restricted boolean not null default false;

alter table public.orders
  add column if not exists id_check_status text not null default 'not_required'
    check (id_check_status in ('not_required', 'pending', 'verified', 'refused'));
alter table public.orders
  add column if not exists id_checked_at timestamptz;

-- Dashboard filters to the orders that still need an ID check.
create index if not exists idx_orders_pub_idcheck
  on public.orders(pub_id, id_check_status);

-- ----------------------------------------------------------------------------
-- Re-publish get_ordering_context so the customer client learns which menu
-- items are age-restricted (used to require the 18+ tick before paying). Same
-- body as 0001, with age_restricted added to each menu item. Wrong token still
-- returns NULL (no enumeration).
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
      'id', v_pub.id, 'name', v_pub.name, 'slug', v_pub.slug,
      'logo_url', v_pub.logo_url, 'settings', v_pub.settings,
      'stripe_charges_enabled', v_pub.stripe_charges_enabled
    ),
    'table', jsonb_build_object(
      'id', v_table.id, 'number', v_table.number, 'name', v_table.name,
      'qr_token', v_table.qr_token, 'status', v_table.status
    ),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'pub_id', c.pub_id,
                                          'name', c.name, 'order', c."order")
                       order by c."order")
        from public.menu_categories c where c.pub_id = v_pub.id), '[]'::jsonb),
    'menu_items', coalesce((
      select jsonb_agg(jsonb_build_object('id', m.id, 'pub_id', m.pub_id,
                                          'category_id', m.category_id, 'name', m.name,
                                          'description', m.description, 'price', m.price,
                                          'image_url', m.image_url, 'is_available', m.is_available,
                                          'age_restricted', m.age_restricted)
                       order by m.name)
        from public.menu_items m
       where m.pub_id = v_pub.id and m.is_available = true), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.get_ordering_context(text, text) from public;
grant execute on function public.get_ordering_context(text, text) to anon, authenticated;

commit;
