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
  const [hasCv, setHasCv] = useState(false);
  const [cvBusy, setCvBusy] = useState(false);
  const [cvNote, setCvNote] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/practice-os/profile');
      if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
      if (res.status === 402) { router.push('/app/practice-os/unlock'); return; }
      const d = await res.json();
      const base = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, '']));
      setFields({ ...base, ...(d.fields || {}) });
      setSummary(d.summary || '');
      setHasCv(!!d.hasCv);
    })();
  }, [router]);

  // Upload or re-upload the CV — parses it, stores the knowledge base, and fills
  // any blank fields below (never overwrites what you've already entered).
  const uploadCv = async (file) => {
    setCvBusy(true); setCvNote('');
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('kind', 'cv');
      const up = await fetch('/api/practice-os/upload', { method: 'POST', body: fd });
      const upd = await up.json();
      if (!upd.success) { setCvNote(upd.error || 'Upload failed.'); return; }
      const ex = await fetch('/api/practice-os/setup/extract', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawFileUrl: upd.url }),
      });
      const exd = await ex.json();
      setHasCv(true);
      if (exd.parsed) {
        const filled = (exd.fields || []).filter((f) => f.value);
        let added = 0;
        setFields((prev) => {
          const next = { ...prev };
          for (const f of filled) if (!(next[f.field] || '').trim()) { next[f.field] = f.value; added += 1; }
          return next;
        });
        setCvNote(added ? `Added ${added} detail${added === 1 ? '' : 's'} from your CV to blank fields — review and save.` : 'CV saved. Your profile already had everything.');
      } else {
        setCvNote(exd.note || 'CV saved.');
      }
    } catch {
      setCvNote('Upload failed.');
    } finally {
      setCvBusy(false);
    }
  };

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

      {/* CV — upload after skipping, or re-upload to refresh the knowledge base */}
      <div className="pos-card p-5 mb-8">
        <p className="pos-label mb-1" style={{ color: 'var(--green)' }}>Your CV</p>
        <p className="text-sm text-[var(--muted)] mb-3" style={{ maxWidth: '52ch' }}>
          {hasCv
            ? 'A CV is on file. Re-upload to refresh what CuraGo knows about you — it fills any blank fields below.'
            : 'Optional. Upload your CV and we’ll fill in anything you left blank below.'}
        </p>
        <label className={`pos-link text-sm inline-flex items-center gap-2 ${cvBusy ? 'opacity-60' : 'cursor-pointer'}`}>
          {cvBusy ? 'Reading your CV…' : (hasCv ? '↻ Re-upload CV' : '+ Upload CV')}
          <input type="file" accept=".pdf,.doc,.docx" className="hidden" disabled={cvBusy}
            onChange={(e) => e.target.files?.[0] && uploadCv(e.target.files[0])} />
        </label>
        {cvNote && <p className="text-sm mt-2" style={{ color: 'var(--green)' }}>{cvNote}</p>}
        <p className="text-[11px] text-[var(--muted)] mt-3">Your CV is personal data, stored securely. You can delete it any time.</p>
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
