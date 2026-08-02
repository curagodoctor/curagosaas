'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SECTIONS, ALL_FIELDS, REQUIRED_FIELDS, Field } from '../_profile-fields';
import { UsernamePicker } from '../_username';

// Day-0 setup: Profile form (mandatory) → intent → CV (optional, last) → AI summary.
export default function Setup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState(() => Object.fromEntries(ALL_FIELDS.map((f) => [f.key, ''])));
  const [errors, setErrors] = useState({});
  const [intent, setIntent] = useState({ whyPractice: '', triedBefore: '', sixMonths: '', freeTime: 'evening' });

  const [cvUrl, setCvUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [confidences, setConfidences] = useState({});
  const [cvNote, setCvNote] = useState('');

  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [days, setDays] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/practice-os/state').then((r) => r.json()).then((d) => {
      if (d.enrollment?.setupComplete) router.replace('/app/practice-os');
      setDays(d.days || []);
    });
  }, [router]);

  const setField = (key, value) => { setFields((s) => ({ ...s, [key]: value })); setErrors((e) => ({ ...e, [key]: false })); };
  const toggleTag = (key, tag) => setFields((s) => {
    const cur = (s[key] || '').split(',').map((x) => x.trim()).filter(Boolean);
    const next = cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag];
    return { ...s, [key]: next.join(', ') };
  });

  const saveCredentials = async () => {
    const extracted = ALL_FIELDS
      .filter((f) => (fields[f.key] || '').trim())
      .map((f) => ({ field: f.key, value: fields[f.key].trim(), confidence: confidences[f.key] ?? 1, confirmed: true }));
    await fetch('/api/practice-os/setup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 'credentials', rawFileUrl: cvUrl, extracted }),
    });
  };

  // Step 1 → validate mandatory, save, continue.
  const submitProfile = async () => {
    const missing = {};
    for (const key of REQUIRED_FIELDS) if (!(fields[key] || '').trim()) missing[key] = true;
    if (Object.keys(missing).length) {
      setErrors(missing);
      const firstSec = SECTIONS.find((s) => s.fields.some((f) => missing[f.key]));
      document.getElementById(`sec-${firstSec?.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    await saveCredentials();
    setStep(2);
  };

  const saveIntent = async () => {
    await fetch('/api/practice-os/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'intent', ...intent }) });
    setStep(3);
  };

  // Step 3: optional CV — fills only fields left blank; never overwrites.
  const uploadCv = async (file) => {
    setUploading(true); setCvNote('');
    const fd = new FormData(); fd.append('file', file); fd.append('kind', 'cv');
    const res = await fetch('/api/practice-os/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);
    if (!data.success) { setCvNote(data.error || 'Upload failed.'); return; }
    setCvUrl(data.url);

    setExtracting(true);
    try {
      const ex = await fetch('/api/practice-os/setup/extract', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawFileUrl: data.url }),
      });
      const exd = await ex.json();
      const filled = (exd.fields || []).filter((f) => f.value);
      let added = 0;
      setFields((prev) => {
        const next = { ...prev };
        for (const f of filled) if (!(next[f.field] || '').trim()) { next[f.field] = f.value; added += 1; }
        return next;
      });
      setConfidences((prev) => ({ ...prev, ...Object.fromEntries((exd.fields || []).map((f) => [f.field, f.confidence])) }));
      setCvNote(added ? `Added ${added} detail${added === 1 ? '' : 's'} from your CV to blank fields.` : 'CV saved. Your profile already had everything.');
    } catch {
      setCvNote('CV saved.');
    } finally {
      setExtracting(false);
    }
  };

  // Step 3 → summary: save (with any CV fills), generate the AI summary, show step 4.
  const goToSummary = async () => {
    setSummarizing(true);
    await saveCredentials();
    try {
      const res = await fetch('/api/practice-os/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'summary' }) });
      const d = await res.json();
      setSummary(d.summary || '');
    } catch { /* ignore */ }
    setSummarizing(false);
    setStep(4);
  };

  const finish = async () => {
    setBusy(true);
    await fetch('/api/practice-os/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'complete' }) });
    router.push('/app/practice-os');
  };

  return (
    <div className="max-w-xl mx-auto px-5 py-12">
      <p className="pos-label mb-1">Setting up · Step {step} of 4</p>
      <div className="pos-meter mb-8"><span style={{ width: `${step * 25}%` }} /></div>

      {step === 1 && (
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)] mb-2" style={{ letterSpacing: '-0.02em' }}>Tell us about your practice</h1>
          <div className="pos-card p-4 mb-6" style={{ background: 'var(--green-soft)', borderColor: 'var(--green)' }}>
            <p className="text-sm text-[var(--ink)]" style={{ maxWidth: '54ch' }}>
              <b>Why this matters:</b> everything CuraGo writes for you — your website, Google posts, Instagram captions, patient replies and reception script — is generated from this. It&apos;s saved to your profile and you can edit it anytime. Fields marked <span style={{ color: 'var(--orange)' }}>*</span> are required.
            </p>
          </div>

          <div className="space-y-8">
            {SECTIONS.map((sec) => (
              <div key={sec.id} id={`sec-${sec.id}`}>
                <p className="pos-label" style={{ color: 'var(--green)' }}>{sec.title}</p>
                {sec.note && <p className="text-[11px] text-[var(--muted)] mt-1 mb-3" style={{ maxWidth: '52ch' }}>{sec.note}</p>}
                <div className="space-y-4">
                  {sec.fields.map((f) => (
                    <Field key={f.key} f={f} value={fields[f.key]} confidence={confidences[f.key]} error={errors[f.key]}
                      onChange={(v) => setField(f.key, v)} onToggleTag={(t) => toggleTag(f.key, t)} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {Object.keys(errors).length > 0 && <p className="text-sm text-red-600 mt-4">Please fill the required fields marked in red.</p>}
          <div className="mt-8">
            <button onClick={submitProfile} className="pos-action">Continue</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)] mb-2" style={{ letterSpacing: '-0.02em' }}>A few questions</h1>
          <div className="space-y-5 mt-5">
            <Q label="Why are you building your own practice?" value={intent.whyPractice} onChange={(v) => setIntent((s) => ({ ...s, whyPractice: v }))} />
            <Q label="What have you tried before that didn't work?" value={intent.triedBefore} onChange={(v) => setIntent((s) => ({ ...s, triedBefore: v }))} />
            <Q label="What would be different six months from now if this works?" value={intent.sixMonths} onChange={(v) => setIntent((s) => ({ ...s, sixMonths: v }))} />
            <div>
              <label className="pos-label">When do you usually have thirty free minutes?</label>
              <select value={intent.freeTime} onChange={(e) => setIntent((s) => ({ ...s, freeTime: e.target.value }))} className="w-full pos-card p-2.5 text-sm mt-1">
                <option value="morning">Morning (6–12)</option>
                <option value="afternoon">Afternoon (12–5)</option>
                <option value="evening">Evening (5–9)</option>
                <option value="night">Night (9–12)</option>
              </select>
            </div>
          </div>
          <div className="mt-7 flex items-center gap-5">
            <button onClick={saveIntent} className="pos-action">Continue</button>
            <button onClick={() => setStep(1)} className="pos-link text-sm">Back</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)] mb-2" style={{ letterSpacing: '-0.02em' }}>Add your CV — optional</h1>
          <p className="text-[var(--muted)] mb-5" style={{ maxWidth: '52ch' }}>Have your CV handy? Attach it and we&apos;ll fill in anything you left blank above. You can also skip this — it&apos;s not required.</p>
          <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && uploadCv(e.target.files[0])}
            className="block w-full text-sm text-[var(--muted)] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[var(--green-soft)] file:text-[var(--green)] cursor-pointer" />
          {uploading && <p className="text-sm text-[var(--muted)] mt-3">Uploading…</p>}
          {extracting && <p className="text-sm text-[var(--muted)] mt-3">Reading your CV…</p>}
          {!uploading && !extracting && cvNote && <p className="text-sm text-[var(--green)] mt-3">✓ {cvNote}</p>}
          <p className="text-[11px] text-[var(--muted)] mt-4">Your CV is personal data. It&apos;s stored securely and you can delete it any time.</p>
          <div className="mt-7 flex items-center gap-5">
            <button onClick={goToSummary} disabled={summarizing} className="pos-action">{summarizing ? 'Preparing your summary…' : (cvUrl ? 'Continue' : 'Skip & continue')}</button>
            <button onClick={() => setStep(2)} className="pos-link text-sm">Back</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)] mb-2" style={{ letterSpacing: '-0.02em' }}>Here&apos;s how CuraGo sees you</h1>
          {summary ? (
            <div className="pos-card p-5 mb-6" style={{ borderLeft: '3px solid var(--green)' }}>
              <p className="text-[15.5px] text-[var(--ink)] leading-relaxed">{summary}</p>
              <p className="text-[11px] text-[var(--muted)] mt-3">Your AI assistant uses this to write everything in your voice. Edit your profile anytime to refine it.</p>
            </div>
          ) : (
            <p className="text-[var(--muted)] mb-6">Your profile is saved. Your AI assistant will write using it.</p>
          )}

          <p className="pos-label mb-2">Your programme</p>
          <div className="pos-card divide-y" style={{ borderColor: 'var(--rule)' }}>
            {days.slice(0, 30).map((d, i) => (
              <div key={d._id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderColor: 'var(--rule-soft)' }}>
                <span className="pos-num text-sm w-6 text-[var(--muted)]">{d.missionNumber}</span>
                <span className="text-[13px] text-[var(--ink)] flex-1">{d.title}</span>
                {i === 0 && <span className="pos-label" style={{ color: 'var(--orange)' }}>Opens now</span>}
              </div>
            ))}
            {days.length === 0 && <div className="px-4 py-6 text-center text-sm text-[var(--muted)]">Your curriculum is being prepared.</div>}
          </div>
          <div className="mt-6 pos-card p-5">
            <p className="pos-label mb-1" style={{ color: 'var(--green)' }}>Join the leaderboard (optional)</p>
            <p className="text-sm text-[var(--muted)] mb-3" style={{ maxWidth: '48ch' }}>Compete anonymously with the cohort on XP, streak and speed. Pick a name — you can change it anytime.</p>
            <UsernamePicker />
          </div>

          <div className="mt-7">
            <button onClick={finish} disabled={busy} className="pos-action">{busy ? 'Opening Day 1…' : 'Start Day 1'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Q({ label, value, onChange }) {
  return (
    <div>
      <label className="pos-label">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="w-full pos-card p-2.5 text-sm mt-1" />
    </div>
  );
}
