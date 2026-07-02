# BarTab — Features & Roadmap

## Core philosophy
**Scan, order, pay — prepaid-first.** The bar never handles an unpaid order, and
the money goes straight to the pub. Keep it simple for the customer (no app) and
honest at the database level (not just the UI).

---

## ✅ Built (current)

### Customer ordering
- [x] QR → table-scoped ordering page (`/order/{pubSlug}/{tableToken}`)
- [x] Live menu with categories; unavailable items hidden
- [x] Cart with per-item quantities
- [x] Card payment via Stripe (Payment Element)
- [x] Server-enforced min / max order value
- [x] Confirmation code to show / call out at the bar
- [x] Order status updates (polling + realtime), with vibrate/chime/banner

### Payments
- [x] Stripe Connect onboarding for pubs (destination charges)
- [x] Funds settle directly to the pub's connected account
- [x] Order created only on signature-verified `payment_intent.succeeded` webhook
- [x] Idempotent order creation (unique `payment_intent_id`)
- [x] Connected-account status synced via `account.updated` webhook

### Bar dashboard (`/app`)
- [x] Owner auth (Supabase)
- [x] Real-time orders board with status workflow
- [x] Menu editor (categories, items, availability, pricing)
- [x] Table + QR code management
- [x] Settings (pub profile, Stripe payouts)
- [x] Dashboard stats

### Staff-approved check-in (opt-in)
- [x] Per-pub toggle (`require_checkin_approval`)
- [x] Customer "waiting for staff" gate; approval happens before payment
- [x] Staff Approve/Reject panel on the dashboard (realtime + poll)

### Age verification (no personal data)
- [x] Per-item `age_restricted` (18+) flag in the menu editor
- [x] Required 18+ acknowledgment at checkout when the cart has an alcohol item
- [x] Server-enforced acknowledgment (tampered client can't skip it)
- [x] Bar dashboard '🔞 Check ID' badge + verify/refuse at handoff
- [x] Stores only outcome + timestamp on the order — no DOB, ID scan, or identity

### Security & hardening
- [x] RLS lockdown — no public read/write on orders/pubs/tables
- [x] `SECURITY DEFINER` RPCs with no token enumeration
- [x] Server-side price refetch (never trust client prices)
- [x] HMAC-signed, short-lived table-session cookie (presence gate)
- [x] Postgres-backed rate limiting (per IP + per session)
- [x] Crypto-strong, unique-per-active-order confirmation codes
- [x] `logo_url` forced https (CSS-injection guard)

### Engineering
- [x] Demo mode (in-memory, no keys required)
- [x] Unit tests (Vitest) + e2e tests (Playwright, incl. RLS spec)
- [x] Husky pre-commit (lint-staged + typecheck + tests)
- [x] GitHub Actions CI

---

## 🎯 Next: production launch
- [ ] Switch Stripe to **live mode** (business verification, live keys)
- [ ] Real domain + T&Cs / Privacy Policy
- [ ] Run migrations `0001`/`0002` against the production Supabase project
- [ ] Post-migration runtime verification against live Supabase

---

## 🚀 Later: growth
- [ ] Order-ready push/SMS notification to the customer
- [ ] Tipping at checkout
- [ ] Table-status view for staff (which tables are active)
- [ ] Basic sales reporting (revenue by day, top items, peak hours)
- [ ] Multi-staff logins per pub
- [ ] Allergen / dietary tags on menu items

---

## Technical stack

**Current**
- Next.js 16 (App Router), React 19, TypeScript
- Supabase (Postgres + Auth + Realtime)
- Stripe Connect
- Tailwind CSS 4 + Radix UI
- Zustand (local UI state)
- Vitest + Playwright, Husky, GitHub Actions
- Vercel hosting

---

*Last updated: 2026-07-02*
