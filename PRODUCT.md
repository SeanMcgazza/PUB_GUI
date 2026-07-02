# BarTab — QR Ordering for Pubs

## What it is

BarTab turns every table into a self-service bar. The customer scans a QR code,
sees the pub's live menu, orders, and pays by card in their own phone browser.
The payment goes **straight to the pub's Stripe account**, and the order appears
on the bar's dashboard with a confirmation code the moment it's paid.

No customer app to download. No tab to open and forget. No card left behind the
bar. Just scan, order, pay.

## Who it's for

Pubs, bars, and beer gardens — especially at peak times when the queue at the
bar is the bottleneck on revenue. Best fit:

- Busy venues where customers wait too long to get served
- Table-service or beer-garden setups where staff can't easily reach everyone
- Owners who want card payments to land in their own account with no middleman
  holding the funds

## The problem it solves

> Every minute a thirsty customer spends queuing is a drink they didn't buy.

- Long bar queues cap how much a full room can actually spend.
- Staff spend the rush taking and running orders instead of pouring.
- Paper tabs and cards-behind-the-bar cause disputes and walked tabs.

BarTab lets the room keep ordering while staff keep pouring, and every order is
prepaid before it reaches the bar.

## How it works

**For the customer**
1. Scan the QR on the table.
2. Browse the menu (only what's marked available shows).
3. Add to cart, pay by card.
4. Get a confirmation code to show or call out at the bar.

**For the bar**
1. Orders appear on the `/app` dashboard in real time, already paid.
2. Move each order through pending → preparing → ready → collected.
3. Manage the menu, tables/QRs, and Stripe payouts from the same dashboard.
4. Optionally require staff to **approve a table's check-in** before it can
   order — approval happens before payment, so a declined table is never charged.

## Why prepaid-first matters

The order row is only created after Stripe confirms the payment. That single
design choice removes a whole class of problems: no unpaid orders, no spoofed
orders from someone poking the API, no walked tabs, and no reconciling "who
actually paid" at the end of the night.

## Money

- Card payments use **Stripe Connect destination charges** — funds settle
  directly into the pub's connected Stripe account.
- The platform fee is currently **€0**; the pub receives the full amount minus
  Stripe's standard processing fee.
- Minimum and maximum order values are enforced server-side.

## Status

Working end-to-end in Stripe **test mode** on the live demo. Going live needs
Stripe business verification and a live-key swap — the code is already
live-ready. See [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) and
[`CHANGELOG.md`](CHANGELOG.md) for detail.

---

*"Scan. Order. Pay. Keep the room drinking."*
