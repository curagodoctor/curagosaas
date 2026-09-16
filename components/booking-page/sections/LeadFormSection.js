'use client';

import { useState } from 'react';

// Lightweight lead-intake form — the alternative to the booking system. A visitor
// leaves their details; the doctor sees them as a Contact in their dashboard.
export default function LeadFormSection({
  title = 'Request a call back',
  subtitle = 'Leave your details and the clinic will get in touch.',
  buttonText = 'Send my details',
  accentColor = '#096B17',
  doctorId,
  subdomain,
}) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [state, setState] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || (!form.phone.trim() && !form.email.trim())) {
      setError('Please add your name and a phone or email.');
      return;
    }
    setState('sending'); setError('');
    try {
      const res = await fetch('/api/site/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, doctorId, subdomain }),
      });
      const d = await res.json();
      if (d.success) setState('done');
      else { setState('error'); setError(d.error || 'Could not submit.'); }
    } catch { setState('error'); setError('Something went wrong.'); }
  };

  const input = {
    width: '100%', padding: '13px 14px', borderRadius: 11, border: '1px solid #dfe4dc',
    fontSize: 15, outline: 'none', background: '#fff', fontFamily: 'inherit',
  };

  return (
    <section style={{ padding: '48px 20px', background: '#f7f9f5' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', background: '#fff', border: '1px solid #e5e9e3', borderRadius: 20, padding: 'clamp(22px,4vw,34px)', boxShadow: '0 18px 44px rgba(9,107,23,.06)' }}>
        {state === 'done' ? (
          <div style={{ textAlign: 'center', padding: '18px 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E8F1E6', color: accentColor, display: 'grid', placeItems: 'center', fontSize: 22, margin: '0 auto 12px' }}>✓</div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#101a13', margin: 0 }}>Thank you</h3>
            <p style={{ color: '#5e6b5f', fontSize: 15, marginTop: 8 }}>Your details have reached the clinic. They&apos;ll be in touch soon.</p>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: '#101a13', margin: 0, letterSpacing: '-0.02em' }}>{title}</h3>
            <p style={{ color: '#5e6b5f', fontSize: 15, marginTop: 6, marginBottom: 18 }}>{subtitle}</p>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input style={input} placeholder="Your name" value={form.name} onChange={(e) => set('name', e.target.value)} />
              <input style={input} placeholder="Phone number" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              <input style={input} placeholder="Email (optional)" value={form.email} onChange={(e) => set('email', e.target.value)} />
              <textarea style={{ ...input, minHeight: 90, resize: 'vertical' }} placeholder="How can we help? (optional)" value={form.message} onChange={(e) => set('message', e.target.value)} />
              {error && <p style={{ color: '#b42318', fontSize: 13, margin: 0 }}>{error}</p>}
              <button type="submit" disabled={state === 'sending'} style={{ background: accentColor, color: '#fff', border: 0, borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: state === 'sending' ? 0.6 : 1 }}>
                {state === 'sending' ? 'Sending…' : buttonText}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
