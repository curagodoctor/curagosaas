'use client';

import { useState } from 'react';
import Link from 'next/link';
import MarketingHeader from '@/components/marketing/MarketingHeader';

const GREEN = '#096B17';
const ORANGE = '#F26A1B';
const WA = 'https://wa.me/917021227203?text=' + encodeURIComponent("Hi CuraGo — I just checked my Google ranking and I'd like help getting found.");
const input = { width: '100%', padding: '11px 12px', border: '1px solid #DDE4D9', borderRadius: 9, fontSize: 14.5, outline: 'none' };
const lbl = { fontSize: 12.5, fontWeight: 600, color: '#5E6B5F', marginBottom: 4, display: 'block' };

function WhatsAppButton({ children }) {
  return (
    <a href={WA} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25D366', color: '#fff', fontWeight: 600, padding: '11px 20px', borderRadius: 9, textDecoration: 'none', fontSize: 14.5 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.82 9.82 0 001.59 5.337l-.999 3.648 3.908-1.024z" /></svg>
      {children}
    </a>
  );
}

export default function RankCheckPage() {
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '', specialty: '', city: '', localities: '', gbpName: '', keywords: '' });
  const [state, setState] = useState('idle');
  const [report, setReport] = useState(null);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const run = async (e) => {
    e?.preventDefault(); setErr('');
    const kws = form.keywords.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    if (!form.name || !form.specialty || !form.city) { setErr('Please fill name, specialty and city.'); return; }
    if (!form.localities.trim()) { setErr('Please enter at least one locality.'); return; }
    if (kws.length < 3) { setErr('Please enter at least 3 keywords (comma or new line separated).'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setErr('Please enter a valid email.'); return; }
    setState('loading');
    try {
      const d = await (await fetch('/api/public/rank-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, keywords: kws }) })).json();
      if (d.success) { setReport(d); setState('done'); } else { setErr(d.error || 'Something went wrong.'); setState('error'); }
    } catch { setErr('Something went wrong. Please try again.'); setState('error'); }
  };

  const scorePct = report ? Math.round((report.score / report.scoreOutOf) * 100) : 0;

  return (
    <main style={{ background: '#F7F9F5', minHeight: '100vh', fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <MarketingHeader />
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: GREEN, fontWeight: 700 }}>Free Google Maps check</p>
          <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 600, color: '#101A13', letterSpacing: '-0.025em', margin: '8px 0 10px' }}>Where do you rank when patients search?</h1>
          <p style={{ fontSize: 16.5, color: '#5E6B5F', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>Enter your details and we’ll score your Google Maps ranking across 10 searches patients actually use — and show who’s ranking above you.</p>
        </div>

        {state !== 'done' ? (
          <form onSubmit={run} style={{ background: '#fff', border: '1px solid #DDE4D9', borderRadius: 14, padding: 28, maxWidth: 560, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={lbl}>Specialty *</label><input style={input} placeholder="e.g. Gastroenterologist" value={form.specialty} onChange={(e) => set('specialty', e.target.value)} /></div>
              <div><label style={lbl}>City *</label><input style={input} placeholder="e.g. Hyderabad" value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
            </div>
            <div style={{ marginTop: 12 }}><label style={lbl}>Localities / areas * (comma separated)</label><input style={input} placeholder="e.g. Banjara Hills, Jubilee Hills, Gachibowli" value={form.localities} onChange={(e) => set('localities', e.target.value)} /></div>
            <div style={{ marginTop: 12 }}><label style={lbl}>Your exact Google Business Profile name (optional)</label><input style={input} placeholder="Exactly as it appears on Google" value={form.gbpName} onChange={(e) => set('gbpName', e.target.value)} /></div>
            <div style={{ marginTop: 12 }}><label style={lbl}>Keywords * (minimum 3 — comma or new line)</label><textarea style={{ ...input, minHeight: 70 }} placeholder="e.g. gallstone surgery, hernia treatment, acidity doctor" value={form.keywords} onChange={(e) => set('keywords', e.target.value)} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div><label style={lbl}>Name *</label><input style={input} value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
              <div><label style={lbl}>Email *</label><input style={input} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
            </div>
            <div style={{ marginTop: 12 }}><label style={lbl}>WhatsApp number</label><input style={input} placeholder="+91 …" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} /></div>
            {err && <p style={{ color: '#C0392B', fontSize: 13, marginTop: 10 }}>{err}</p>}
            <button type="submit" disabled={state === 'loading'} style={{ width: '100%', marginTop: 16, background: ORANGE, color: '#fff', border: 'none', padding: '13px', borderRadius: 9, fontSize: 15.5, fontWeight: 600, cursor: 'pointer', opacity: state === 'loading' ? 0.7 : 1 }}>
              {state === 'loading' ? 'Checking your ranking…' : 'Check my ranking'}
            </button>
            <p style={{ fontSize: 11.5, color: '#99A399', textAlign: 'center', marginTop: 8 }}>Live Google Maps data. No ranking or outcome is guaranteed.</p>
          </form>
        ) : (
          <div>
            {/* Overall score */}
            <div style={{ background: '#fff', border: '1px solid #DDE4D9', borderRadius: 14, padding: 24, marginBottom: 20, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#5E6B5F' }}>{form.specialty} · {form.city}</p>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 64, lineHeight: 1, color: scorePct >= 60 ? GREEN : ORANGE, margin: '6px 0' }}>{report.score}<span style={{ fontSize: 28, color: '#99A399' }}> / {report.scoreOutOf}</span></div>
              <p style={{ fontSize: 15, color: '#101A13' }}>You appear in <strong style={{ color: GREEN }}>{report.rankedCount}</strong> of {report.results.length} searches. Scoring: rank #1 = 3 pts, #2 = 2, #3 = 1.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {report.results.map((r, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #DDE4D9', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#101A13' }}>“{r.term}”</span>
                    <span style={{ fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: r.points > 0 ? 'rgba(9,107,23,.1)' : 'rgba(242,106,27,.12)', color: r.points > 0 ? GREEN : ORANGE }}>
                      {r.found ? `Rank #${r.rank} · ${r.points} pt${r.points === 1 ? '' : 's'}` : 'Not in the list · 0'}
                    </span>
                  </div>
                  {r.profileLink && <a href={r.profileLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: GREEN, display: 'inline-block', marginTop: 6 }}>View your listing →</a>}
                  {r.competitors.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <p style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#99A399', marginBottom: 6 }}>Ranking above you</p>
                      {r.competitors.map((c, j) => (
                        <div key={j} style={{ fontSize: 13.5, color: '#5E6B5F', display: 'flex', justifyContent: 'space-between', gap: 8, padding: '2px 0' }}>
                          <span>{j + 1}. {c.link ? <a href={c.link} target="_blank" rel="noopener noreferrer" style={{ color: '#5E6B5F' }}>{c.name}</a> : c.name}</span>
                          {c.rating ? <span style={{ whiteSpace: 'nowrap' }}>★ {c.rating} ({c.reviews})</span> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ background: GREEN, color: '#fff', borderRadius: 14, padding: 24, marginTop: 24, textAlign: 'center' }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>Want to climb these rankings?</h2>
              <p style={{ opacity: 0.9, marginBottom: 14, fontSize: 15 }}>CuraGo helps you build the Google presence that gets you found.</p>
              <Link href="/signup" style={{ display: 'inline-block', background: '#fff', color: GREEN, fontWeight: 600, padding: '12px 26px', borderRadius: 9, textDecoration: 'none' }}>Get started for free</Link>
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.25)' }}>
                <p style={{ fontSize: 14.5, opacity: 0.95, marginBottom: 10 }}>Don’t know where to start? How about a conversation with us.</p>
                <WhatsAppButton>Chat with us on WhatsApp</WhatsAppButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
