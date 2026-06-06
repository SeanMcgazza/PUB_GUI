# BarTab — Supabase setup & continuation notes

Quick guide for picking up this project on a fresh clone. Captures the things
that the code can't tell you on its own (which Supabase project, which org,
what migrations have run).

---

## The Supabase project

BarTab uses one Supabase Postgres project for the database, auth, and realtime.

- **Organization:** `bartab` (free tier, separate from the original org so
  `tradetime` and the existing TradeMen Ireland project aren't affected)
- **Project name:** `bartab Project`
- **Region:** West EU (Paris) — `eu-west-3`
- **Project ref:** `pwvaunskyjzpxvozcnkk`
- **Dashboard:** https://supabase.com/dashboard/project/pwvaunskyjzpxvozcnkk
- **API base URL:** `https://pwvaunskyjzpxvozcnkk.supabase.co`

The Supabase account email is **not** recorded here on purpose (public repo).
Sign in with whatever email created the `bartab` org.

> If you ever can't get back into the project, the safety net is the
> `supabase/schema.sql` in this repo — it's a complete recreate. Spin up a new
> Supabase project, run that file, run `MIGRATIONS_APPLIED.md` (below),
> recreate `.env.local`, done.

---

## `.env.local` — what you need

Not committed (gitignored). On a fresh clone, create
`F:\Pub_App\PUB_GUI\.env.local` (or your path) with:

```
NEXT_PUBLIC_SUPABASE_URL=https://pwvaunskyjzpxvozcnkk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<grab from Settings → API Keys in the dashboard>

# Optional — for dev on a phone/tablet over LAN.
# Comma-separated list of host IPs the dev server should accept cross-origin
# requests from. Find your PC's IP with `ipconfig` on Windows.
ALLOWED_DEV_ORIGINS=192.168.1.13
```

The **anon public** key is what goes in `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Don't
use the service_role key — that one's secret and the Next.js app doesn't need
it. (If you ever did paste the service_role key somewhere it shouldn't be,
rotate it from the same API Keys page.)

---

## Migrations applied to the project

The project's database is a strict superset of `supabase/schema.sql` at the
commit you cloned. If you ever rebuild from scratch:

1. Run `supabase/schema.sql` first (creates all tables, RLS, indexes).
2. Apply any incremental migrations recorded below in order.

| Date applied | Source | Notes |
|---|---|---|
| 2026-06-06 | `supabase/schema.sql` at commit `a1e4d5e` | Initial schema — 6 tables, RLS, realtime |
| 2026-06-06 | Post-`a1e4d5e` diff (see below) | UNIQUE(pub_id,number); orders.cancel_reason; REPLICA IDENTITY FULL; immutable slug trigger |

### Post-`a1e4d5e` migration (idempotent — safe to re-run)

```sql
-- 1. Tables: UNIQUE(pub_id, number). Wrapped in a DO block because Postgres
--    has no "ADD CONSTRAINT IF NOT EXISTS" syntax.
DO $$ BEGIN
  ALTER TABLE public.tables
    ADD CONSTRAINT tables_pub_id_number_key UNIQUE (pub_id, number);
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'constraint tables_pub_id_number_key already exists, skipping';
END $$;

-- 2. orders.cancel_reason
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_reason text;

-- 3. orders REPLICA IDENTITY FULL
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- 4. pubs.slug immutability trigger
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
```

Whenever `supabase/schema.sql` changes in a way that affects the running
project, add a row to the table above and the migration SQL below it.

---

## Seed data for quick functional testing

Skips the onboarding flow. Replace the email on the marked line with the one
you signed up with, then run in the SQL editor:

```sql
DO $$
DECLARE
  v_user_id uuid;
  v_pub_id uuid;
  v_drinks_cat uuid;
  v_food_cat uuid;
BEGIN
  -- 👇 CHANGE THIS to the email you signed up with
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'test@test.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Sign up first, then re-run.';
  END IF;

  INSERT INTO public.pubs (owner_id, name, slug, address)
  VALUES (v_user_id, 'Test Pub', 'test-pub', '123 Test Street')
  RETURNING id INTO v_pub_id;

  INSERT INTO public.tables (pub_id, number, name, qr_token, status) VALUES
    (v_pub_id, 1, 'Table 1',      'tok-table-1', 'available'),
    (v_pub_id, 2, 'Table 2',      'tok-table-2', 'available'),
    (v_pub_id, 3, 'Window Booth', 'tok-table-3', 'available');

  INSERT INTO public.menu_categories (pub_id, name, "order")
  VALUES (v_pub_id, 'Drinks', 1) RETURNING id INTO v_drinks_cat;
  INSERT INTO public.menu_categories (pub_id, name, "order")
  VALUES (v_pub_id, 'Food', 2) RETURNING id INTO v_food_cat;

  INSERT INTO public.menu_items (pub_id, category_id, name, description, price, is_available) VALUES
    (v_pub_id, v_drinks_cat, 'Guinness',        'Pint of plain',           6.50, true),
    (v_pub_id, v_drinks_cat, 'Heineken',        'Pint',                    6.00, true),
    (v_pub_id, v_drinks_cat, 'Carlsberg',       'Pint',                    5.80, true),
    (v_pub_id, v_drinks_cat, 'Coca-Cola',       'Glass',                   3.00, true),
    (v_pub_id, v_drinks_cat, 'Sparkling Water', 'Glass',                   2.50, true),
    (v_pub_id, v_food_cat,   'Burger',          'Beef burger with chips', 12.50, true),
    (v_pub_id, v_food_cat,   'Fish & Chips',    'Cod, chips, mushy peas', 14.00, true),
    (v_pub_id, v_food_cat,   'Chicken Wings',   '8 piece, BBQ or buffalo', 9.50, true),
    (v_pub_id, v_food_cat,   'Chips',           'Bowl of chips',           4.50, true);

  RAISE NOTICE 'Done. Order URL pattern: /order/test-pub/tok-table-1';
END $$;
```

Before signing up, also turn off email confirmation so signup is instant:

Dashboard → **Authentication → Sign In / Providers → Email** → toggle
**Confirm email** to OFF → Save.

---

## Running the app on a fresh clone

```powershell
# 1. Clone
git clone https://github.com/SeanMcgazza/PUB_GUI.git F:\Pub_App\PUB_GUI
cd F:\Pub_App\PUB_GUI
git checkout bartab-nextjs

# 2. Dependencies
npm install

# 3. Create .env.local (see above for contents)

# 4. Apply schema + post-schema migration to the Supabase project
#    (Skip if you're reusing the existing project — it's already migrated.)

# 5. Dev server, accessible from the LAN
npm run dev -- -H 0.0.0.0 -p 3000
```

Open:

- **PC / owner dashboard:** http://localhost:3000
- **Tablet (bar view):** http://<your-PC-LAN-IP>:3000/app/orders (sign in)
- **Phone (customer):** http://<your-PC-LAN-IP>:3000/order/test-pub/tok-table-1

Both devices must be on the same Wi-Fi as the dev PC, and the LAN IP must be
listed in `ALLOWED_DEV_ORIGINS` in `.env.local`. First time Node binds, Windows
Firewall may prompt — click **Allow** on Private only.

---

## TODOs for the next session

- [ ] Rotate the service_role key — it was pasted into a chat transcript and
      should be considered compromised. Dashboard → Settings → API Keys.
- [ ] Decide what to do with the original `trademenirelandie@gmail.com's Org`
      `tradetime` project (still paused). Either dump to a `.sql` for archive
      or delete.
- [ ] Tighten RLS — see the TODO block at the top of `supabase/schema.sql`
      (anon SELECT/INSERT on orders, client-trusted `orders.total`, etc.)
      before going anywhere near production.
