# ChairTime - Feature Roadmap

## Core Philosophy
**Keep it simple. Book, organise, notify.**
Target: Small salons/barbers who want easy, not enterprise complexity.

---

## ✅ MVP (Current)
- [x] Service management
- [x] Online booking page
- [x] Calendar view
- [x] Client database
- [x] Booking management (confirm/cancel/complete)
- [x] Real-time notifications (polling)
- [x] Dashboard stats

---

## 🎯 Phase 1: Production Ready
*Required for real-world use*

### Authentication & Database
- [ ] Clerk authentication (salon owner login)
- [ ] Supabase database (persistent data)
- [ ] Multi-tenancy (each salon = separate account)
- [ ] Unique booking URLs (/book/marys-salon)

### Notifications
- [ ] Email confirmations (Resend)
- [ ] Email reminders (24h before)
- [ ] Browser push notifications

---

## 🚀 Phase 2: Growth Features

### WhatsApp Integration
- [ ] Booking confirmations via WhatsApp
- [ ] Appointment reminders via WhatsApp
- [ ] Rebooking prompts ("Time for your next cut?")
- [ ] WhatsApp booking link in messages

### Loyalty & Retention
- [ ] Digital loyalty program (X visits = Y% off)
- [ ] Referral system (unique codes, track referrals)
- [ ] Birthday discounts (auto-send)
- [ ] "We miss you" campaigns (60+ days since visit)

### Revenue Features
- [ ] Tipping (at checkout + post-visit link)
- [ ] No-show protection (card on file)
- [ ] Deposits for high-value services
- [ ] Package deals (buy 5, get 1 free)
- [ ] Gift cards (digital)

---

## 💎 Phase 3: Premium Features

### Communications
- [ ] SMS notifications (Twilio)
- [ ] Pre-care emails (per service type)
- [ ] Post-care emails (aftercare tips)
- [ ] Review request automation
- [ ] Custom email templates

### Online Store
- [ ] Product catalog
- [ ] Shopping cart
- [ ] Stripe checkout
- [ ] Inventory management
- [ ] Click & collect

### Business Intelligence
- [ ] Revenue reports
- [ ] Staff performance tracking
- [ ] Peak hours analysis
- [ ] Client lifetime value
- [ ] Cancellation analytics
- [ ] No-show tracking

### Advanced Scheduling
- [ ] Multi-staff support
- [ ] Staff availability/holidays
- [ ] Recurring appointments
- [ ] Waitlist when fully booked
- [ ] Smart time suggestions

---

## 🌟 Differentiators (Ideas)

### WhatsApp-First (Irish Market)
- Book via WhatsApp chat
- Automated responses
- Send booking link via WhatsApp
- WhatsApp reminder preference

### Instagram Integration
- "Book Now" button setup guide
- Instagram bio link generator
- Share availability to Stories
- Post-visit photo requests

### Zero Friction
- 5-minute setup
- Pre-filled service templates (haircuts, colours, etc.)
- QR code for booking page
- One-tap rebooking for clients

### Irish-Specific
- Irish payment methods
- GDPR compliant
- Irish support hours
- Local hosting (EU)

---

## 💰 Pricing Tiers (Proposed)

### Free Trial
- 14 days full access
- No card required

### Starter - €29/month
- Unlimited bookings
- Client database
- Email notifications
- Calendar & dashboard
- 1 staff member

### Growth - €59/month
- Everything in Starter
- WhatsApp notifications
- Loyalty program
- Referrals
- Tips
- Up to 3 staff

### Pro - €99/month
- Everything in Growth
- Online store
- SMS notifications
- Advanced analytics
- Multi-location
- Unlimited staff
- Priority support

---

## Technical Stack

### Current
- Next.js 16
- Zustand (local state)
- Tailwind CSS
- Vercel hosting

### Planned
- Clerk (auth)
- Supabase (database)
- Resend (email)
- Twilio (SMS/WhatsApp)
- Stripe (payments)

---

## Competitor Analysis

| Feature | ChairTime | Fresha | Booksy | Vagaro |
|---------|-----------|--------|--------|--------|
| Free tier | ✅ | ✅ | ❌ | ❌ |
| WhatsApp | 🎯 | ❌ | ❌ | ❌ |
| Simple UX | 🎯 | ⚠️ | ⚠️ | ❌ |
| Irish focus | 🎯 | ❌ | ❌ | ❌ |
| Online store | 🔜 | ✅ | ✅ | ✅ |

**Our edge:** WhatsApp-first + Dead simple + Irish market focus

---

*Last updated: 2026-01-30*
