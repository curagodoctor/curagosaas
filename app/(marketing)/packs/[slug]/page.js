'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PackHeader } from '../page';

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PackDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showBuy, setShowBuy] = useState(false);
  const [buyer, setBuyer] = useState({ name: '', email: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/public/practice-os/packs/${slug}`);
        if (res.status === 404) { setNotFound(true); return; }
        const d = await res.json();
        if (d.success) setPack(d.pack); else setNotFound(true);
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    })();
    // Is the visitor already logged in? (buy in-app, no re-signup)
    (async () => {
      try { const r = await fetch('/api/auth/me', { credentials: 'include' }); setLoggedIn(r.ok); } catch { /* ignore */ }
    })();
  }, [slug]);

  // After a purchase is recorded (claimToken), route the buyer correctly.
  const afterClaim = useCallback(async ({ claimToken, email, existingUser }) => {
    if (loggedIn) {
      // Already logged in → link to this account and open the app.
      try { await fetch('/api/auth/claim-pending', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ claimToken }) }); } catch { /* ignore */ }
      router.push('/app/zero-to-practice-builder');
      return;
    }
    const q = `claim=${encodeURIComponent(claimToken)}&email=${encodeURIComponent(email)}`;
    if (existingUser) router.push(`/login?${q}&entry=practice-os`);
    else router.push(`/signup?${q}&entry=practice-os`);
  }, [loggedIn, router]);

  const doClaim = useCallback(async (payment) => {
    const res = await fetch('/api/public/practice-os/claim', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, email: buyer.email, name: buyer.name, phone: buyer.phone, ...payment }),
    });
    const d = await res.json();
    if (!d.success) throw new Error(d.error || 'Could not record your purchase.');
    return d;
  }, [slug, buyer]);

  const startPurchase = async () => {
    setErr('');
    if (!buyer.name.trim()) return setErr('Please enter your name.');
    if (!EMAIL_RE.test(buyer.email)) return setErr('Please enter a valid email.');
    setBusy(true);
    try {
      const orderRes = await fetch('/api/public/practice-os/order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug }),
      });
      const order = await orderRes.json();
      if (!order.success) throw new Error(order.error || 'Could not start checkout.');

      if (order.free) {
        // Free pack — no payment; record the claim and move on.
        const claimed = await doClaim({});
        await afterClaim(claimed);
        return;
      }

      const ok = await loadRazorpay();
      if (!ok) throw new Error('Could not load the payment window. Please try again.');

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'CuraGo',
        description: pack.title,
        prefill: { name: buyer.name, email: buyer.email, contact: buyer.phone },
        theme: { color: '#096B17' },
        handler: async (resp) => {
          try {
            const claimed = await doClaim({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            await afterClaim(claimed);
          } catch (e) {
            setErr(`${e.message} Your payment id is ${resp.razorpay_payment_id} — keep it for support.`);
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on('payment.failed', () => { setErr('Payment failed. Please try again.'); setBusy(false); });
      rzp.open();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  if (loading) return <Shell><div style={{ padding: 80, textAlign: 'center', color: '#9ca3af' }}>Loading…</div></Shell>;
  if (notFound || !pack) return <Shell><div style={{ padding: 80, textAlign: 'center', color: '#5E6B5F' }}>This pack isn&apos;t available. <Link href="/packs" style={{ color: '#096B17' }}>See all packs →</Link></div></Shell>;

  const priceLabel = pack.price.free ? 'Free' : `₹${pack.price.total.toLocaleString('en-IN')}`;

  return (
    <Shell>
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px clamp(16px,4vw,40px) 90px' }}>
        <Link href="/packs" style={{ color: '#5E6B5F', fontSize: 14, textDecoration: 'none' }}>← All packs</Link>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 28, marginTop: 18 }}>
          <div>
            {pack.category && <p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#096B17', fontWeight: 600, margin: 0 }}>{pack.category}</p>}
            <h1 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '10px 0 6px', lineHeight: 1.15 }}>{pack.title}</h1>
            {pack.tagline && <p style={{ fontSize: 18, color: '#5E6B5F', margin: 0 }}>{pack.tagline}</p>}

            {pack.summary && <p style={{ fontSize: 16.5, color: '#374151', lineHeight: 1.65, marginTop: 20, maxWidth: '60ch' }}>{pack.summary}</p>}

            {pack.outcomes?.length > 0 && (
              <div style={{ marginTop: 26 }}>
                <p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: '#096B17', fontWeight: 600 }}>What you&apos;ll have built</p>
                <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none' }}>
                  {pack.outcomes.map((o, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', fontSize: 15.5, color: '#374151' }}>
                      <span style={{ color: '#096B17', fontWeight: 700 }}>✓</span> {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pack.items?.length > 0 && (
              <div style={{ marginTop: 26 }}>
                <p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: '#096B17', fontWeight: 600 }}>Inside the pack — {pack.items.length} {pack.itemLabel}</p>
                <ol style={{ margin: '10px 0 0', padding: 0, listStyle: 'none' }}>
                  {pack.items.map((it) => (
                    <li key={it.n} style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: '1px solid #EDF1EB', fontSize: 15, color: '#374151' }}>
                      <span style={{ color: '#9ca3af', fontVariantNumeric: 'tabular-nums', minWidth: 22 }}>{it.n}.</span> {it.title}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sticky buy bar */}
      <div style={{ position: 'sticky', bottom: 0, background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(10px)', borderTop: '1px solid #DDE4D9' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '14px clamp(16px,4vw,40px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: 24, fontWeight: 700 }}>{priceLabel}</span>
            {!pack.price.free && <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 8 }}>incl. {pack.price.pct}% GST</span>}
          </div>
          <button onClick={() => { setShowBuy(true); setErr(''); }} style={{ background: '#F26A1B', color: '#fff', fontWeight: 700, fontSize: 16, padding: '13px 30px', borderRadius: 11, border: 'none', cursor: 'pointer' }}>
            {pack.price.free ? 'Get it free' : 'Buy this pack'}
          </button>
        </div>
      </div>

      {/* Buyer modal */}
      {showBuy && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(5,19,10,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => !busy && setShowBuy(false)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, padding: 26 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 4px' }}>{pack.price.free ? 'Get this pack' : 'Buy this pack'}</h2>
            <p style={{ fontSize: 14, color: '#5E6B5F', margin: '0 0 18px' }}>Just your details — you&apos;ll create your account right after {pack.price.free ? '' : 'payment'}.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} placeholder="Your name" style={inp} />
              <input value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} placeholder="Email" type="email" style={inp} />
              <div style={{ display: 'flex' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 12px', background: '#f3f4f6', border: '1px solid #DDE4D9', borderRight: 'none', borderRadius: '9px 0 0 9px', color: '#6b7280' }}>+91</span>
                <input value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value.replace(/\D/g, '').slice(-10) })} placeholder="Phone (optional)" inputMode="numeric" maxLength={10} style={{ ...inp, borderRadius: '0 9px 9px 0', flex: 1 }} />
              </div>
            </div>
            {err && <p style={{ color: '#b4695c', fontSize: 13, marginTop: 12 }}>{err}</p>}
            <button onClick={startPurchase} disabled={busy} style={{ marginTop: 18, width: '100%', background: '#F26A1B', color: '#fff', fontWeight: 700, fontSize: 16, padding: '13px', borderRadius: 11, border: 'none', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Please wait…' : (pack.price.free ? 'Get it free →' : `Pay ${priceLabel} →`)}
            </button>
            <p style={{ fontSize: 11.5, color: '#9ca3af', textAlign: 'center', marginTop: 10 }}>Your purchase is saved before you sign up — you won&apos;t lose it if the page reloads.</p>
          </div>
        </div>
      )}
    </Shell>
  );
}

const inp = { width: '100%', padding: '11px 13px', border: '1px solid #DDE4D9', borderRadius: 9, fontSize: 15, outline: 'none', boxSizing: 'border-box' };

function Shell({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F9F5', color: '#101A13', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif' }}>
      <PackHeader />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );
}
