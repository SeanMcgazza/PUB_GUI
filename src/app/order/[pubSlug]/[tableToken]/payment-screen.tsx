'use client';

import { useEffect, useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { type Appearance } from '@stripe/stripe-js';
import { createClient } from '@/lib/supabase/client';
import { getStripeJs } from '@/lib/stripe/client';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, AlertCircle } from 'lucide-react';
import type { Pub, Table, MenuItem, Order } from '@/types/database';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface Props {
  pub: Pub;
  table: Table;
  cart: CartItem[];
  sessionToken: string;
  orderNotes: string;
  total: number;
  ageAcknowledged: boolean;
  onCancel: () => void;
  onPaid: (order: Order) => void;
}

// Stripe Appearance API — match BarTab's dark theme so the embedded payment
// fields don't look out of place against the bg-atmosphere panel.
const stripeAppearance: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#F59E0B',
    colorBackground: '#1C1F26',
    colorText: '#F5F5F5',
    colorDanger: '#EF4444',
    fontFamily: 'system-ui, sans-serif',
    borderRadius: '12px',
  },
};

/**
 * Two-step component:
 *
 *  1. On mount → POST /api/stripe/payment-intent → get a clientSecret.
 *  2. Render <Elements> + <CheckoutForm> with that clientSecret so the
 *     customer can enter card details and pay.
 *
 * After successful payment, polls Supabase for the order row (which is
 * created by the webhook), and hands it back to the parent via onPaid.
 */
export function PaymentScreen({
  pub,
  table,
  cart,
  sessionToken,
  orderNotes,
  total,
  ageAcknowledged,
  onCancel,
  onPaid,
}: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 1: create the Payment Intent on the server.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pubSlug: pub.slug,
            tableToken: table.qr_token,
            sessionToken,
            items: cart.map((c) => ({
              menuItemId: c.menuItem.id,
              quantity: c.quantity,
            })),
            notes: orderNotes,
            ageAcknowledged,
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.clientSecret) {
          throw new Error(data.error || 'Failed to create payment');
        }
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to start payment');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pub.slug, table.qr_token, sessionToken, cart, orderNotes, ageAcknowledged]);

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/15 text-red-300">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-[color:var(--theme-text-primary)] mb-2">
          Couldn&apos;t start payment
        </p>
        <p className="text-sm text-[color:var(--theme-text-muted)] mb-6">{error}</p>
        <Button onClick={onCancel} variant="outline">
          Back to cart
        </Button>
      </div>
    );
  }

  if (!clientSecret || !paymentIntentId) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[color:var(--theme-primary-glow)]" />
        <p className="text-sm text-[color:var(--theme-text-muted)] mt-4">
          Preparing secure payment…
        </p>
      </div>
    );
  }

  return (
    <Elements
      stripe={getStripeJs()}
      options={{ clientSecret, appearance: stripeAppearance }}
    >
      <CheckoutForm
        total={total}
        paymentIntentId={paymentIntentId}
        pubId={pub.id}
        sessionToken={sessionToken}
        onCancel={onCancel}
        onPaid={onPaid}
      />
    </Elements>
  );
}

function CheckoutForm({
  total,
  paymentIntentId,
  pubId,
  sessionToken,
  onCancel,
  onPaid,
}: {
  total: number;
  paymentIntentId: string;
  pubId: string;
  sessionToken: string;
  onCancel: () => void;
  onPaid: (order: Order) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [waitingForOrder, setWaitingForOrder] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setPayError(null);

    // confirmPayment with redirect: 'if_required' keeps the customer on this
    // page when no 3DS challenge is needed (the common case for test cards).
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        // Used by Stripe only if a redirect IS required (3DS).
        return_url: typeof window !== 'undefined' ? window.location.href : '',
      },
    });

    if (error) {
      setPayError(error.message || 'Payment failed');
      setSubmitting(false);
      return;
    }

    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      setPayError('Payment did not complete');
      setSubmitting(false);
      return;
    }

    // Payment succeeded client-side. The webhook will create the order row
    // in Supabase. Poll for it.
    setWaitingForOrder(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const startedAt = Date.now();
    while (Date.now() - startedAt < 20_000) {
      // Read only THIS session's orders (public SELECT on orders was removed);
      // find the one the webhook created for this payment.
      const { data } = await supabase.rpc('get_order_status', {
        p_session_token: sessionToken,
      });
      const rows = (data || []) as Order[];
      const match = rows.find(
        (o) => o.payment_intent_id === paymentIntentId && o.pub_id === pubId
      );
      if (match) {
        onPaid(match);
        return;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    setPayError(
      'Payment took longer than expected to confirm. Show this screen to the bar staff.'
    );
    setSubmitting(false);
    setWaitingForOrder(false);
  };

  return (
    <form onSubmit={handlePay} className="p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-[color:var(--theme-text-primary)]">
          Pay €{total.toFixed(2)}
        </h2>
        <span className="flex items-center gap-1 text-xs text-[color:var(--theme-text-muted)]">
          <Lock className="w-3 h-3" />
          Secured by Stripe
        </span>
      </div>

      {/* Stripe-hosted, dark-themed payment fields */}
      <PaymentElement />

      {payError && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 p-3 rounded-xl">
          {payError}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full bg-primary-gradient hover:opacity-90 text-white py-6 text-lg font-semibold rounded-2xl glow-primary disabled:opacity-50"
      >
        {submitting ? (
          waitingForOrder ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Confirming payment…
            </>
          ) : (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing…
            </>
          )
        ) : (
          `Pay €${total.toFixed(2)}`
        )}
      </Button>

      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="w-full text-sm text-[color:var(--theme-text-muted)] hover:text-[color:var(--theme-text-primary)] py-2 disabled:opacity-50"
      >
        Back to cart
      </button>
    </form>
  );
}
