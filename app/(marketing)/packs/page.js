'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PacksCataloguePage() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/public/practice-os/packs');
        const d = await res.json();
        if (d.success) setPacks(d.packs || []);
        else setError('Could not load packs.');
      } catch { setError('Could not load packs.'); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#F7F9F5', color: '#101A13', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif' }}>
      <PackHeader />

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '40px clamp(16px,4vw,40px) 80px' }}>
        <p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: '#096B17', fontWeight: 600 }}>The Practice Builder</p>
        <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '10px 0 6px' }}>Builder Packs</h1>
        <p style={{ fontSize: 17, color: '#5E6B5F', maxWidth: '56ch', lineHeight: 1.6 }}>
          Guided programmes that take you from invisible to findable online — each one produces real assets, not a certificate. Buy a pack and start building; you can create your account right after.
        </p>

        {loading ? (
          <div style={{ padding: 80, textAlign: 'center', color: '#9ca3af' }}>Loading packs…</div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#b4695c' }}>{error}</div>
        ) : packs.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#5E6B5F' }}>No packs are available yet. Check back soon.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20, marginTop: 32 }}>
            {packs.map((p) => (
              <Link key={p.slug} href={`/packs/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ background: '#fff', border: '1px solid #DDE4D9', borderRadius: 14, padding: 22, height: '100%', display: 'flex', flexDirection: 'column', transition: 'box-shadow .15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 28px rgba(16,26,19,.10)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}>
                  {p.category && <p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: '#096B17', fontWeight: 600, margin: 0 }}>{p.category}</p>}
                  <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', margin: '8px 0 4px', lineHeight: 1.25 }}>{p.title}</h2>
                  {p.tagline && <p style={{ fontSize: 14, color: '#5E6B5F', margin: 0 }}>{p.tagline}</p>}
                  {p.summary && <p style={{ fontSize: 14, color: '#5E6B5F', marginTop: 10, lineHeight: 1.55, flex: 1 }}>{p.summary.slice(0, 120)}{p.summary.length > 120 ? '…' : ''}</p>}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: '1px solid #EDF1EB' }}>
                    <span style={{ fontSize: 13, color: '#5E6B5F' }}>{p.itemCount} {p.itemLabel}</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#101A13' }}>
                      {p.price.free ? 'Free' : `₹${p.price.total.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <span style={{ display: 'inline-block', background: '#F26A1B', color: '#fff', fontWeight: 600, fontSize: 14, padding: '9px 18px', borderRadius: 9 }}>View details →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export function PackHeader() {
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    const apply = () => { setMobile(mq.matches); if (!mq.matches) setOpen(false); };
    apply();
    mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', apply) : mq.removeListener(apply); };
  }, []);

  const links = (
    <>
      <Link href="/packs" onClick={() => setOpen(false)} style={{ color: '#096B17', fontSize: 15, fontWeight: 500, padding: mobile ? '13px 6px' : '11px 12px', textDecoration: 'none', borderBottom: mobile ? '1px solid rgba(0,0,0,.06)' : 'none' }}>Builder Packs</Link>
      <Link href="/login" onClick={() => setOpen(false)} style={{ color: '#096B17', fontSize: 15, fontWeight: 600, padding: mobile ? '13px 6px' : '11px 12px', textDecoration: 'none', borderBottom: mobile ? '1px solid rgba(0,0,0,.06)' : 'none' }}>Login</Link>
      <Link href="/signup" onClick={() => setOpen(false)} style={{ background: '#F26A1B', color: '#fff', fontWeight: 700, fontSize: 15, padding: mobile ? '14px 20px' : '11px 18px', borderRadius: 11, textDecoration: 'none', textAlign: 'center', marginTop: mobile ? 12 : 0 }}>Sign up</Link>
    </>
  );

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 60, background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
      <nav style={{ maxWidth: 1120, margin: '0 auto', padding: '9px clamp(16px,4vw,40px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, position: 'relative' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/curago-logo.png" alt="CuraGo" style={{ height: 38, width: 'auto' }} />
        </Link>

        {!mobile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{links}</div>
        ) : (
          <button onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}
            style={{ width: 44, height: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5, padding: 11, background: 'transparent', border: '1px solid rgba(0,0,0,.12)', borderRadius: 10, cursor: 'pointer' }}>
            <span style={{ display: 'block', height: 2, width: '100%', background: '#096B17', borderRadius: 2, transition: 'transform .25s,opacity .25s', transform: open ? 'translateY(7px) rotate(45deg)' : 'none' }} />
            <span style={{ display: 'block', height: 2, width: '100%', background: '#096B17', borderRadius: 2, transition: 'opacity .25s', opacity: open ? 0 : 1 }} />
            <span style={{ display: 'block', height: 2, width: '100%', background: '#096B17', borderRadius: 2, transition: 'transform .25s,opacity .25s', transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
          </button>
        )}

        {mobile && open && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', borderBottom: '1px solid rgba(0,0,0,.08)', boxShadow: '0 14px 32px rgba(0,0,0,.12)', padding: '8px clamp(16px,4vw,40px) 18px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {links}
          </div>
        )}
      </nav>
    </header>
  );
}
