# BarTab — Setup & continuation notes

Quick guide for picking up this project on a fresh clone. Captures the things
that the code can't tell you on its own (which Supabase project, which Stripe
account, which Vercel deployment, what migrations have run).

## Status (2026-06-16)

✅ **Supabase** — connected, real DB live at `pwvaunskyjzpxvozcnkk`
✅ **Vercel** — auto-deploys from `bartab-nextjs` branch to `bartab-demo.vercel.app`
✅ **Stripe Connect** — set up in TEST/SANDBOX mode, end-to-end payments working
   (customer → Stripe → connected account → "paid" badge on orders)
🔲 **Live-mode Stripe** — not switched on yet (needs platform business verification,
   real domain, T&Cs/Privacy Policy). All code is live-ready; just env var swap +
   webhook recreate when ready.
🔲 **RLS hardening** — security review block at top of `supabase/schema.sql` still
   open. Fine for demo; tighten before real customer data.

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
# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=https://pwvaunskyjzpxvozcnkk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<grab from Settings → API Keys in the dashboard>

# --- LAN dev access (optional) ---
# Comma-separated list of host IPs the dev server should accept cross-origin
# requests from. Find your PC's IP with `ipconfig` on Windows.
ALLOWED_DEV_ORIGINS=192.168.1.13

# --- Stripe (only needed locally if you want to run the payment routes locally) ---
# In test mode these come from https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
# Server role key. Used by the webhook, the payment-intent route, and the
# check-in route to bypass RLS for trusted server-side work. Server-only —
# never expose to the client.
SUPABASE_SERVICE_ROLE_KEY=eyJ...service-role-key...

# --- Table check-in presence (required in production) ---
# Random >= 16-char secret that signs the short-lived table-session cookie
# minted by /api/checkin and required by /api/stripe/payment-intent. This is
# what stops ordering from a shared link / stale tab. Generate with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
TABLE_SESSION_SECRET=replace-with-a-long-random-secret
```

The **anon public** key is what goes in `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Don't
use the service_role key for that — that one's secret and the client doesn't
need it. (If you ever did paste the service_role key somewhere it shouldn't be,
rotate it from the same API Keys page.)

### Vercel env vars (deployed `bartab-demo` project)

All 7 of these MUST be set on Vercel for the deployment to work. The Stripe
ones are read by serverless functions at runtime; the `NEXT_PUBLIC_*` ones
must be present at BUILD time so they get baked into the client bundle. After
adding or changing any of these, trigger a no-cache redeploy.

| Variable | Where it's used | Sensitive? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | No (designed to be public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (webhook) | **YES** — keep secret |
| `STRIPE_SECRET_KEY` | Server only | **YES** — keep secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Browser | No |
| `STRIPE_WEBHOOK_SECRET` | Server only (webhook) | **YES** — keep secret |
| `TABLE_SESSION_SECRET` | Server only (checkin + payment-intent) | **YES** — keep secret |
| `ALLOWED_DEV_ORIGINS` | Server (dev only) | No |

---

## Stripe Connect (card payments)

BarTab is wired up as a **Stripe Connect platform**. The pattern:

- BarTab itself = the **platform account** (one Stripe account, owned by you/Sean)
- Each pub = a **connected account** (their own Stripe sub-account, onboarded
  via "Connect Stripe" button in `/app/settings`)
- Customer card payments go through Stripe's platform → automatically routed
  to the pub's connected account via `transfer_data` on the Payment Intent
- BarTab platform fee currently set to **€0.00 per order** (configurable in
  `src/app/api/stripe/payment-intent/route.ts`, constant `PLATFORM_FEE_CENTS`)
- Stripe processing fee (1.4% + €0.25 for EU cards) is automatically deducted
  before money reaches the pub

### Current Stripe account

- **Platform account name:** `BarTab`
- **Country:** Ireland (`IE`)
- **Mode:** Sandbox (test mode) — `pk_test_...` / `sk_test_...`
- **Dashboard:** https://dashboard.stripe.com/test
- **Connect dashboard:** https://dashboard.stripe.com/test/connect/accounts
- **Webhook destination:** `BarTab production` → `https://bartab-demo.vercel.app/api/stripe/webhook`,
  listening to:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `account.updated`
  - `account.application.deauthorized`

The Stripe account email is not recorded here on purpose (public repo).

### Switching to live mode (when ready)

The code is identical in live mode — no source changes needed. Steps:

1. From the Stripe dashboard click **"Activate account"** in the top right. You'll
   complete real business verification: legal name, tax ID (PPS number for sole
   trader; CRO number for limited company), real address, ID upload, bank IBAN
   for platform fees. Approval is 1-3 working days for most EU sole traders.
2. **Buy and configure a real domain** (e.g. `bartab.app`) — Stripe Live often
   rejects `*.vercel.app` as a platform domain. Set it up in Vercel → Settings →
   Domains.
3. Generate live API keys from Stripe (Developers → API keys, switch to Live mode
   toggle), then create a NEW live-mode webhook endpoint with the same 4 events
   pointing at the new domain.
4. Update the four env vars in Vercel:
   - `STRIPE_SECRET_KEY` → `sk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
   - `STRIPE_WEBHOOK_SECRET` → live `whsec_...`
   - `SUPABASE_SERVICE_ROLE_KEY` → no change
5. Trigger a no-cache redeploy on Vercel.
6. Add legal docs to a footer: Privacy Policy, Customer T&Cs, Platform/Pub
   Terms. Free templates from Termly are sufficient for early pubs.

### Test card numbers (sandbox only)

| Outcome | Card | Notes |
|---|---|---|
| Succeed | `4242 4242 4242 4242` | Standard happy path |
| Declined | `4000 0000 0000 0002` | Generic decline |
| Insufficient funds | `4000 0000 0000 9995` | Triggers payment_intent.payment_failed |
| Requires authentication (3DS) | `4000 0027 6000 3184` | Tests Strong Customer Auth flow |

Any future expiry (`12/34`), any 3-digit CVC, any postcode.

### Test connected-account bank IBAN

`IE29 AIBK 9311 5212 3456 78` — Stripe's official Irish test IBAN. BIC if asked:
`AIBKIE2D`. Stripe accepts any valid-format value in test mode.

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
| 2026-06-16 | Stripe Connect columns (see below) | `pubs.stripe_account_id`, `pubs.stripe_charges_enabled`, `orders.payment_intent_id`, `orders.payment_status`, `orders.paid_at` |
| 2026-06-18 | `migrations/0001_security_hardening.sql` | **Security lockdown.** Drops public SELECT/INSERT on orders + public SELECT on pubs/tables; adds `get_ordering_context` / `get_order_status` / `check_rate_limit` functions + `rate_limits` table; unique `payment_intent_id` + active `confirmation_code`; `logo_url` https CHECK. **Run this file in the SQL editor.** Also set `TABLE_SESSION_SECRET`. |
| 2026-06-18 | `migrations/0002_staff_approval_checkin.sql` | Optional staff-approved check-in: `pubs.require_checkin_approval` toggle, `table_checkins` table (+ RLS + realtime), `request_checkin` / `get_checkin_status` functions. Run after 0001. Off by default — owners enable it in Settings. |

### Post-`a1e4d5e` migration (idempotent — safe to re-run)

```sql
-- 1. Tables: UNIQUE(pub_id, number). Wrapped in a DO block because Postgres
--    has no "ADD CONSTRAINT IF NOT EXISTS" syntax.
DO $$ BEGIN
  ALTER TABLE public.tables
    ADD CONSTRAINT tables_pub_id_number_key UNIQUE (pub_id, number);
EXCEPTION
  -- duplicate_object catches the constraint itself; duplicate_table catches
  -- its backing index (Postgres creates an index with the constraint name).
  WHEN duplicate_object OR duplicate_table THEN
    RAISE NOTICE 'constraint or backing index already exists, skipping';
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

### 2026-06-16 — Stripe Connect columns (idempotent)

```sql
-- Stripe Connect: each pub has its own connected Stripe account
ALTER TABLE public.pubs
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean DEFAULT false;

-- Payment fields on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_intent_id text,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded', 'failed')),
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Index so the webhook can find an order by its Stripe payment_intent_id fast
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent
  ON public.orders(payment_intent_id);
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

## What's done vs what's open

### Done

- [x] Supabase wired up, schema applied, migrations recorded
- [x] Vercel deploys `bartab-nextjs` branch → `bartab-demo.vercel.app`
- [x] Real-time order updates customer ↔ bar (Supabase Realtime + 3s polling fallback)
- [x] Phone notifications (vibrate + chime + OS banner on order ready)
- [x] **Stripe Connect (test mode) end-to-end working** — customer pays by card,
      money is routed straight to the connected pub's Stripe balance, webhook
      creates the order in Supabase only after payment succeeds

### Still open

- [ ] **Switch Stripe to live mode** — needs platform business verification +
      a real (non-vercel.app) domain + minimum legal docs (Privacy Policy,
      Customer T&Cs, Platform/Pub Terms). See the "Switching to live mode"
      block above.
- [ ] **Rotate sensitive keys** that may have been pasted in a chat transcript
      during today's session: Supabase service_role key, Stripe `sk_test_*`,
      Stripe webhook `whsec_*`. All can be regenerated from their respective
      dashboards — test-mode keys can't move real money, so it's hygiene
      rather than urgent.
- [ ] **Tighten RLS** — security review block at top of `supabase/schema.sql`
      lists 5 specific holes (anon SELECT/INSERT on orders, client-trusted
      `orders.total`, etc.). Fine for demos; tighten before storing real
      customer data.
- [ ] **Tradetime project** — still paused in the original Supabase org.
      Either dump to a `.sql` for archive or delete.
- [ ] **Tipping** — currently no tip UI in cart. Easy to add as an optional
      extra line that increments the Payment Intent amount and gets routed to
      either the pub or the platform.
- [ ] **Service worker for true background notifications** — current setup
      only alerts when the customer tab is in front. Adding a service worker
      + Web Push subscription would alert through a locked phone.
- [ ] **Refund UI** — webhook handler already supports refund tracking
      (`payment_status='refunded'`), but the bar-side Cancel action doesn't
      yet call `stripe.refunds.create()`. ~30 min of work.
