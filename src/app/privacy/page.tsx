import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — BarTab',
  description: 'How BarTab handles data for pubs and their guests.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-xl text-[#2D3A4B] mb-3">{title}</h2>
      <div className="text-[15px] leading-[1.75] text-[#4A4F52] space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="site-theme min-h-screen bg-[#F9F7F5] text-[#1A1D1E] antialiased">
      <header className="border-b border-[#E5E7EB]">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-xl text-[#2D3A4B]">BarTab</Link>
          <Link href="/" className="text-sm text-[#5D7A7D] hover:text-[#2D3A4B]">← Back</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="font-display text-3xl text-[#2D3A4B] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#A8B5B1] mb-10">Last updated: 4 July 2026</p>

        <Section title="Who we are">
          <p>
            BarTab provides QR-code ordering for pubs. This policy explains what data we handle
            for two groups: <strong>guests</strong> who order through a pub&rsquo;s QR code, and{' '}
            <strong>pub owners</strong> who run their venue through the BarTab dashboard. For a
            guest&rsquo;s order, the pub is the data controller and BarTab acts as its processor;
            for owner accounts, BarTab is the controller.
          </p>
        </Section>

        <Section title="If you're a guest ordering at a table">
          <p>We designed guest ordering to need as little of your data as possible:</p>
          <p>
            <strong>No account, no name, no phone number.</strong> Ordering is anonymous. We
            assign your browser a random session identifier so the bar can match your order to
            your table and you can see its status.
          </p>
          <p>
            <strong>Payments.</strong> Card details are entered directly with{' '}
            <a className="underline" href="https://stripe.com/privacy" rel="noopener noreferrer" target="_blank">Stripe</a>,
            our payment provider — they never touch BarTab&rsquo;s servers. If you choose to enter
            an email address for a receipt, it is passed to Stripe solely to send that receipt.
          </p>
          <p>
            <strong>Age-restricted items.</strong> If your order contains an 18+ item you must
            confirm your age; staff may check ID at the table. We store only the outcome
            (verified / refused) and a timestamp on the order — never your date of birth,
            identity, or any image of your ID.
          </p>
          <p>
            <strong>Cookies.</strong> We use two strictly-necessary cookies: a short-lived signed
            check-in cookie proving you scanned the table&rsquo;s QR code, and a session cookie
            that links your browser to your order. Both expire within hours. We use no advertising
            or cross-site tracking cookies.
          </p>
        </Section>

        <Section title="If you're a pub owner">
          <p>
            We store your email address, your pub&rsquo;s profile (name, address, menu, tables)
            and your authentication credentials (managed by Supabase). Payouts are handled by
            Stripe Connect; Stripe collects the business and identity information it needs for
            its own compliance — see Stripe&rsquo;s privacy policy.
          </p>
        </Section>

        <Section title="Where data lives and how long">
          <p>
            Data is stored with Supabase (Postgres, hosted in the EU) and Stripe. Order records
            are kept for the pub&rsquo;s bookkeeping. Rate-limiting entries and check-in records
            are routinely purged. You can ask the pub, or us, to delete order data linked to your
            session.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Under the GDPR you can request access, correction, deletion, or restriction of your
            personal data, and complain to the Irish Data Protection Commission
            (dataprotection.ie). Contact us at{' '}
            <a className="underline" href="mailto:privacy@bartab.ie">privacy@bartab.ie</a> and
            we&rsquo;ll respond within 30 days.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            If this policy changes materially we&rsquo;ll update the date above and, for pub
            owners, notify you by email.
          </p>
        </Section>
      </main>
    </div>
  );
}
