'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const SECTIONS = [
  { key: 'observation',    label: 'The Observation',   hint: 'Something interesting.' },
  { key: 'problem',        label: 'The Problem',       hint: 'What doctors commonly get wrong.' },
  { key: 'insight',        label: 'The Insight',       hint: 'Why it happens.' },
  { key: 'framework',      label: 'The Framework',     hint: 'A simple mental model.' },
  { key: 'doThisToday',    label: 'Do This Today',     hint: 'One 10-minute action.' },
  { key: 'realWorld',      label: 'Real World',        hint: 'Example / teardown / case.' },
  { key: 'practiceSafety', label: 'Practice Safety',   hint: 'Compliance + credibility check.' },
  { key: 'yourNextMove',   label: 'Your Next Move',    hint: 'One CTA.' },
  { key: 'oneQuestion',    label: 'One Question',      hint: 'A thought-provoking closing question.' },
];
const SEGMENTS = [
  { key: 'doctors', label: 'Doctors' },
  { key: 'cohort', label: 'Cohort leads' },
  { key: 'waitlist', label: 'Landing waitlist' },
];

export default function NewsletterPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tab, setTab] = useState('newsletters'); // 'newsletters' | 'sequences'
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/platform/newsletter', { credentials: 'include' });
      const d = await res.json();
      if (d.success) setItems(d.items || []);
      else setError(d.error || 'Failed to load');
    } catch { setError('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createNew = async () => {
    const res = await fetch('/api/platform/newsletter', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ subject: 'Untitled newsletter' }),
    });
    const d = await res.json();
    if (d.success) { await load(); setEditingId(d.item._id); }
    else setError(d.error || 'Failed to create');
  };

  if (editingId) {
    return <Composer id={editingId} onBack={() => { setEditingId(null); load(); }} />;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Newsletter</h1>
          <p className="text-sm text-gray-500 mt-1">The Practice Builder — one idea to build a stronger clinical practice.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(true)} className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">Branding & footer</button>
          {tab === 'newsletters' && <button onClick={createNew} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">+ New newsletter</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-gray-200">
        {[['newsletters', 'Newsletters'], ['sequences', 'Sequences']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${tab === k ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{label}</button>
        ))}
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

      {tab === 'sequences' ? <SequencesManager newsletters={items} /> : (
      <>
      {/* --- Newsletters list below --- */}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No newsletters yet. Create your first one.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Subject</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Sent to</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr key={n._id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 text-gray-900 font-medium max-w-[280px] truncate">{n.subject}</td>
                  <td className="px-5 py-3">
                    {n.status === 'sent'
                      ? <span className="inline-flex items-center gap-1.5 text-green-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Sent</span>
                      : n.status === 'sending'
                      ? <span className="text-amber-600">Sending…</span>
                      : n.status === 'scheduled'
                      ? <span className="text-blue-600">Scheduled</span>
                      : <span className="text-gray-400">Draft</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{n.status === 'sent' ? `${n.stats?.sent ?? 0} / ${n.stats?.recipients ?? 0}` : '—'}</td>
                  <td className="px-5 py-3 text-gray-500">{n.sentAt ? new Date(n.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setEditingId(n._id)} className="px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-md">{n.status === 'sent' ? 'View' : 'Edit'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </>
      )}
    </div>
  );
}

function Composer({ id, onBack }) {
  const [nl, setNl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [audience, setAudience] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');
  const dirty = useRef(false);

  // Load newsletter
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/platform/newsletter/${id}`, { credentials: 'include' });
      const d = await res.json();
      if (d.success) setNl(d.item);
    })();
  }, [id]);

  const readOnly = nl?.status === 'sent';

  // Live audience count when segments change
  const refreshAudience = useCallback(async (segments) => {
    const res = await fetch(`/api/platform/newsletter/audience?segments=${(segments || []).join(',')}`, { credentials: 'include' });
    const d = await res.json();
    if (d.success) setAudience(d);
  }, []);
  useEffect(() => { if (nl) refreshAudience(nl.segments); }, [nl?.segments, refreshAudience]); // eslint-disable-line

  const update = (patch) => { setNl((p) => ({ ...p, ...patch })); dirty.current = true; };
  const updateSection = (key, field, value) => {
    setNl((p) => ({ ...p, sections: p.sections.map((s) => s.key === key ? { ...s, [field]: value } : s) }));
    dirty.current = true;
  };
  const toggleSegment = (key) => {
    const has = nl.segments.includes(key);
    update({ segments: has ? nl.segments.filter((s) => s !== key) : [...nl.segments, key] });
  };

  const save = useCallback(async () => {
    if (!nl || readOnly) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/platform/newsletter/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({
          subject: nl.subject, preheader: nl.preheader, intro: nl.intro,
          ctaLabel: nl.ctaLabel, ctaUrl: nl.ctaUrl, sections: nl.sections, segments: nl.segments,
        }),
      });
      const d = await res.json();
      if (d.success) { dirty.current = false; setSavedAt(Date.now()); }
      else setMsg(d.error || 'Save failed');
    } finally { setSaving(false); }
  }, [nl, id, readOnly]);

  // Autosave (debounced) while editing
  useEffect(() => {
    if (!nl || readOnly) return;
    const t = setTimeout(() => { if (dirty.current) save(); }, 1200);
    return () => clearTimeout(t);
  }, [nl, save, readOnly]);

  const sendTest = async () => {
    setMsg(''); setBusy(true);
    if (dirty.current) await save();
    try {
      const res = await fetch(`/api/platform/newsletter/${id}/test`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({}),
      });
      const d = await res.json();
      setMsg(d.success ? `Test sent to ${d.email}.` : (d.error || 'Test failed.'));
    } catch { setMsg('Test failed.'); }
    finally { setBusy(false); }
  };

  const sendAll = async () => {
    const count = audience?.total ?? 0;
    if (!confirm(`Send "${nl.subject}" to ${count} recipient${count === 1 ? '' : 's'} now? This cannot be undone.`)) return;
    setMsg(''); setBusy(true);
    if (dirty.current) await save();
    try {
      const res = await fetch(`/api/platform/newsletter/${id}/send`, { method: 'POST', credentials: 'include' });
      const d = await res.json();
      if (d.success) {
        setMsg(`Sent to ${d.stats.sent} of ${d.stats.recipients}.`);
        setNl((p) => ({ ...p, status: 'sent', stats: d.stats }));
      } else setMsg(d.error || 'Send failed.');
    } catch { setMsg('Send failed.'); }
    finally { setBusy(false); }
  };

  const schedule = async () => {
    setMsg(''); setBusy(true);
    if (dirty.current) await save();
    try {
      // datetime-local is local time; convert to ISO.
      const iso = new Date(scheduleAt).toISOString();
      const res = await fetch(`/api/platform/newsletter/${id}/schedule`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ scheduledFor: iso }),
      });
      const d = await res.json();
      if (d.success) setNl((p) => ({ ...p, status: 'scheduled', scheduledFor: d.scheduledFor }));
      else setMsg(d.error || 'Could not schedule.');
    } catch { setMsg('Could not schedule.'); }
    finally { setBusy(false); }
  };

  const cancelSchedule = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/platform/newsletter/${id}/schedule`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ cancel: true }),
      });
      const d = await res.json();
      if (d.success) setNl((p) => ({ ...p, status: 'draft', scheduledFor: null }));
    } finally { setBusy(false); }
  };

  if (!nl) return <div className="p-8 text-center text-gray-400">Loading…</div>;

  return (
    <div className="w-full">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 mb-4">&larr; All newsletters</button>

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">{readOnly ? 'Newsletter' : 'Compose newsletter'}</h1>
        <div className="text-xs text-gray-400">
          {readOnly ? `Sent ${nl.sentAt ? new Date(nl.sentAt).toLocaleString('en-IN') : ''}` : saving ? 'Saving…' : savedAt ? 'Saved' : ''}
        </div>
      </div>

      {msg && <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">{msg}</div>}
      {readOnly && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">This newsletter was sent to {nl.stats?.sent ?? 0} of {nl.stats?.recipients ?? 0} recipients{nl.stats?.skipped ? ` (${nl.stats.skipped} unsubscribed)` : ''}.</div>}

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <Field label="Subject line">
          <input disabled={readOnly} value={nl.subject} onChange={(e) => update({ subject: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" placeholder="e.g. The 10-minute Google Profile fix" />
        </Field>
        <Field label="Preview text" hint="Shown after the subject in the inbox">
          <input disabled={readOnly} value={nl.preheader} onChange={(e) => update({ preheader: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" placeholder="Optional inbox preview line" />
        </Field>
        <Field label="Intro line">
          <input disabled={readOnly} value={nl.intro} onChange={(e) => update({ intro: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
        </Field>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Field label="Header image" hint="Banner at the top (optional)">
            <ImageUpload url={nl.heroImage} kind="image" label="Upload header image" disabled={readOnly}
              onChange={(u) => update({ heroImage: u })} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-600 mt-6">
            <input type="checkbox" disabled={readOnly} checked={nl.showReadTime !== false} onChange={(e) => update({ showReadTime: e.target.checked })} />
            Show “X min read” badge
          </label>
        </div>
      </div>

      {/* The 9 template sections */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Sections</h2>
        <p className="text-xs text-gray-400 mb-5">Fill the ones you want — empty sections are skipped in the email.</p>
        <div className="space-y-5">
          {SECTIONS.map((meta, i) => {
            const s = nl.sections.find((x) => x.key === meta.key) || { heading: meta.label, body: '' };
            return (
              <div key={meta.key} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-mono font-semibold text-orange-600">{String(i + 1).padStart(2, '0')}</span>
                  <input disabled={readOnly} value={s.heading} onChange={(e) => updateSection(meta.key, 'heading', e.target.value)}
                    className="text-sm font-semibold text-gray-800 bg-transparent outline-none border-b border-transparent focus:border-gray-300 flex-1 disabled:text-gray-600" />
                </div>
                <textarea disabled={readOnly} value={s.body} onChange={(e) => updateSection(meta.key, 'body', e.target.value)}
                  rows={3} placeholder={meta.hint}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-y disabled:bg-gray-50" />
                <div className="mt-2">
                  <ImageUpload url={s.imageUrl} kind="image" label="+ Add image to this section" disabled={readOnly}
                    onChange={(u) => updateSection(meta.key, 'imageUrl', u)} />
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-gray-100">
          <Field label="Button label (optional)">
            <input disabled={readOnly} value={nl.ctaLabel} onChange={(e) => update({ ctaLabel: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" placeholder="Start your free build" />
          </Field>
          <Field label="Button link (optional)">
            <input disabled={readOnly} value={nl.ctaUrl} onChange={(e) => update({ ctaUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" placeholder="https://curago.in/…" />
          </Field>
        </div>
      </div>

      {/* Attachment + delivery */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Attachment & delivery</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="PDF download (optional)" hint="Adds a download button">
            <ImageUpload url={nl.pdfUrl} kind="pdf" label="Upload PDF" disabled={readOnly}
              onChange={(u) => update({ pdfUrl: u })} />
          </Field>
          <Field label="PDF button label">
            <input disabled={readOnly || !nl.pdfUrl} value={nl.pdfLabel} onChange={(e) => update({ pdfLabel: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" placeholder="Download the guide" />
          </Field>
          <Field label="Reply-to address (optional)" hint="Where replies land">
            <input disabled={readOnly} value={nl.replyTo} onChange={(e) => update({ replyTo: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" placeholder="founder@curago.in" />
          </Field>
        </div>
      </div>

      {/* Audience */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Audience</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {SEGMENTS.map((seg) => {
            const on = nl.segments.includes(seg.key);
            const c = audience?.counts?.[seg.key];
            return (
              <button key={seg.key} disabled={readOnly} onClick={() => toggleSegment(seg.key)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${on ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-600'} disabled:opacity-60`}>
                {seg.label}{typeof c === 'number' ? ` · ${c}` : ''}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-gray-600">
          Sending to <strong className="text-gray-900">{audience?.total ?? '…'}</strong> unique recipient{audience?.total === 1 ? '' : 's'}
          {audience?.suppressed ? <span className="text-gray-400"> ({audience.suppressed} unsubscribed, excluded)</span> : null}.
        </p>
      </div>

      {/* Scheduled banner */}
      {nl.status === 'scheduled' && (
        <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center justify-between gap-3">
          <span>Scheduled for <strong>{new Date(nl.scheduledFor).toLocaleString('en-IN')}</strong> (sends at the next daily run, ~6am IST).</span>
          <button onClick={cancelSchedule} disabled={busy} className="text-xs px-2.5 py-1 border border-amber-300 rounded-md hover:bg-amber-100">Cancel</button>
        </div>
      )}

      {/* Actions */}
      {!readOnly && nl.status !== 'scheduled' && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setPreview(true)} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Preview</button>
            <button onClick={sendTest} disabled={busy} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Send test to myself</button>
            <div className="flex-1" />
            <button onClick={sendAll} disabled={busy || !(audience?.total > 0)} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
              {busy ? 'Sending…' : `Publish & send now${audience?.total ? ` (${audience.total})` : ''}`}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end border-t border-gray-100 pt-4">
            <span className="text-sm text-gray-500">or schedule for later:</span>
            <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={schedule} disabled={busy || !scheduleAt || !(audience?.total > 0)} className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-50">Schedule</button>
          </div>
        </div>
      )}

      {preview && <PreviewModal id={id} onClose={() => setPreview(false)} />}
    </div>
  );
}

// ---- Sequences (drip flows) ----
function SequencesManager({ newsletters }) {
  const [seqs, setSeqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // sequence id

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/platform/newsletter/sequences', { credentials: 'include' });
      const d = await res.json();
      if (d.success) setSeqs(d.sequences || []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const createSeq = async () => {
    const res = await fetch('/api/platform/newsletter/sequences', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ name: 'New sequence' }),
    });
    const d = await res.json();
    if (d.success) { await load(); setEditing(d.sequence._id); }
  };

  if (editing) return <SequenceEditor id={editing} newsletters={newsletters} onBack={() => { setEditing(null); load(); }} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Chain newsletters into an automated flow. New contacts (doctors, cohort leads, waitlist) auto-enroll; you can also import a list.</p>
        <button onClick={createSeq} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg whitespace-nowrap">+ New sequence</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading…</div>
        : seqs.length === 0 ? <div className="p-10 text-center text-gray-400">No sequences yet.</div>
        : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-100">
              <th className="px-5 py-3 font-medium">Sequence</th><th className="px-5 py-3 font-medium">Steps</th><th className="px-5 py-3 font-medium">Enrolled</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3"></th>
            </tr></thead>
            <tbody>
              {seqs.map((s) => (
                <tr key={s._id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-5 py-3 text-gray-600">{s.steps?.length || 0}</td>
                  <td className="px-5 py-3 text-gray-600">{s.counts?.active ?? 0} active · {s.counts?.total ?? 0} total</td>
                  <td className="px-5 py-3">{s.enabled ? <span className="inline-flex items-center gap-1.5 text-green-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Live</span> : <span className="text-gray-400">Paused</span>}</td>
                  <td className="px-5 py-3 text-right"><button onClick={() => setEditing(s._id)} className="px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-md">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SequenceEditor({ id, newsletters, onBack }) {
  const [seq, setSeq] = useState(null);
  const [counts, setCounts] = useState({ active: 0, total: 0 });
  const [msg, setMsg] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/platform/newsletter/sequences/${id}`, { credentials: 'include' });
    const d = await res.json();
    if (d.success) { setSeq(d.sequence); setCounts(d.counts || { active: 0, total: 0 }); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const save = async (patch) => {
    const res = await fetch(`/api/platform/newsletter/sequences/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify(patch),
    });
    const d = await res.json();
    if (d.success) setSeq(d.sequence); else setMsg(d.error || 'Save failed');
    return d.success;
  };

  const setSteps = (steps) => { setSeq((s) => ({ ...s, steps })); save({ steps }); };
  const addStep = () => setSteps([...(seq.steps || []), { newsletterId: newsletters[0]?._id || '', delayDays: (seq.steps?.length ? 3 : 0) }]);
  const updStep = (i, patch) => setSteps(seq.steps.map((s, j) => j === i ? { ...s, ...patch } : s));
  const rmStep = (i) => setSteps(seq.steps.filter((_, j) => j !== i));
  const move = (i, dir) => { const j = i + dir; if (j < 0 || j >= seq.steps.length) return; const arr = [...seq.steps]; [arr[i], arr[j]] = [arr[j], arr[i]]; setSteps(arr); };

  const uploadFile = async (file) => {
    if (!file) return;
    setImporting(true); setMsg('');
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await fetch(`/api/platform/newsletter/sequences/${id}/import`, { method: 'POST', body: fd, credentials: 'include' });
      const d = await res.json();
      setMsg(d.success ? `Imported ${d.enrolled} (${d.dupes} already in, ${d.invalid} invalid).` : (d.error || 'Import failed'));
      if (d.success) load();
    } finally { setImporting(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  if (!seq) return <div className="p-8 text-center text-gray-400">Loading…</div>;
  const nlName = (nid) => newsletters.find((n) => n._id === nid)?.subject || '(deleted newsletter)';

  return (
    <div className="max-w-3xl">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 mb-4">&larr; All sequences</button>

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <input value={seq.name} onChange={(e) => setSeq({ ...seq, name: e.target.value })} onBlur={() => save({ name: seq.name })}
          className="text-xl font-bold text-gray-900 bg-transparent outline-none border-b border-transparent focus:border-gray-300" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={seq.enabled} onChange={(e) => save({ enabled: e.target.checked })} />
          <span className={seq.enabled ? 'text-green-700 font-medium' : 'text-gray-500'}>{seq.enabled ? 'Live' : 'Paused'}</span>
        </label>
      </div>

      {msg && <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">{msg}</div>}

      {/* Steps */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Flow steps</h3>
        <p className="text-xs text-gray-400 mb-4">Each step sends a newsletter after the given gap. Step 1&apos;s gap counts from when someone enrolls (0 = right away).</p>
        <div className="space-y-2">
          {(seq.steps || []).map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap border border-gray-100 rounded-lg p-2.5">
              <span className="text-xs font-mono text-gray-400 w-5">{i + 1}</span>
              <select value={s.newsletterId} onChange={(e) => updStep(i, { newsletterId: e.target.value })} className="flex-1 min-w-[160px] px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {newsletters.length === 0 && <option value="">No newsletters yet</option>}
                {newsletters.map((n) => <option key={n._id} value={n._id}>{n.subject}</option>)}
              </select>
              <span className="text-xs text-gray-500">after</span>
              <input type="number" min={0} value={s.delayDays} onChange={(e) => updStep(i, { delayDays: Number(e.target.value) })} className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
              <span className="text-xs text-gray-500">days</span>
              <div className="flex items-center gap-1 ml-auto">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-400 hover:text-blue-600 disabled:opacity-30 text-xs px-1">▲</button>
                <button onClick={() => move(i, 1)} disabled={i === seq.steps.length - 1} className="text-gray-400 hover:text-blue-600 disabled:opacity-30 text-xs px-1">▼</button>
                <button onClick={() => rmStep(i)} className="text-red-600 text-xs px-1.5">✕</button>
              </div>
            </div>
          ))}
          {(seq.steps || []).length === 0 && <p className="text-sm text-gray-400">No steps yet.</p>}
        </div>
        <button onClick={addStep} disabled={newsletters.length === 0} className="mt-3 text-sm text-blue-600 hover:underline disabled:opacity-50">+ Add step</button>
      </div>

      {/* Audience + import */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Who's in this flow</h3>
        <label className="flex items-center gap-2 text-sm text-gray-700 mb-3">
          <input type="checkbox" checked={seq.autoEnroll} onChange={(e) => save({ autoEnroll: e.target.checked })} />
          Auto-enroll new contacts (doctors, cohort leads, waitlist)
        </label>
        <p className="text-sm text-gray-600 mb-3"><strong>{counts.active}</strong> active · {counts.total} total enrolled.</p>
        <div className="flex items-center gap-3 flex-wrap">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={(e) => uploadFile(e.target.files?.[0])} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={importing} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
            {importing ? 'Importing…' : 'Import mailing list (.xlsx)'}
          </button>
          <span className="text-xs text-gray-400">Columns: email, name</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}{hint && <span className="text-gray-400 font-normal"> — {hint}</span>}</label>
      {children}
    </div>
  );
}

async function uploadFile(file, kind) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('kind', kind);
  const res = await fetch('/api/platform/newsletter/upload', { method: 'POST', body: fd, credentials: 'include' });
  const d = await res.json();
  if (!d.success) throw new Error(d.error || 'Upload failed');
  return d.url;
}

// A drag/drop-free upload control: shows current file + replace/remove.
function ImageUpload({ url, kind = 'image', label, onChange, disabled }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef(null);
  const pick = () => inputRef.current?.click();
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr(''); setBusy(true);
    try { onChange(await uploadFile(f, kind)); }
    catch (ex) { setErr(ex.message); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ''; }
  };
  const accept = kind === 'pdf' ? 'application/pdf' : 'image/*';
  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} onChange={onFile} className="hidden" disabled={disabled} />
      {url ? (
        <div className="flex items-center gap-3">
          {kind === 'image'
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={url} alt="" className="h-12 w-20 object-cover rounded border border-gray-200" />
            : <span className="text-xs text-gray-500 truncate max-w-[220px]">📎 {url.split('/').pop()}</span>}
          {!disabled && <>
            <button onClick={pick} className="text-xs text-blue-600 hover:underline">Replace</button>
            <button onClick={() => onChange('')} className="text-xs text-red-600 hover:underline">Remove</button>
          </>}
        </div>
      ) : (
        <button onClick={pick} disabled={disabled || busy} className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          {busy ? 'Uploading…' : (label || 'Upload')}
        </button>
      )}
      {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
    </div>
  );
}

// Global branding: founder byline + footer social links + postal address.
function SettingsModal({ onClose }) {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/platform/newsletter/settings', { credentials: 'include' });
      const d = await res.json();
      if (d.success) setS({ ...d.settings, socialLinks: d.settings.socialLinks?.length ? d.settings.socialLinks : [{ label: '', url: '' }] });
    })();
  }, []);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/platform/newsletter/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(s),
      });
      const d = await res.json();
      setMsg(d.success ? 'Saved.' : (d.error || 'Save failed.'));
      if (d.success) setTimeout(onClose, 500);
    } finally { setSaving(false); }
  };

  const setLink = (i, field, val) => setS((p) => ({ ...p, socialLinks: p.socialLinks.map((l, j) => j === i ? { ...l, [field]: val } : l) }));
  const addLink = () => setS((p) => ({ ...p, socialLinks: [...p.socialLinks, { label: '', url: '' }] }));
  const removeLink = (i) => setS((p) => ({ ...p, socialLinks: p.socialLinks.filter((_, j) => j !== i) }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[88vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Branding & footer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        {!s ? <p className="text-gray-400 text-sm">Loading…</p> : (
          <div className="space-y-5">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={!!s.showFounder} onChange={(e) => setS({ ...s, showFounder: e.target.checked })} />
              Show founder byline in every newsletter
            </label>
            {s.showFounder && (
              <div className="space-y-3 pl-6 border-l-2 border-gray-100">
                <Field label="Founder name">
                  <input value={s.founderName} onChange={(e) => setS({ ...s, founderName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Dr. …" />
                </Field>
                <Field label="Credential line">
                  <input value={s.founderCredential} onChange={(e) => setS({ ...s, founderCredential: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="MBBS, MD · Founder, Curago" />
                </Field>
                <Field label="Photo">
                  <ImageUpload url={s.founderPhotoUrl} kind="image" label="Upload photo" onChange={(u) => setS({ ...s, founderPhotoUrl: u })} />
                </Field>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Social / footer links</p>
              <div className="space-y-2">
                {s.socialLinks.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={l.label} onChange={(e) => setLink(i, 'label', e.target.value)} placeholder="Instagram"
                      className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <input value={l.url} onChange={(e) => setLink(i, 'url', e.target.value)} placeholder="https://…"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <button onClick={() => removeLink(i)} className="text-gray-400 hover:text-red-600 px-1">✕</button>
                  </div>
                ))}
              </div>
              <button onClick={addLink} className="text-xs text-blue-600 hover:underline mt-2">+ Add link</button>
            </div>

            <Field label="Postal address" hint="Shown in the footer; improves deliverability">
              <textarea value={s.postalAddress} onChange={(e) => setS({ ...s, postalAddress: e.target.value })} rows={2}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-y" placeholder="Curago, …, India" />
            </Field>
            <Field label="Default reply-to" hint="Used when a newsletter has none">
              <input value={s.replyToDefault} onChange={(e) => setS({ ...s, replyToDefault: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="hello@curago.in" />
            </Field>

            {msg && <p className="text-sm text-gray-600">{msg}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={save} disabled={saving} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Renders the actual email HTML in an iframe by asking the server to build it.
function PreviewModal({ id, onClose }) {
  const [html, setHtml] = useState('');
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/platform/newsletter/${id}/preview`, { credentials: 'include' });
      if (res.ok) setHtml(await res.text());
    })();
  }, [id]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-semibold text-gray-800">Email preview</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <iframe title="preview" srcDoc={html} className="flex-1 w-full" />
      </div>
    </div>
  );
}
