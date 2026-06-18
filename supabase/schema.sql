-- BarTab Database Schema
-- Pub ordering system
--
-- ============================================================================
-- SECURITY MODEL  (hardened — see supabase/migrations/0001_security_hardening.sql)
-- ============================================================================
-- Public (anon-key) clients have NO direct read/write on orders, and no broad
-- read on pubs/tables. They reach data through two SECURITY DEFINER functions:
--   * get_ordering_context(slug, qr_token) — resolve a pub + table + menu, but
--     ONLY when the qr_token matches (no table/qr_token enumeration).
--   * get_order_status(session_token)      — read ONLY the caller's own order.
-- Orders are created exclusively by the Stripe webhook (service-role key) after
-- payment clears. Owners manage their own pub's rows via the owner RLS policies.
--
-- RESOLVED from the original audit:
--   [done] public orders SELECT/INSERT removed (was USING/ WITH CHECK true)
--   [done] public pubs/tables SELECT removed (qr_token + stripe_account_id leak)
--   [done] confirmation_code uniqueness (idx_orders_active_code_uq)
--   [done] payment_intent_id idempotency (idx_orders_payment_intent_uq)
--   [done] logo_url forced https (pubs_logo_url_https) — CSS-injection guard
--
-- STILL OPEN (tracked, not blocking the lockdown):
--   [ ] orders.total is computed by the server route (payment-intent) from DB
--       prices — good — but is not yet re-derived by a DB trigger. Consider a
--       trigger that recomputes total from order_items x menu_items.price.
-- ============================================================================

-- Pubs (the business)
CREATE TABLE public.pubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  address text,
  phone text,
  logo_url text,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tables in the pub
CREATE TABLE public.tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pub_id uuid REFERENCES public.pubs(id) ON DELETE CASCADE,
  number int NOT NULL,
  name text, -- e.g. "Window Booth", "Bar Stool 3"
  qr_token text UNIQUE NOT NULL, -- secret in QR code
  status text DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  created_at timestamptz DEFAULT now(),
  -- Q3.3: two tables in the same pub can't share a number.
  UNIQUE (pub_id, number)
);

-- Menu categories
CREATE TABLE public.menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pub_id uuid REFERENCES public.pubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  "order" int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Menu items
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pub_id uuid REFERENCES public.pubs(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  image_url text,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pub_id uuid REFERENCES public.pubs(id) ON DELETE CASCADE,
  table_id uuid REFERENCES public.tables(id) ON DELETE SET NULL,
  session_token text NOT NULL, -- ties to customer session
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'preparing', 'ready', 'collected', 'cancelled')),
  confirmation_code text NOT NULL, -- 4-digit code
  total numeric(10,2) DEFAULT 0,
  notes text,
  -- Optional reason the bar provides when cancelling. Shown on the customer's
  -- cancelled-order screen. Per Q2.2.
  cancel_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  quantity int DEFAULT 1,
  notes text
);

-- RLS policies
ALTER TABLE public.pubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Public read for menus (customers need to see). A menu is not sensitive.
CREATE POLICY "Public can read menu items" ON public.menu_items FOR SELECT USING (is_available = true);
CREATE POLICY "Public can read menu categories" ON public.menu_categories FOR SELECT USING (true);

-- NOTE: there is intentionally NO public SELECT on pubs/tables and NO public
-- SELECT/INSERT on orders/order_items. Public access goes through the
-- SECURITY DEFINER functions defined at the bottom of this file
-- (get_ordering_context / get_order_status). Orders are inserted only by the
-- Stripe webhook using the service-role key. See the SECURITY MODEL header.

-- Owners manage their pub
CREATE POLICY "Owners manage own pub" ON public.pubs FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Owners manage own tables" ON public.tables FOR ALL USING (pub_id IN (SELECT id FROM public.pubs WHERE owner_id = auth.uid()));
CREATE POLICY "Owners manage own categories" ON public.menu_categories FOR ALL USING (pub_id IN (SELECT id FROM public.pubs WHERE owner_id = auth.uid()));
CREATE POLICY "Owners manage own menu items" ON public.menu_items FOR ALL USING (pub_id IN (SELECT id FROM public.pubs WHERE owner_id = auth.uid()));
CREATE POLICY "Owners manage own orders" ON public.orders FOR ALL USING (pub_id IN (SELECT id FROM public.pubs WHERE owner_id = auth.uid()));
CREATE POLICY "Owners manage own order items" ON public.order_items FOR ALL USING (order_id IN (SELECT id FROM public.orders WHERE pub_id IN (SELECT id FROM public.pubs WHERE owner_id = auth.uid())));

-- Indexes
CREATE INDEX idx_tables_pub ON public.tables(pub_id);
CREATE INDEX idx_tables_qr_token ON public.tables(qr_token);
CREATE INDEX idx_menu_items_pub ON public.menu_items(pub_id);
CREATE INDEX idx_menu_categories_pub ON public.menu_categories(pub_id);
CREATE INDEX idx_orders_pub ON public.orders(pub_id);
CREATE INDEX idx_orders_status ON public.orders(pub_id, status);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- Enable realtime for orders.
-- REPLICA IDENTITY FULL is required for Supabase to broadcast UPDATE events
-- with the new row payload. Without it, postgres_changes UPDATE events fire
-- but the client only sees the old row, so the status-update loop breaks.
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Q3.5: pubs.slug is immutable after creation. Old QR codes encode the slug,
-- so changing it would silently break every printed QR. Enforce at the DB
-- level so even direct REST API calls can't change it.
CREATE OR REPLACE FUNCTION public.prevent_pub_slug_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS DISTINCT FROM OLD.slug THEN
    RAISE EXCEPTION 'pubs.slug is immutable after creation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pubs_slug_immutable ON public.pubs;
CREATE TRIGGER pubs_slug_immutable
  BEFORE UPDATE ON public.pubs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_pub_slug_change();

-- ============================================================================
-- Security hardening (see migrations/0001_security_hardening.sql for context)
-- ============================================================================

-- Integrity constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_intent_uq
  ON public.orders(payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_active_code_uq
  ON public.orders(pub_id, confirmation_code)
  WHERE status IN ('pending','accepted','preparing','ready');

ALTER TABLE public.pubs
  ADD CONSTRAINT pubs_logo_url_https
  CHECK (logo_url IS NULL OR logo_url ~* '^https://');

-- Public ordering reads (replaces public SELECT on pubs/tables).
CREATE OR REPLACE FUNCTION public.get_ordering_context(p_slug text, p_qr_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_pub   public.pubs;
  v_table public.tables;
BEGIN
  SELECT * INTO v_pub FROM public.pubs WHERE slug = p_slug;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT * INTO v_table
    FROM public.tables
   WHERE pub_id = v_pub.id AND qr_token = p_qr_token;
  IF NOT FOUND THEN RETURN NULL; END IF;

  RETURN jsonb_build_object(
    'pub', jsonb_build_object(
      'id', v_pub.id, 'name', v_pub.name, 'slug', v_pub.slug,
      'logo_url', v_pub.logo_url, 'settings', v_pub.settings,
      'stripe_charges_enabled', v_pub.stripe_charges_enabled
    ),
    'table', jsonb_build_object(
      'id', v_table.id, 'number', v_table.number, 'name', v_table.name,
      'qr_token', v_table.qr_token, 'status', v_table.status
    ),
    'categories', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', c.id, 'pub_id', c.pub_id,
                                          'name', c.name, 'order', c."order")
                       ORDER BY c."order")
        FROM public.menu_categories c WHERE c.pub_id = v_pub.id), '[]'::jsonb),
    'menu_items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', m.id, 'pub_id', m.pub_id,
                                          'category_id', m.category_id, 'name', m.name,
                                          'description', m.description, 'price', m.price,
                                          'image_url', m.image_url, 'is_available', m.is_available)
                       ORDER BY m.name)
        FROM public.menu_items m
       WHERE m.pub_id = v_pub.id AND m.is_available = true), '[]'::jsonb)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.get_ordering_context(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_ordering_context(text, text) TO anon, authenticated;

-- Customer order-status read (replaces public SELECT on orders).
CREATE OR REPLACE FUNCTION public.get_order_status(p_session_token text)
RETURNS SETOF public.orders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT * FROM public.orders WHERE session_token = p_session_token
$$;
REVOKE ALL ON FUNCTION public.get_order_status(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_order_status(text) TO anon, authenticated;

-- Rate limiting (fixed window, Postgres-backed).
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key          text PRIMARY KEY,
  count        int         NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only the SECURITY DEFINER function below can touch it.

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_key text, p_max int, p_window_secs int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO public.rate_limits AS rl (key, count, window_start)
       VALUES (p_key, 1, now())
  ON CONFLICT (key) DO UPDATE
       SET count = CASE WHEN rl.window_start < now() - make_interval(secs => p_window_secs)
                        THEN 1 ELSE rl.count + 1 END,
           window_start = CASE WHEN rl.window_start < now() - make_interval(secs => p_window_secs)
                        THEN now() ELSE rl.window_start END
  RETURNING count INTO v_count;
  RETURN v_count <= p_max;
END;
$$;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, int, int) FROM public;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, int, int) TO anon, authenticated;

-- ============================================================================
-- Optional staff-approved check-in (migrations/0002_staff_approval_checkin.sql)
-- ============================================================================
ALTER TABLE public.pubs
  ADD COLUMN IF NOT EXISTS require_checkin_approval boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.table_checkins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pub_id     uuid NOT NULL REFERENCES public.pubs(id) ON DELETE CASCADE,
  table_id   uuid NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  status     text NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_table_checkins_pub_status
  ON public.table_checkins(pub_id, status);

ALTER TABLE public.table_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners manage own checkins" ON public.table_checkins;
CREATE POLICY "Owners manage own checkins" ON public.table_checkins
  FOR ALL USING (
    pub_id IN (SELECT id FROM public.pubs WHERE owner_id = auth.uid())
  );
ALTER TABLE public.table_checkins REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_checkins;

CREATE OR REPLACE FUNCTION public.request_checkin(p_slug text, p_qr_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_pub     public.pubs;
  v_table   public.tables;
  v_checkin public.table_checkins;
BEGIN
  SELECT * INTO v_pub FROM public.pubs WHERE slug = p_slug;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT * INTO v_table
    FROM public.tables
   WHERE pub_id = v_pub.id AND qr_token = p_qr_token;
  IF NOT FOUND THEN RETURN NULL; END IF;

  IF NOT v_pub.require_checkin_approval THEN
    RETURN jsonb_build_object('requiresApproval', false,
      'pubId', v_pub.id, 'tableId', v_table.id);
  END IF;

  SELECT * INTO v_checkin
    FROM public.table_checkins
   WHERE table_id = v_table.id
     AND status IN ('pending', 'approved')
     AND created_at > now() - interval '30 minutes'
   ORDER BY created_at DESC
   LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.table_checkins (pub_id, table_id)
      VALUES (v_pub.id, v_table.id)
      RETURNING * INTO v_checkin;
  END IF;

  RETURN jsonb_build_object('requiresApproval', true,
    'pubId', v_pub.id, 'tableId', v_table.id,
    'checkinId', v_checkin.id, 'status', v_checkin.status);
END;
$$;
REVOKE ALL ON FUNCTION public.request_checkin(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.request_checkin(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_checkin_status(p_checkin_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT status FROM public.table_checkins WHERE id = p_checkin_id
$$;
REVOKE ALL ON FUNCTION public.get_checkin_status(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_checkin_status(uuid) TO anon, authenticated;
