'use client';

import { useState } from 'react';
import Link from 'next/link';

const GREEN = '#096B17';
const ORANGE = '#F26A1B';
const input = { width: '100%', padding: '11px 12px', border: '1px solid #DDE4D9', borderRadius: 9, fontSize: 14.5, outline: 'none' };

export default function RankCheckPage() {
  const [form, setForm] = useState({ name: '', specialty: '', city: '', clinicName: '', email: '', phone: '' });
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [report, setReport] = useState(null);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const run = async (e) => {
    e?.preventDefault();
    setErr('');
    if (!form.name || !form.specialty || !form.city) { setErr('Please fill name, specialty and city.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setErr('Please enter a valid email.'); return; }
    setState('loading');
    try {
      const d = await (await fetch('/api/public/rank-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })).json();
      if (d.success) { setReport(d); setState('done'); }
      else { setErr(d.error || 'Something went wrong.'); setState('error'); }
    } catch { setErr('Something went wrong. Please try again.'); setState('error'); }
  };

  return (
    <main style={{ background: '#F7F9F5', minHeight: '100vh', fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 20px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: GREEN, fontWeight: 700 }}>Free Google Maps check</p>
          <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 600, color: '#101A13', letterSpacing: '-0.025em', margin: '8px 0 10px' }}>Where do you rank when patients search?</h1>
          <p style={{ fontSize: 16.5, color: '#5E6B5F', maxWidth: 540, margin: '0 auto', lineHeight: 1.6 }}>Enter your details and we’ll check your Google Maps ranking for 5 searches patients actually use — and show who’s ranking above you.</p>
        </div>

        {state !== 'done' ? (
          <form onSubmit={run} style={{ background: '#fff', border: '1px solid #DDE4D9', borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input style={input} placeholder="Your name *" value={form.name} onChange={(e) => set('name', e.target.value)} />
              <input style={input} placeholder="City *" value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <input style={input} placeholder="Specialty * (e.g. Gastroenterologist)" value={form.specialty} onChange={(e) => set('specialty', e.target.value)} />
            <input style={input} placeholder="Clinic / practice name (helps us find you)" value={form.clinicName} onChange={(e) => set('clinicName', e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input style={input} placeholder="Email *" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              <input style={input} placeholder="Phone (optional)" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            {err && <p style={{ color: '#C0392B', fontSize: 13 }}>{err}</p>}
            <button type="submit" disabled={state === 'loading'} style={{ background: ORANGE, color: '#fff', border: 'none', padding: '13px', borderRadius: 9, fontSize: 15.5, fontWeight: 600, cursor: 'pointer', opacity: state === 'loading' ? 0.7 : 1 }}>
              {state === 'loading' ? 'Checking your ranking…' : 'Check my ranking'}
            </button>
            <p style={{ fontSize: 11.5, color: '#99A399', textAlign: 'center' }}>Live Google Maps data. No ranking or outcome is guaranteed.</p>
          </form>
        ) : (
          <div>
            <div style={{ background: '#fff', border: '1px solid #DDE4D9', borderRadius: 14, padding: 24, marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: '#5E6B5F', marginBottom: 4 }}>{form.specialty} · {form.city}</p>
              <p style={{ fontSize: 17, color: '#101A13', fontWeight: 600 }}>
                You appear in the Google Maps results for <span style={{ color: GREEN }}>{report.rankedCount}</span> of {report.results.length} searches.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {report.results.map((r, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #DDE4D9', borderRadius: 12, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#101A13' }}>“{r.term}”</span>
                    <span style={{ fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: r.found ? 'rgba(9,107,23,.1)' : 'rgba(242,106,27,.12)', color: r.found ? GREEN : ORANGE }}>
                      {r.found ? `You rank #${r.rank}` : 'Not in the top results'}
                    </span>
                  </div>
                  {r.competitors.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <p style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#99A399', marginBottom: 6 }}>Ranking above you</p>
                      {r.competitors.map((c, j) => (
                        <div key={j} style={{ fontSize: 13.5, color: '#5E6B5F', display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                          <span>{j + 1}. {c.name}</span>
                          {c.rating ? <span>★ {c.rating} ({c.reviews})</span> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ background: GREEN, color: '#fff', borderRadius: 14, padding: 24, marginTop: 24, textAlign: 'center' }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>Want to climb these rankings?</h2>
              <p style={{ opacity: 0.9, marginBottom: 14, fontSize: 15 }}>CuraGo helps you build the Google presence that gets you found.</p>
              <Link href="/signup" style={{ display: 'inline-block', background: '#fff', color: GREEN, fontWeight: 600, padding: '12px 26px', borderRadius: 9, textDecoration: 'none' }}>Get started free</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
