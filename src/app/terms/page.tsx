import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — BarTab',
  description: 'The terms for pubs and guests using BarTab.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-xl text-[#2D3A4B] mb-3">{title}</h2>
      <div className="text-[15px] leading-[1.75] text-[#4A4F52] space-y-3">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="site-theme min-h-screen bg-[#F9F7F5] text-[#1A1D1E] antialiased">
      <header className="border-b border-[#E5E7EB]">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-xl text-[#2D3A4B]">BarTab</Link>
          <Link href="/" className="text-sm text-[#5D7A7D] hover:text-[#2D3A4B]">← Back</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="font-display text-3xl text-[#2D3A4B] mb-2">Terms of Service</h1>
        <p className="text-sm text-[#A8B5B1] mb-10">Last updated: 4 July 2026</p>

        <Section title="What BarTab is">
          <p>
            BarTab is ordering software. When you order through a pub&rsquo;s QR code, your
            purchase contract is with <strong>the pub</strong>, not with BarTab. The pub prepares
            and serves your order, sets its prices, and is responsible for its products —
            including complying with licensing law for alcohol. BarTab provides the menu,
            ordering and payment technology.
          </p>
        </Section>

        <Section title="Payments and refunds">
          <p>
            Payments are processed by Stripe and settle directly to the pub&rsquo;s own Stripe
            account. An order is only created after your payment succeeds.
          </p>
          <p>
            <strong>If the pub cancels your order — including when the bar doesn&rsquo;t accept
            it in time — your payment is automatically refunded in full</strong> to the card you
            paid with. Refunds typically appear within 5–10 business days depending on your bank.
            For any other issue with an order, speak to staff at the venue first; they can cancel
            and refund it.
          </p>
        </Section>

        <Section title="Age-restricted items">
          <p>
            Orders containing alcohol or other 18+ items require you to confirm you are 18 or
            over, and staff may ask for ID before handing them over. If you cannot show valid ID,
            the pub may refuse the restricted items; refusal and any resulting refund are handled
            by the venue.
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>
            Don&rsquo;t misuse the service: no placing orders you don&rsquo;t intend to collect,
            probing or attacking the platform, or interfering with other tables&rsquo; sessions.
            We rate-limit and may block abusive traffic.
          </p>
        </Section>

        <Section title="For pub owners">
          <p>
            You&rsquo;re responsible for the accuracy of your menu and prices, for fulfilling paid
            orders or cancelling them (which refunds the guest automatically), for your
            obligations under licensing and food-safety law, and for your Stripe account standing.
            During the pilot, BarTab is provided free of charge and without commission;
            we&rsquo;ll give at least 30 days&rsquo; notice before any pricing is introduced.
            Either side can stop using the service at any time.
          </p>
        </Section>

        <Section title="Liability">
          <p>
            BarTab is provided &ldquo;as is&rdquo; during the pilot. To the extent permitted by
            law, our liability is limited to the fees you&rsquo;ve paid us (currently zero);
            nothing in these terms limits liability that cannot be limited by law. These terms
            are governed by the laws of Ireland.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions: <a className="underline" href="mailto:hello@bartab.ie">hello@bartab.ie</a>
          </p>
        </Section>
      </main>
    </div>
  );
}
