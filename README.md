# BarTab

**QR-code ordering and payment for pubs.** A customer scans the QR on their
table, browses the menu, orders, and pays by card — the money lands directly in
the pub's own Stripe account, and the order pops up on the bar's dashboard in
real time. No app to install, no card left behind the bar.

> Live demo: **[bartab-demo.vercel.app](https://bartab-demo.vercel.app)**

---

## How it works

**Customer** scans the table QR → `/{pubSlug}/{tableToken}` → menu → cart →
Stripe card payment → confirmation code to show/read back at the bar.

**Bar staff** sign in to `/app` → live orders dashboard, menu editor, table/QR
management, Stripe payout settings, and (optional) staff-approved check-in.

Payment is the source of truth: an order row is only created **after** Stripe
confirms the payment (via webhook), so the bar never sees unpaid or spoofed
orders.

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Supabase** — Postgres, Auth (pub owners), Realtime (live dashboard)
- **Stripe Connect** — destination charges straight to each pub's bank
- **Tailwind CSS 4** + Radix UI (shadcn-style components)
- **Vitest** (unit) + **Playwright** (e2e) · **Husky** pre-commit + GitHub Actions CI
- Hosted on **Vercel**

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values (see .env.example)
npm run dev                  # http://localhost:3000
```

With no Supabase/Stripe keys set, the app runs in **demo mode** (in-memory data,
no real payments) so you can click around immediately.

### Database

The full schema lives in [`supabase/schema.sql`](supabase/schema.sql). On a
fresh Supabase project, run that file, then apply the migrations in
[`supabase/migrations/`](supabase/migrations) in order (`0001`, `0002`). See
[`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) for the full walkthrough (project
setup, Stripe Connect, Vercel env vars).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |

A Husky pre-commit hook runs lint-staged + typecheck + unit tests; the same
checks run in CI on every push and PR.

## Security model

The database — not just the app — enforces the rules (see
[`supabase/migrations/0001_security_hardening.sql`](supabase/migrations/0001_security_hardening.sql)):

- No public read/write on `orders`, `pubs`, or `tables`. Customers reach data
  only through `SECURITY DEFINER` RPCs, and a guessed QR token resolves to
  nothing (no enumeration).
- Orders are created solely by the signature-verified Stripe webhook using the
  service-role key; prices are re-fetched server-side (client prices are never
  trusted); min/max order caps enforced on the server.
- Short-lived, HMAC-signed table-session cookie proves physical presence at the
  table before payment; Postgres-backed rate limiting on the public endpoints.

## Project layout

```
src/
  app/
    order/[pubSlug]/[tableToken]/   Customer ordering + payment flow
    app/                            Bar dashboard (orders, menu, tables, settings)
    api/checkin/                    Mints the table-session cookie
    api/stripe/                     Payment intent, webhook, Connect onboarding
  components/                       UI + CheckinApprovals panel
  lib/                              Supabase/Stripe clients, table-session, demo mode
supabase/                          schema.sql + ordered migrations
tests/                            unit (vitest) + e2e (playwright)
```

## Documentation

- [`PRODUCT.md`](PRODUCT.md) — what BarTab is and who it's for
- [`FEATURES.md`](FEATURES.md) — feature status and roadmap
- [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) — infrastructure setup
- [`CHANGELOG.md`](CHANGELOG.md) — reverse-chronological work log
