import Link from 'next/link';
import { QrCode, BookOpen, Bell, Check, ArrowRight, CreditCard, ShieldCheck, Timer } from 'lucide-react';

// Marketing "gateway" — calm, editorial, light. Uses the scoped `.site-theme`
// palette (slate / muted teal / warm off-white) defined in globals.css so it
// never collides with the dark customer app or bar dashboard.
//
// Honesty rule: no invented customers, no fabricated quotes, no "verified"
// claims. BarTab is pre-launch — the page says so, and sells the pilot.

const STEPS = [
  {
    icon: QrCode,
    title: 'Set up tables',
    body: 'Add your tables and print a unique code for each. A quiet, one-time setup that takes about ten minutes.',
  },
  {
    icon: BookOpen,
    title: 'Guests order',
    body: 'They browse the menu on their own phone and order in their own time. No app to download, no account to create.',
  },
  {
    icon: Bell,
    title: 'Prepare & serve',
    body: 'Orders arrive on your dashboard, already paid, ready to pour.',
  },
];

const PROMISES = [
  {
    icon: CreditCard,
    title: 'Your money, directly',
    body: 'Card payments settle straight into your own Stripe account. BarTab never holds your funds.',
  },
  {
    icon: ShieldCheck,
    title: 'Paid before it reaches the bar',
    body: 'An order only exists once the card payment has cleared. No unpaid tabs, no walked orders, no end-of-night disputes.',
  },
  {
    icon: Timer,
    title: 'Nothing new to learn',
    body: 'Staff see a simple live board: new, preparing, ready. Guests see a menu. That is the whole system.',
  },
];

export default function HomePage() {
  return (
    <div className="site-theme min-h-screen bg-[#F9F7F5] text-[#1A1D1E] antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F9F7F5]/85 backdrop-blur border-b border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-xl text-[#2D3A4B]">
            BarTab
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link
              href="/order/the-local/table1"
              className="hidden sm:inline text-[#5D7A7D] hover:text-[#2D3A4B] transition-colors"
            >
              Try the demo
            </Link>
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
          <h1 className="font-display text-4xl md:text-5xl leading-[1.2] text-[#2D3A4B] mb-5">
            A calmer way to serve every table
          </h1>
          <p className="text-lg leading-[1.65] text-[#4A4F52] max-w-xl mx-auto mb-9">
            Guests scan the code at their table, browse your menu at their own pace, and order
            without waiting. You keep pouring.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/order/the-local/table1"
              className="bg-[#2D3A4B] text-white font-medium px-6 py-3 rounded-lg hover:bg-[#1F2A38] transition-colors"
            >
              Try the live demo
            </Link>
            <Link
              href="/signup"
              className="border border-[#C9CFD2] text-[#2D3A4B] font-medium px-6 py-3 rounded-lg hover:bg-white transition-colors"
            >
              Set up your pub
            </Link>
          </div>
          <p className="text-[13px] text-[#A8B5B1] mt-5">
            The demo is the real customer experience — menu, cart and checkout, no card charged.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5">
          {STEPS.map((step) => (
            <div
              key={step.title}
              className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-7"
            >
              <step.icon className="w-6 h-6 text-[#2D3A4B]" strokeWidth={1.5} />
              <h3 className="font-display text-lg text-[#2D3A4B] mt-4 mb-2">{step.title}</h3>
              <p className="text-sm leading-[1.7] text-[#5B6063]">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What we promise — replaces invented testimonials with claims we can stand over */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl text-[#2D3A4B] text-center mb-3">
            Built to be trusted, not just used
          </h2>
          <p className="text-[15px] text-[#5B6063] text-center max-w-xl mx-auto mb-10">
            BarTab is new — we won&rsquo;t show you invented reviews. Here is what the system
            actually guarantees, by design.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {PROMISES.map((p) => (
              <div
                key={p.title}
                className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-6"
              >
                <p.icon className="w-6 h-6 text-[#5D7A7D]" strokeWidth={1.5} />
                <h3 className="font-display text-lg text-[#2D3A4B] mt-4 mb-2">{p.title}</h3>
                <p className="text-sm leading-[1.7] text-[#5B6063]">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 pb-20" id="pricing">
        <div className="max-w-2xl mx-auto text-center bg-white border border-[#E5E7EB] rounded-2xl shadow-sm px-8 py-12">
          <p className="text-xs uppercase tracking-[0.16em] text-[#5D7A7D] mb-4">Pricing</p>
          <h2 className="font-display text-2xl text-[#2D3A4B] mb-4">
            Free for pilot pubs. No commission.
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#5B6063] max-w-md mx-auto mb-6">
            BarTab takes <strong className="text-[#2D3A4B]">0% of your orders</strong>. You pay
            only Stripe&rsquo;s standard card-processing fee, and the money settles directly into
            your own account. Early pubs get BarTab free while we build the product around them.
          </p>
          <ul className="text-sm text-[#4A4F52] space-y-2 max-w-xs mx-auto text-left mb-8">
            {[
              'No platform commission on orders',
              'No hardware to buy — print your own QR codes',
              'No contract; leave whenever you like',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#5D7A7D]/12 text-[#5D7A7D] shrink-0 mt-0.5">
                  <Check className="w-3 h-3" strokeWidth={2} />
                </span>
                {line}
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-[#2D3A4B] text-white font-medium px-6 py-3 rounded-lg hover:bg-[#1F2A38] transition-colors"
          >
            Join the pilot
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </Link>
        </div>
      </section>

      {/* Closing */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl text-[#2D3A4B] mb-4">Ready when you are</h2>
          <p className="text-[15px] leading-[1.65] text-[#5B6063] max-w-md mx-auto mb-7">
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
      <footer className="border-t border-[#E5E7EB] px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-[#2D3A4B]">BarTab</span>
          <div className="flex items-center gap-5 text-[13px] text-[#5B6063]">
            <Link href="/privacy" className="hover:text-[#2D3A4B] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#2D3A4B] transition-colors">
              Terms
            </Link>
            <p className="text-[#A8B5B1]">© {new Date().getFullYear()} BarTab</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
