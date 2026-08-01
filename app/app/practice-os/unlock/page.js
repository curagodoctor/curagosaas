'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = RAZORPAY_SRC;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// The Practice OS checkout screen. Reached from the workspace "Unlock" card and
// as the redirect target when a doctor without access hits the programme.
export default function UnlockPracticeOs() {
  const router = useRouter();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/practice-os/purchase/order');
      if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
      const data = await res.json();
      if (data.alreadyOwned) { router.replace('/app/practice-os'); return; }
      setInfo(data);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function handlePay() {
    setError('');
    setPaying(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) { setError('Could not reach the payment provider. Check your connection and try again.'); setPaying(false); return; }

      const orderRes = await fetch('/api/practice-os/purchase/order', { method: 'POST' });
      const orderData = await orderRes.json();
      if (orderData.alreadyOwned) { router.replace('/app/practice-os'); return; }
      if (!orderData.success) { setError(orderData.error || 'Could not start payment.'); setPaying(false); return; }

      const rzp = new window.Razorpay({
        key: orderData.key,
        order_id: orderData.order.id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'CuraGo Practice OS',
        description: '30-day guided programme',
        prefill: orderData.prefill,
        theme: { color: '#096B17' },
        handler: async (response) => {
          const verifyRes = await fetch('/api/practice-os/purchase/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            router.replace('/app/practice-os/setup');
          } else {
            setError(verifyData.error || 'We could not confirm your payment. If you were charged, contact support.');
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.on('payment.failed', (resp) => {
        setError(resp?.error?.description || 'Payment failed. Please try again.');
        setPaying(false);
      });
      rzp.open();
    } catch (e) {
      console.error('[Practice OS unlock]', e);
      setError('Something went wrong starting the payment.');
      setPaying(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;
  }
  if (!info) return null;

  const price = info.amountInr;

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <Link href="/app" className="flex items-center gap-2 mb-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/Logo.svg" alt="CuraGo" className="h-7 sm:h-8 w-auto" />
      </Link>

      <p className="pos-label mb-2">Practice OS</p>
      <h1 className="text-[30px] font-semibold text-[var(--ink)] leading-tight" style={{ letterSpacing: '-0.027em', maxWidth: '18ch' }}>
        A 30-day programme that builds your practice.
      </h1>
      <p className="text-[16.5px] text-[var(--muted)] mt-4 leading-relaxed" style={{ maxWidth: '52ch' }}>
        One guided mission a day, done inside CuraGo. You finish with a Google Business Profile, a website, real reviews, and the systems that make patients find you — not a certificate.
      </p>

      <div className="pos-card p-7 mt-8">
        <div className="flex items-baseline gap-2">
          <span className="pos-num text-4xl text-[var(--ink)]">₹{price.toLocaleString('en-IN')}</span>
          <span className="text-sm text-[var(--muted)]">one-time · lifetime access to your work</span>
        </div>

        {!info.configured && (
          <p className="text-sm text-[var(--orange)] mt-4">Payments are not configured yet. Set the Razorpay keys to enable checkout.</p>
        )}
        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

        <button
          onClick={handlePay}
          disabled={paying || !info.configured}
          className="pos-action pos-focusable inline-flex items-center gap-2 mt-6 disabled:opacity-50"
        >
          {paying ? 'Opening checkout…' : `Unlock Practice OS — ₹${price.toLocaleString('en-IN')}`}
        </button>
        <p className="text-xs text-[var(--muted)] mt-3">Secure payment via Razorpay. You&apos;ll set up Day 1 right after.</p>

        {info.devBypass && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--rule)' }}>
            <button
              onClick={async () => {
                setError(''); setPaying(true);
                try {
                  const res = await fetch('/api/practice-os/purchase/dev-grant', { method: 'POST' });
                  const data = await res.json();
                  if (data.success) { router.replace('/app/practice-os/setup'); return; }
                  setError(data.error || 'Dev grant failed'); setPaying(false);
                } catch { setError('Dev grant failed'); setPaying(false); }
              }}
              disabled={paying}
              className="text-sm font-medium text-[var(--muted)] underline underline-offset-4 hover:text-[var(--ink)] disabled:opacity-50"
            >
              Dev: skip payment &amp; unlock →
            </button>
            <p className="text-[11px] text-[var(--muted)] mt-1">Local development only — never available in production.</p>
          </div>
        )}
      </div>

      <Link href="/app" className="pos-link text-sm inline-block mt-6">← Back to your workspace</Link>
    </div>
  );
}
