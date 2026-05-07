-- BarTab Database Schema
-- Pub ordering system
--
-- ============================================================================
-- SECURITY REVIEW (TODO before launch — needs a real Supabase project to test)
-- ============================================================================
-- The current RLS policies are MVP-permissive. Before going to production:
--
-- 1. "Public can read own orders" (line ~93) currently uses USING (true).
--    Anyone with the anon key can read every pub's orders, including totals
--    and notes. Tighten to only allow reading orders matching the caller's
--    session_token cookie. Suggested approach: use request.headers JSON via
--    `current_setting('request.headers', true)::json` and parse the
--    `bartab_session` cookie. Alternatively, remove the public SELECT policy
--    and route order lookups through a SECURITY DEFINER Postgres function
--    that takes session_token as an argument.
--
-- 2. "Public can create orders" uses WITH CHECK (true). A malicious client
--    could insert orders with a forged pub_id or table_id. Tighten with
--    subquery validation:
--      WITH CHECK (
--        pub_id IN (SELECT id FROM public.pubs)
--        AND (
--          table_id IS NULL
--          OR EXISTS (
--            SELECT 1 FROM public.tables t
--            WHERE t.id = table_id AND t.pub_id = orders.pub_id
--          )
--        )
--      )
--
-- 3. orders.total is set client-side. The bar trusts what the customer
--    sends. Move totalling to a Postgres trigger that recomputes from
--    order_items × menu_items.price.
--
-- 4. confirmation_code (4-digit random) has no uniqueness constraint;
--    collisions are inevitable. Either add UNIQUE(pub_id, confirmation_code)
--    over a recent window, or generate sequentially per-pub.
--
-- 5. tables.qr_token and pubs are readable via USING (true). qr_token is a
--    UUID so unguessable in practice, but you may want a per-pub view that
--    exposes only ordering-relevant columns and hides phone/address until
--    they're actually used.
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
  created_at timestamptz DEFAULT now()
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

-- Public read for menus (customers need to see)
CREATE POLICY "Public can read menu items" ON public.menu_items FOR SELECT USING (is_available = true);
CREATE POLICY "Public can read menu categories" ON public.menu_categories FOR SELECT USING (true);
CREATE POLICY "Public can read pub info" ON public.pubs FOR SELECT USING (true);
CREATE POLICY "Public can read tables" ON public.tables FOR SELECT USING (true);

-- Public can create orders (from QR scan)
CREATE POLICY "Public can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can create order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read own orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public can read order items" ON public.order_items FOR SELECT USING (true);

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

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
