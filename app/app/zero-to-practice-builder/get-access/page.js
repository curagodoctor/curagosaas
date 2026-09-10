'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PosNav from '@/components/practice-os/PosNav';

// §7 — the optimization boundary. Free setup is done; to unlock the ongoing
// optimization work the doctor submits a short request. No payment in v1 — the
// founder reviews and grants access. Three states: form / pending / granted.
export default function GetAccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState(null); // 'none' | 'pending' | 'granted' | 'denied'
  const [form, setForm] = useState({ name: '', phone: '', specialty: '', city: '', challenge: '', goal: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/practice-os/access-request', { credentials: 'include' });
      if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
      const d = await res.json();
      setStatus(d.status || 'none');
      setForm((f) => ({ ...f, ...(d.prefill || {}) }));
    } catch { setStatus('none'); }
  }, [router]);
  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim()) { setError('Please add your name and phone.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/practice-os/access-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (d.success) setStatus(d.status || 'pending');
      else setError(d.error || 'Could not submit. Please try again.');
    } catch { setError('Something went wrong.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-5 pt-[64px] pb-10">
      <PosNav breadcrumb="Get access" />

      {status === null && <p className="text-sm text-[var(--muted)] mt-8">Loading…</p>}

      {status === 'granted' && (
        <div className="mt-8">
          <div className="pos-card p-6" style={{ borderColor: 'var(--green)', background: 'var(--green-soft)' }}>
            <p className="pos-label" style={{ color: 'var(--green)' }}>You&apos;re in</p>
            <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1" style={{ letterSpacing: '-0.02em' }}>Optimization is unlocked</h1>
            <p className="text-sm text-[var(--muted)] mt-2">Your ongoing work is ready in your control center.</p>
            <button onClick={() => router.push('/app/zero-to-practice-builder')} className="pos-action mt-4">Go to control center</button>
          </div>
        </div>
      )}

      {status === 'pending' && (
        <div className="mt-8">
          <div className="pos-card p-6" style={{ borderColor: 'var(--orange)' }}>
            <p className="pos-label" style={{ color: 'var(--orange)' }}>Request received</p>
            <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1" style={{ letterSpacing: '-0.02em' }}>We&apos;re reviewing your request</h1>
            <p className="text-sm text-[var(--muted)] mt-2" style={{ maxWidth: '52ch' }}>
              We&apos;ll review your details and reach out on WhatsApp to open up the optimization work for you.
              In the meantime, keep your setup steps polished.
            </p>
            <button onClick={() => router.push('/app/zero-to-practice-builder/start')} className="pos-link mt-4" style={{ fontSize: 14 }}>Back to setup →</button>
          </div>
        </div>
      )}

      {(status === 'none' || status === 'denied') && (
        <>
          <div className="mt-8 mb-5">
            <p className="pos-label mb-1">The next step</p>
            <h1 className="text-[26px] font-semibold text-[var(--ink)]" style={{ letterSpacing: '-0.02em' }}>Unlock ongoing optimization</h1>
            <p className="text-sm text-[var(--muted)] mt-2" style={{ maxWidth: '52ch' }}>
              You&apos;ve built the foundation. The optimization work is where we grow your visibility week after week —
              GBP services, education pages and more, written for you to review and publish. Tell us a little and we&apos;ll open it up.
            </p>
          </div>

          <div className="pos-card p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Your name" value={form.name} onChange={(v) => set('name', v)} />
              <Field label="Phone (WhatsApp)" value={form.phone} onChange={(v) => set('phone', v)} />
              <Field label="Specialty" value={form.specialty} onChange={(v) => set('specialty', v)} />
              <Field label="City" value={form.city} onChange={(v) => set('city', v)} />
            </div>
            <Field label="Your biggest challenge in getting found right now" value={form.challenge} onChange={(v) => set('challenge', v)} textarea />
            <Field label="What would success look like in 6 months?" value={form.goal} onChange={(v) => set('goal', v)} textarea />

            {error && <p className="text-[13px] text-red-600">{error}</p>}

            <button onClick={submit} disabled={submitting} className="pos-action" style={{ opacity: submitting ? 0.5 : 1 }}>
              {submitting ? 'Submitting…' : 'Request access'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, value, onChange, textarea }) {
  return (
    <label className="block">
      <span className="pos-label">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="w-full pos-card p-2.5 text-sm mt-1.5" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full pos-card p-2.5 text-sm mt-1.5" />
      )}
    </label>
  );
}
