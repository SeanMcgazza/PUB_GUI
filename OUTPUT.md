# ChairTime - Salon Booking App

## Project Overview
ChairTime is a commission-free booking system designed for independent stylists and small salons in Ireland. Built with Next.js 15, TypeScript, Tailwind CSS, and a warm, feminine design aesthetic.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **State:** Zustand with localStorage persistence
- **Forms:** React Hook Form + Zod
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Date Handling:** date-fns

## Design System

### Colors (Feminine, Warm Palette)
- **Background:** #FFFBF8 (warm cream)
- **Surface:** #FFFFFF
- **Primary (Gold):** #D4A574
- **Secondary (Lavender):** #B8A4C9
- **Text:** #2D2A26 (warm brown)
- **Success (Sage):** #7DB87D
- **Warning (Soft Gold):** #E5C07B
- **Danger (Dusty Rose):** #D98B8B

### Typography
- Font: Outfit (Google Fonts)
- Weights: 300, 400, 500, 600, 700

### Components
- Pill-shaped buttons
- Soft shadows (shadow-soft, shadow-soft-lg)
- 16px minimum text size
- Framer Motion animations throughout

## Features Implemented

### Phase 1: Landing Page ✅
- [x] Responsive Navbar with mobile drawer
- [x] Hero section with animated stats
- [x] Features grid (6 features)
- [x] Comparison table (vs Fresha/Phorest)
- [x] How it works (3 steps)
- [x] Pricing (Free + €29/month Pro)
- [x] Testimonials (3 Irish stylists)
- [x] FAQ accordion
- [x] CTA section
- [x] Footer

### Phase 2: App Foundation ✅
- [x] TypeScript types (Business, Staff, Service, Client, Booking, etc.)
- [x] Mock data (Irish salon with 18 services, 15 clients, 20 bookings)
- [x] Zustand store with CRUD operations and localStorage
- [x] UI Components (StatusBadge, StatCard, EmptyState, TimeSlot, Avatar)
- [x] Card components (ServiceCard, ClientCard, BookingCard)
- [x] AppShell with sidebar (desktop) and bottom nav (mobile)

### Phase 3: Core Features ✅
- [x] **Dashboard:** Time-based greeting, stats cards, upcoming appointments, activity feed
- [x] **Calendar:** Day/Week/Agenda views with colored booking blocks
- [x] **Clients:** Search, filter, detailed profiles with hair formula & allergy warnings
- [x] **Bookings:** List with tabs (Upcoming/Past/Cancelled)
- [x] **New Booking Flow:** 4-step wizard with confetti celebration
- [x] **Services:** Category tabs, add/edit/delete services
- [x] **Settings:** Business info, availability, booking page settings

### Phase 4: Polish ✅
- [x] Page transitions (fade in up)
- [x] Card hover lift effects
- [x] Button feedback animations
- [x] Confetti celebration on booking success
- [x] Public booking page at /book/[businessSlug]

## Project Structure
```
chairtime/
├── src/
│   ├── app/
│   │   ├── (marketing)/     # Landing page
│   │   ├── app/             # Dashboard app
│   │   │   ├── bookings/
│   │   │   ├── calendar/
│   │   │   ├── clients/
│   │   │   ├── services/
│   │   │   └── settings/
│   │   └── book/            # Public booking page
│   ├── components/
│   │   ├── cards/           # BookingCard, ClientCard, ServiceCard
│   │   ├── landing/         # Landing page components
│   │   ├── layout/          # AppShell
│   │   └── ui/              # shadcn + custom components
│   ├── data/
│   │   └── mockData.ts      # Irish salon mock data
│   ├── store/
│   │   └── index.ts         # Zustand store
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   └── lib/
│       └── utils.ts         # Utility functions
└── OUTPUT.md
```

## Running the App

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## Mock Data Highlights
- **Business:** Sarah's Hair Studio, Dublin
- **Services:** 18 services across 4 categories (Hair, Colour, Styling, Treatments)
- **Clients:** 15 Irish clients with realistic details
  - Hair formulas (color codes, processing times)
  - Allergies (PPD sensitive, latex, etc.)
  - Preferences (tea preferences, appointment times)
- **Bookings:** 20+ bookings in various statuses
- **Availability:** Mon-Sat, 9am-6pm (late Thursday until 8pm)

## Key User Flows
1. **Dashboard Overview:** See today's appointments, stats, recent activity
2. **Book Appointment:** 4-step flow (Client → Service → Date/Time → Confirm)
3. **Client Management:** View/edit profiles, hair formulas, visit history
4. **Public Booking:** Clients can self-book at /book/sarahs-hair-studio

## Notes
- All data persisted in localStorage
- Fully responsive (mobile-first design)
- Irish localization (€ prices, Irish names, Dublin addresses)
- Accessibility: semantic HTML, ARIA labels, keyboard navigation
