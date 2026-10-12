'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const GREEN = '#096B17';
const ORANGE = '#F26A1B';
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function loadRazorpay() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function StorePage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [buying, setBuying] = useState(null);     // productId mid-purchase
  const [modal, setModal] = useState(null);        // { product } guest buyer modal
  const [buyer, setBuyer] = useState({ name: '', email: '', phone: '' });
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/public/store/products').then((r) => r.json()).then((d) => { if (d.success) setProducts(d.products || []); }).catch(() => {}).finally(() => setLoading(false));
    fetch('/api/auth/me', { credentials: 'include' }).then((r) => r.json()).then((d) => setLoggedIn(!!(d?.success && d?.doctor))).catch(() => {});
  }, []);

  // ---- Logged-in purchase: order -> Razorpay -> verify -> library ----
  const buyLoggedIn = useCallback(async (product) => {
    setBuying(product.id); setErr('');
    try {
      const res = await fetch('/api/store/purchase/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ productId: product.id }) });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || 'Could not start checkout');
      if (d.alreadyOwned) { router.push('/app/control-center/library'); return; }
      if (d.free) {
        await fetch('/api/store/purchase/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ productId: product.id }) });
        router.push('/app/control-center/library'); return;
      }
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Could not load the payment gateway');
      const rzp = new window.Razorpay({
        key: d.key, order_id: d.order.id, amount: d.order.amount, currency: d.order.currency,
        name: 'CuraGo', description: product.title, prefill: d.prefill,
        handler: async (resp) => {
          await fetch('/api/store/purchase/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ productId: product.id, ...resp }) });
          router.push('/app/control-center/library');
        },
        modal: { ondismiss: () => setBuying(null) },
        theme: { color: GREEN },
      });
      rzp.open();
    } catch (e) { setErr(e.message); setBuying(null); }
  }, [router]);

  // ---- Guest purchase: order -> Razorpay -> claim -> login/signup with token ----
  const afterClaim = (product, { claimToken, email, existingUser }) => {
    const q = `claim=${encodeURIComponent(claimToken)}&email=${encodeURIComponent(email)}&entry=store`;
    router.push(existingUser ? `/login?${q}` : `/signup?${q}`);
  };
  const buyGuest = async (product) => {
    setBuying(product.id); setErr('');
    try {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email)) throw new Error('Enter a valid email');
      const res = await fetch('/api/public/store/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id }) });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || 'Could not start checkout');
      const claimBody = { productId: product.id, email: buyer.email, name: buyer.name, phone: buyer.phone };
      if (d.free) {
        const c = await (await fetch('/api/public/store/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(claimBody) })).json();
        if (!c.success) throw new Error(c.error || 'Could not record your purchase');
        afterClaim(product, c); return;
      }
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Could not load the payment gateway');
      const rzp = new window.Razorpay({
        key: d.keyId, order_id: d.orderId, amount: d.amount, currency: d.currency,
        name: 'CuraGo', description: product.title, prefill: { name: buyer.name, email: buyer.email, contact: buyer.phone },
        handler: async (resp) => {
          const c = await (await fetch('/api/public/store/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...claimBody, razorpay_order_id: resp.razorpay_order_id, razorpay_payment_id: resp.razorpay_payment_id, razorpay_signature: resp.razorpay_signature }) })).json();
          if (!c.success) { setErr(c.error || 'Payment recorded but linking failed — contact support.'); setBuying(null); return; }
          afterClaim(product, c);
        },
        modal: { ondismiss: () => setBuying(null) },
        theme: { color: GREEN },
      });
      rzp.open();
    } catch (e) { setErr(e.message); setBuying(null); }
  };

  const onBuy = (product) => {
    setErr('');
    if (loggedIn) buyLoggedIn(product);
    else { setBuyer({ name: '', email: '', phone: '' }); setModal({ product }); }
  };

  return (
    <main style={{ background: '#F7F9F5', minHeight: '100vh', fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '56px 20px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <p style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: GREEN, fontWeight: 700 }}>CuraGo Store</p>
          <h1 style={{ fontSize: 'clamp(30px,4vw,46px)', fontWeight: 600, color: '#101A13', letterSpacing: '-0.025em', margin: '8px 0 10px' }}>Books &amp; courses for your practice</h1>
          <p style={{ fontSize: 16.5, color: '#5E6B5F', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>Buy once, read and watch securely from your CuraGo account — your library, always yours.</p>
          {loggedIn && <Link href="/app/control-center/library" style={{ display: 'inline-block', marginTop: 14, color: GREEN, fontWeight: 600, fontSize: 14 }}>Go to my library →</Link>}
        </div>

        {err && <div style={{ maxWidth: 520, margin: '0 auto 24px', background: 'rgba(242,106,27,.08)', border: '1px solid rgba(242,106,27,.3)', color: '#101A13', padding: 12, borderRadius: 10, fontSize: 14 }}>{err}</div>}

        {loading ? (
          <p style={{ textAlign: 'center', color: '#5E6B5F' }}>Loading the store…</p>
        ) : products.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#5E6B5F' }}>No products are available yet. Check back soon.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 22 }}>
            {products.map((p) => (
              <div key={p.id} style={{ background: '#fff', border: '1px solid #DDE4D9', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ aspectRatio: '16/10', background: '#EDF1EB', position: 'relative' }}>
                  {p.coverUrl ? <img src={p.coverUrl} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#9FB0A0', fontSize: 13 }}>{p.type === 'course' ? 'Video course' : 'Book'}</div>}
                  <span style={{ position: 'absolute', top: 10, left: 10, background: p.type === 'course' ? ORANGE : GREEN, color: '#fff', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 999 }}>{p.type === 'course' ? `Course · ${p.lessonCount} lessons` : 'Book'}</span>
                </div>
                <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: '#101A13' }}>{p.title}</h3>
                  {p.summary && <p style={{ fontSize: 13.5, color: '#5E6B5F', lineHeight: 1.5, flex: 1 }}>{p.summary}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 26, color: '#101A13' }}>{p.isFree ? 'Free' : inr(p.priceInInr)}</span>
                    <button onClick={() => onBuy(p)} disabled={buying === p.id} style={{ background: ORANGE, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: buying === p.id ? 0.6 : 1 }}>
                      {buying === p.id ? 'Processing…' : p.isFree ? 'Get it' : 'Buy'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guest buyer modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,26,19,.5)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 16 }} onClick={() => setModal(null)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 'min(440px, 100%)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 19, fontWeight: 600, color: '#101A13', marginBottom: 4 }}>{modal.product.isFree ? 'Get' : 'Buy'} “{modal.product.title}”</h3>
            <p style={{ fontSize: 13.5, color: '#5E6B5F', marginBottom: 18 }}>Enter your details — after {modal.product.isFree ? 'this' : 'payment'} you’ll create (or sign in to) your account and it’s added to your library.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input placeholder="Full name" value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} style={inputStyle} />
              <input placeholder="Email" type="email" value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} style={inputStyle} />
              <input placeholder="Phone (optional)" value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} style={inputStyle} />
            </div>
            {err && <p style={{ color: '#C0392B', fontSize: 13, marginTop: 10 }}>{err}</p>}
            <button onClick={() => buyGuest(modal.product)} disabled={buying === modal.product.id} style={{ width: '100%', marginTop: 16, background: ORANGE, color: '#fff', border: 'none', padding: '12px', borderRadius: 9, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: buying === modal.product.id ? 0.6 : 1 }}>
              {buying === modal.product.id ? 'Processing…' : modal.product.isFree ? 'Get it' : `Pay ${inr(modal.product.priceInInr)}`}
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#99A399', marginTop: 10 }}>Already have an account? <Link href="/login" style={{ color: GREEN }}>Log in first</Link></p>
          </div>
        </div>
      )}
    </main>
  );
}

const inputStyle = { width: '100%', padding: '11px 12px', border: '1px solid #DDE4D9', borderRadius: 9, fontSize: 14.5, outline: 'none' };
