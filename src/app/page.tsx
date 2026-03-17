import Link from 'next/link';
import { Beer, QrCode, ClipboardList, Smartphone, Zap, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 bg-amber-600 rounded-xl">
              <Beer className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-warm-brown">BarTab</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-warm-brown transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-amber-600 text-white rounded-full text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full text-amber-700 text-sm mb-6">
            <Zap className="w-4 h-4" />
            <span>QR Code Ordering for Pubs</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-warm-brown mb-6 leading-tight">
            Turn Your Tables Into
            <br />
            <span className="text-amber-600">Ordering Stations</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Let customers scan a QR code at their table to browse your menu and order directly. 
            No app download. No waiting for staff. Just fast, easy ordering.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-amber-600 text-white rounded-full font-medium text-lg hover:bg-amber-700 transition-colors inline-flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 border border-warm-brown/20 text-warm-brown rounded-full font-medium text-lg hover:bg-amber-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-warm-brown text-center mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Get up and running in minutes. No complex setup required.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-warm-brown mb-2">
                1. Set Up Tables
              </h3>
              <p className="text-muted-foreground">
                Add your tables and we generate a unique QR code for each one. 
                Print and place them on your tables.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-warm-brown mb-2">
                2. Customers Scan & Order
              </h3>
              <p className="text-muted-foreground">
                Customers scan the QR code with their phone, browse your menu, 
                and place their order instantly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-warm-brown mb-2">
                3. Prepare & Serve
              </h3>
              <p className="text-muted-foreground">
                Orders appear on your dashboard in real-time. Accept, prepare, 
                and mark as ready when done.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-warm-brown text-center mb-4">
            Built for Busy Pubs
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Less waiting, more orders, happier customers.
          </p>

          {/* Hero features - 2 main benefits */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="p-8 bg-amber-600 text-white rounded-2xl">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-2">Real-Time Orders</h3>
              <p className="text-amber-100">
                Orders appear instantly on your dashboard with sound notifications. Never miss an order, even on the busiest nights.
              </p>
            </div>
            <div className="p-8 bg-amber-600 text-white rounded-2xl">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-2">No App Download</h3>
              <p className="text-amber-100">
                Customers just scan and order — no app download, no account creation, no friction. Works on any phone.
              </p>
            </div>
          </div>

          {/* Secondary features */}
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { title: 'Table-Specific QR', desc: 'Know exactly which table ordered' },
              { title: 'Easy Menu Updates', desc: 'Change prices in seconds' },
              { title: 'Order Status', desc: 'Customers track their order' },
              { title: 'Works Anywhere', desc: 'Manage from any device' },
            ].map((feature, i) => (
              <div key={i} className="p-4 bg-white rounded-xl border text-center">
                <h3 className="font-semibold text-warm-brown mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="py-20 px-4 bg-amber-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-warm-brown text-center mb-4">
            See It In Action
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Here's what your customers see when they scan your QR code.
          </p>
          
          <div className="flex justify-center">
            <div className="relative">
              {/* Phone mockup */}
              <div className="w-72 bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                <div className="bg-white rounded-[2.5rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="bg-amber-600 text-white px-6 py-3 flex items-center justify-between">
                    <span className="font-semibold">🍺 The Local Pub</span>
                    <span className="text-sm">Table 7</span>
                  </div>
                  {/* Menu items */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-semibold">Guinness</p>
                        <p className="text-sm text-gray-500">568ml Pint</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">€5.80</span>
                        <button className="w-8 h-8 bg-amber-600 text-white rounded-full text-lg">+</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-semibold">Heineken</p>
                        <p className="text-sm text-gray-500">568ml Pint</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">€5.50</span>
                        <button className="w-8 h-8 bg-amber-600 text-white rounded-full text-lg">+</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-semibold">Tayto Crisps</p>
                        <p className="text-sm text-gray-500">Cheese & Onion</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">€1.50</span>
                        <button className="w-8 h-8 bg-amber-600 text-white rounded-full text-lg">+</button>
                      </div>
                    </div>
                  </div>
                  {/* Cart footer */}
                  <div className="p-4 border-t">
                    <button className="w-full py-3 bg-amber-600 text-white rounded-xl font-semibold">
                      View Cart (2 items) — €11.30
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-warm-brown text-center mb-12">
            Trusted by Pubs Across Ireland
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-amber-50 rounded-2xl">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-amber-500">★</span>
                ))}
              </div>
              <p className="text-muted-foreground mb-4 italic">
                "Busy Friday nights used to be chaos. Now customers order from their phones and we just focus on pouring. Orders up 20% since we started."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center font-semibold text-amber-700">PK</div>
                <div>
                  <p className="font-semibold text-warm-brown">Paddy Kelly</p>
                  <p className="text-sm text-muted-foreground">The Local, Dublin</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-amber-50 rounded-2xl">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-amber-500">★</span>
                ))}
              </div>
              <p className="text-muted-foreground mb-4 italic">
                "Setup took 10 minutes. Printed the QR codes, stuck them on the tables, done. Customers figured it out immediately."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center font-semibold text-amber-700">MO</div>
                <div>
                  <p className="font-semibold text-warm-brown">Mary O'Brien</p>
                  <p className="text-sm text-muted-foreground">Sláinte Bar, Cork</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-amber-50 rounded-2xl">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-amber-500">★</span>
                ))}
              </div>
              <p className="text-muted-foreground mb-4 italic">
                "My staff love it. Less running around taking orders means they can actually chat with regulars. The atmosphere is better."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center font-semibold text-amber-700">SO</div>
                <div>
                  <p className="font-semibold text-warm-brown">Seamus O'Connell</p>
                  <p className="text-sm text-muted-foreground">The Thatch, Galway</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center bg-amber-600 rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Speed Up Your Service?
          </h2>
          <p className="text-amber-100 mb-8">
            Join pubs using BarTab to reduce wait times and increase orders.
          </p>
          <Link
            href="/signup"
            className="px-8 py-4 bg-white text-amber-600 rounded-full font-medium text-lg hover:bg-amber-50 transition-colors inline-flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-600 rounded-lg">
              <Beer className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-warm-brown">BarTab</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} BarTab. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
