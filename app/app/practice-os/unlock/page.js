'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

// The per-pack checkout screen. Reached from a pack card in the catalog.
function UnlockPack() {
  const router = useRouter();
  const params = useSearchParams();
  const packId = params.get('pack');
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const done = useCallback(() => router.replace(`/app/practice-os/track?pack=${packId}`), [router, packId]);

  const load = useCallback(async () => {
    if (!packId) { router.replace('/app/practice-os'); return; }
    try {
      const res = await fetch(`/api/practice-os/purchase/order?pack=${packId}`);
      if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
      const data = await res.json();
      if (!data.success) { router.replace('/app/practice-os'); return; }
      if (data.alreadyOwned) { done(); return; }
      setInfo(data);
    } finally {
      setLoading(false);
    }
  }, [router, packId, done]);

  useEffect(() => { load(); }, [load]);

  async function handlePay() {
    setError('');
    setPaying(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) { setError('Could not reach the payment provider. Check your connection and try again.'); setPaying(false); return; }

      const orderRes = await fetch('/api/practice-os/purchase/order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      });
      const orderData = await orderRes.json();
      if (orderData.alreadyOwned) { done(); return; }
      if (!orderData.success) { setError(orderData.error || 'Could not start payment.'); setPaying(false); return; }

      const rzp = new window.Razorpay({
        key: orderData.key,
        order_id: orderData.order.id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'CuraGo Practice OS',
        description: info?.pack?.title || 'Builder pack',
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
              packId,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            done();
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
  const pricing = info.pricing || { base: price, gst: 0, total: price, gstPercent: 0 };
  const rupee = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const title = info.pack?.title || 'This pack';

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <Link href="/app/practice-os" className="flex items-center gap-2 mb-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/Logo.svg" alt="CuraGo" className="h-7 sm:h-8 w-auto" />
      </Link>

      <p className="pos-label mb-2">Builder pack</p>
      <h1 className="text-[30px] font-semibold text-[var(--ink)] leading-tight" style={{ letterSpacing: '-0.027em', maxWidth: '20ch' }}>
        {title}
      </h1>
      <p className="text-[16.5px] text-[var(--muted)] mt-4 leading-relaxed" style={{ maxWidth: '52ch' }}>
        A guided programme done inside CuraGo — one mission at a time. You finish with real assets patients can find, not a certificate. Your work stays yours.
      </p>

      <div className="pos-card p-7 mt-8">
        {/* Price breakdown — base + GST = total */}
        <div className="space-y-2 pb-4 mb-4 border-b" style={{ borderColor: 'var(--rule-soft)' }}>
          <div className="flex items-center justify-between text-[14.5px]">
            <span className="text-[var(--muted)]">Pack price</span>
            <span className="pos-num text-[var(--ink)]">{rupee(pricing.base)}</span>
          </div>
          <div className="flex items-center justify-between text-[14.5px]">
            <span className="text-[var(--muted)]">GST ({pricing.gstPercent}%)</span>
            <span className="pos-num text-[var(--ink)]">{rupee(pricing.gst)}</span>
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-[var(--muted)]">Total · one-time</span>
          <span className="pos-num text-4xl text-[var(--ink)]">{rupee(pricing.total)}</span>
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
          {paying ? 'Opening checkout…' : `Pay ${rupee(pricing.total)}`}
        </button>
        <p className="text-xs text-[var(--muted)] mt-3">Secure payment via Razorpay. GST invoice emailed to you. You&apos;ll set up your first mission right after.</p>

        {info.devBypass && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--rule)' }}>
            <button
              onClick={async () => {
                setError(''); setPaying(true);
                try {
                  const res = await fetch('/api/practice-os/purchase/dev-grant', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ packId }),
                  });
                  const data = await res.json();
                  if (data.success) { done(); return; }
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

      <Link href="/app/practice-os" className="pos-link text-sm inline-block mt-6">← Back to all packs</Link>
    </div>
  );
}

export default function UnlockPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>}>
      <UnlockPack />
    </Suspense>
  );
}
