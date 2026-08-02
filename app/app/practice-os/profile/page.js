'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SECTIONS, ALL_FIELDS, REQUIRED_FIELDS, Field } from '../_profile-fields';
import { UsernamePicker } from '../_username';

// Editable doctor profile — the same fields captured at Day-0, changeable anytime.
// Saving regenerates the AI summary that the assistant writes from.
export default function ProfilePage() {
  const router = useRouter();
  const [fields, setFields] = useState(null);
  const [summary, setSummary] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/practice-os/profile');
      if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
      if (res.status === 402) { router.push('/app/practice-os/unlock'); return; }
      const d = await res.json();
      const base = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, '']));
      setFields({ ...base, ...(d.fields || {}) });
      setSummary(d.summary || '');
    })();
  }, [router]);

  const setField = (key, value) => { setFields((s) => ({ ...s, [key]: value })); setErrors((e) => ({ ...e, [key]: false })); };
  const toggleTag = (key, tag) => setFields((s) => {
    const cur = (s[key] || '').split(',').map((x) => x.trim()).filter(Boolean);
    const next = cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag];
    return { ...s, [key]: next.join(', ') };
  });

  const save = async () => {
    const missing = {};
    for (const key of REQUIRED_FIELDS) if (!(fields[key] || '').trim()) missing[key] = true;
    if (Object.keys(missing).length) { setErrors(missing); setMsg('Please fill the required fields.'); return; }
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/practice-os/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });
      const d = await res.json();
      if (d.success) { setSummary(d.summary || summary); setMsg('Saved. Your assistant will use the updated profile.'); }
      else setMsg(d.error || 'Save failed.');
    } catch { setMsg('Save failed.'); }
    finally { setSaving(false); }
  };

  if (!fields) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="max-w-xl mx-auto px-5 py-10">
      <Link href="/app/practice-os" className="pos-link text-sm">← Back to today</Link>

      <div className="my-6">
        <p className="pos-label mb-1">My profile</p>
        <h1 className="text-[26px] font-semibold text-[var(--ink)]" style={{ letterSpacing: '-0.02em' }}>Your details</h1>
        <p className="text-sm text-[var(--muted)] mt-2" style={{ maxWidth: '52ch' }}>Everything CuraGo writes for you is generated from this. Keep it up to date.</p>
      </div>

      {summary && (
        <div className="pos-card p-5 mb-8" style={{ borderLeft: '3px solid var(--green)' }}>
          <p className="pos-label mb-1">How CuraGo sees you</p>
          <p className="text-[15px] text-[var(--ink)] leading-relaxed">{summary}</p>
        </div>
      )}

      <div className="pos-card p-5 mb-8">
        <p className="pos-label mb-1" style={{ color: 'var(--green)' }}>Leaderboard name</p>
        <p className="text-sm text-[var(--muted)] mb-3" style={{ maxWidth: '52ch' }}>Your anonymous name on the cohort leaderboard.</p>
        <UsernamePicker />
      </div>

      <div className="space-y-8">
        {SECTIONS.map((sec) => (
          <div key={sec.id} id={`sec-${sec.id}`}>
            <p className="pos-label" style={{ color: 'var(--green)' }}>{sec.title}</p>
            <div className="space-y-4 mt-3">
              {sec.fields.map((f) => (
                <Field key={f.key} f={f} value={fields[f.key]} error={errors[f.key]}
                  onChange={(v) => setField(f.key, v)} onToggleTag={(t) => toggleTag(f.key, t)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-4 sticky bottom-4">
        <button onClick={save} disabled={saving} className="pos-action">{saving ? 'Saving…' : 'Save profile'}</button>
        {msg && <span className="text-sm" style={{ color: msg.startsWith('Saved') ? 'var(--green)' : '#dc2626' }}>{msg}</span>}
      </div>
    </div>
  );
}
