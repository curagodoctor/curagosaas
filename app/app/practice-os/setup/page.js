'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WEEK_THEMES } from '../_components';

// Day-0 setup: CV → confirm → intent → Ready (CLAUDE.md §4.0). ~5 minutes.
const FIELDS = [
  { key: 'qualifications', label: 'Qualifications', usedFor: 'Your about section & Google description' },
  { key: 'specialty', label: 'Specialty', usedFor: 'Your services list & profile' },
  { key: 'registration', label: 'Registration number', usedFor: 'Credibility on your profile' },
  { key: 'procedures', label: 'Procedures you do', usedFor: 'Your services list' },
  { key: 'languages', label: 'Languages', usedFor: 'Your Google & reception script' },
];

export default function Setup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [cvUrl, setCvUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [confidences, setConfidences] = useState({});
  const [extractNote, setExtractNote] = useState('');
  const [fields, setFields] = useState(() => Object.fromEntries(FIELDS.map((f) => [f.key, ''])));
  const [intent, setIntent] = useState({ whyPractice: '', triedBefore: '', sixMonths: '', freeTime: 'evening' });
  const [days, setDays] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/practice-os/state').then((r) => r.json()).then((d) => {
      if (d.enrollment?.setupComplete) router.replace('/app/practice-os');
      setDays(d.days || []);
    });
  }, [router]);

  const uploadCv = async (file) => {
    setUploading(true); setExtractNote('');
    const fd = new FormData(); fd.append('file', file); fd.append('kind', 'cv');
    const res = await fetch('/api/practice-os/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);
    if (!data.success) { setExtractNote(data.error || 'Upload failed.'); return; }
    setCvUrl(data.url);

    // Parse the CV → pre-fill the confirm step (extraction only, never invented).
    setExtracting(true);
    try {
      const ex = await fetch('/api/practice-os/setup/extract', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawFileUrl: data.url }),
      });
      const exd = await ex.json();
      const filled = (exd.fields || []).filter((f) => f.value);
      if (exd.success && filled.length) {
        setFields((prev) => { const next = { ...prev }; for (const f of filled) next[f.field] = f.value; return next; });
        setConfidences(Object.fromEntries((exd.fields || []).map((f) => [f.field, f.confidence])));
        setExtractNote('Read your CV — your details are pre-filled. Confirm them next.');
      } else if (exd.aiConfigured === false) {
        setExtractNote('CV saved. Type your details next (AI extraction isn’t configured).');
      } else {
        setExtractNote('CV saved. You can type your details next.');
      }
    } catch {
      setExtractNote('CV saved. You can type your details next.');
    } finally {
      setExtracting(false);
    }
  };

  const saveCredentials = async () => {
    const extracted = FIELDS.filter((f) => fields[f.key].trim()).map((f) => ({ field: f.key, value: fields[f.key].trim(), confidence: 1, confirmed: true }));
    await fetch('/api/practice-os/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'credentials', rawFileUrl: cvUrl, extracted }) });
    setStep(3);
  };

  const saveIntent = async () => {
    await fetch('/api/practice-os/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'intent', ...intent }) });
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
          <h1 className="text-2xl font-semibold text-[var(--ink)] mb-2" style={{ letterSpacing: '-0.02em' }}>Upload your CV</h1>
          <p className="text-[var(--muted)] mb-5" style={{ maxWidth: '52ch' }}>The one file you already own pre-fills the hardest writing across six days — your services list, about section, Google description, Instagram bio and reception script. Writing about yourself is where people stall; this removes it.</p>
          <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && uploadCv(e.target.files[0])}
            className="block w-full text-sm text-[var(--muted)] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[var(--green-soft)] file:text-[var(--green)] cursor-pointer" />
          {uploading && <p className="text-sm text-[var(--muted)] mt-3">Uploading…</p>}
          {extracting && <p className="text-sm text-[var(--muted)] mt-3">Reading your CV…</p>}
          {!uploading && !extracting && cvUrl && <p className="text-sm text-[var(--green)] mt-3">✓ {extractNote || 'Uploaded. We only use what you confirm next.'}</p>}
          {!uploading && !extracting && !cvUrl && extractNote && <p className="text-sm text-[var(--orange)] mt-3">{extractNote}</p>}
          <p className="text-[11px] text-[var(--muted)] mt-4">Your CV is personal data. It&apos;s stored securely and you can delete it any time in settings.</p>
          <div className="mt-7 flex items-center gap-5">
            <button onClick={() => setStep(2)} className="pos-action">Continue</button>
            <button onClick={() => setStep(2)} className="pos-link text-sm">Skip — I&apos;ll type it</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)] mb-2" style={{ letterSpacing: '-0.02em' }}>Confirm your details</h1>
          <p className="text-[var(--muted)] mb-5" style={{ maxWidth: '52ch' }}>We never invent a credential — a wrong one on a public profile is a real problem. Enter or confirm each field. Nothing is used anywhere until you do.</p>
          <div className="space-y-4">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="pos-label">{f.label}</label>
                <input value={fields[f.key]} onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))} className="w-full pos-card p-2.5 text-sm mt-1" />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10.5px] text-[var(--muted)]">Used for: {f.usedFor}</p>
                  {confidences[f.key] != null && fields[f.key] && (
                    <span className="text-[10px]" style={{ color: confidences[f.key] >= 0.6 ? 'var(--green)' : 'var(--orange)' }}>
                      {confidences[f.key] >= 0.6 ? 'From your CV' : 'From your CV — double-check'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-7 flex items-center gap-5">
            <button onClick={saveCredentials} className="pos-action">Confirm & continue</button>
            <button onClick={() => setStep(1)} className="pos-link text-sm">Back</button>
          </div>
        </div>
      )}

      {step === 3 && (
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
            <button onClick={() => setStep(2)} className="pos-link text-sm">Back</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)] mb-2" style={{ letterSpacing: '-0.02em' }}>Your 30 days</h1>
          <p className="text-[var(--muted)] mb-5">Here is the whole programme. You can read all of it — you can start one. One task opens each day; you can&apos;t work ahead.</p>
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
