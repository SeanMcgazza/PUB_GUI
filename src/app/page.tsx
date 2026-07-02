import Link from 'next/link';
import { QrCode, BookOpen, Bell, Check, ArrowRight } from 'lucide-react';

// Marketing "gateway" — calm, editorial, light. Uses the scoped `.site-theme`
// palette (slate / muted teal / warm off-white) defined in globals.css so it
// never collides with the dark customer app or bar dashboard. Deliberately
// de-commercialised: no urgency, no cart/add metaphors, no "18+" tags.

const STEPS = [
  {
    icon: QrCode,
    title: 'Set up tables',
    body: 'Add your tables and print a unique code for each. A quiet, one-time setup.',
  },
  {
    icon: BookOpen,
    title: 'Guests order',
    body: 'They browse the menu on their own phone and order in their own time.',
  },
  {
    icon: Bell,
    title: 'Prepare & serve',
    body: 'Orders arrive on your dashboard, already paid, ready to pour.',
  },
];

const TESTIMONIALS = [
  {
    initials: 'PK',
    quote:
      'Busy nights used to be chaos. Now guests order from their phones and we focus on pouring.',
    name: 'Paddy Kelly',
    place: 'The Local, Dublin',
  },
  {
    initials: 'MO',
    quote:
      'Setup took ten minutes. We placed the codes on the tables and guests understood it straight away.',
    name: "Mary O'Brien",
    place: 'Sláinte Bar, Cork',
  },
  {
    initials: 'SO',
    quote:
      'My staff have time to talk to the regulars again. The room feels calmer, not busier.',
    name: "Seamus O'Connell",
    place: 'The Thatch, Galway',
  },
];

function Seal({ label = 'Verified' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px] text-[#5D7A7D]">
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#5D7A7D]/15 ring-1 ring-[#5D7A7D]/30">
        <Check className="w-3 h-3" strokeWidth={1.5} />
      </span>
      {label}
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="site-theme min-h-screen bg-[#F9F7F5] text-[#1A1D1E] antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F9F7F5]/85 backdrop-blur border-b border-[#D1D5DB]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-xl text-[#2D3A4B]">
            BarTab
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/login" className="text-[#2D3A4B] hover:text-[#1F2A38] transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-[#2D3A4B] text-white font-medium px-4 py-2 rounded-lg hover:bg-[#1F2A38] transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-24 pb-16">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-[#5D7A7D] mb-5">
            Table ordering for pubs
          </p>
          <h1 className="font-display font-semibold tracking-tight text-4xl md:text-5xl leading-[1.15] text-[#2D3A4B] mb-5">
            A calmer way to serve every table
          </h1>
          <p className="text-lg leading-[1.65] text-[#11181C] max-w-xl mx-auto mb-9">
            Guests scan the code at their table, browse your menu at their own pace, and order
            without waiting. You keep pouring.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="bg-[#2D3A4B] text-white font-medium px-6 py-3 rounded-lg hover:bg-[#1F2A38] transition-colors"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="border border-[#2D3A4B] text-[#2D3A4B] font-medium px-6 py-3 rounded-lg hover:bg-[#2D3A4B]/[0.05] transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Trust line */}
      <div className="flex items-center justify-center gap-3 px-6 pb-16">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#5D7A7D]/15 ring-1 ring-[#5D7A7D]/30 text-[#5D7A7D]">
          <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
        </span>
        <span className="text-sm tracking-[0.06em] text-[#5D7A7D]">
          Trusted by verified pubs across Ireland
        </span>
      </div>

      {/* How it works */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5">
          {STEPS.map((step) => (
            <div
              key={step.title}
              className="bg-white border border-[#D1D5DB] rounded-xl shadow-sm p-7"
            >
              <step.icon className="w-6 h-6 text-[#2D3A4B]" strokeWidth={1.5} />
              <h3 className="font-display font-medium text-lg text-[#2D3A4B] mt-4 mb-2">{step.title}</h3>
              <p className="text-sm leading-[1.7] text-[#2E353A]">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials — calm cards with a quality seal */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-medium text-2xl text-[#2D3A4B] text-center mb-10">
            Trusted by pubs across Ireland
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white border border-[#D1D5DB] rounded-xl shadow-sm p-6 flex flex-col"
              >
                <Seal />
                <p className="text-[15px] leading-[1.7] text-[#2E353A] mt-4 mb-5 flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EEF1F0] flex items-center justify-center font-display text-[#2D3A4B]">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-display font-medium text-[#2D3A4B] leading-tight">{t.name}</p>
                    <p className="text-[13px] text-[#A8B5B1]">{t.place}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto text-center bg-white border border-[#D1D5DB] rounded-2xl shadow-sm px-8 py-14">
          <h2 className="font-display font-medium text-2xl text-[#2D3A4B] mb-4">Ready when you are</h2>
          <p className="text-[15px] leading-[1.65] text-[#11181C] max-w-md mx-auto mb-7">
            A quiet, considered way to take orders. No app for your guests to download, and nothing
            new for your staff to learn.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-[#2D3A4B] text-white font-medium px-6 py-3 rounded-lg hover:bg-[#1F2A38] transition-colors"
          >
            Get started
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D1D5DB] px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-display text-[#2D3A4B]">BarTab</span>
          <p className="text-[13px] text-[#A8B5B1]">
            © {new Date().getFullYear()} BarTab. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
