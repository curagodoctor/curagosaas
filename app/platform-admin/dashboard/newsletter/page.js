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
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Newsletter</h1>
          <p className="text-sm text-gray-500 mt-1">The Practice Builder — one idea to build a stronger clinical practice.</p>
        </div>
        <button onClick={createNew} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">+ New newsletter</button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

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

  if (!nl) return <div className="p-8 text-center text-gray-400">Loading…</div>;

  return (
    <div className="max-w-3xl">
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

      {/* Actions */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-3 mt-6">
          <button onClick={() => setPreview(true)} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Preview</button>
          <button onClick={sendTest} disabled={busy} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Send test to myself</button>
          <div className="flex-1" />
          <button onClick={sendAll} disabled={busy || !(audience?.total > 0)} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
            {busy ? 'Sending…' : `Publish & send${audience?.total ? ` (${audience.total})` : ''}`}
          </button>
        </div>
      )}

      {preview && <PreviewModal id={id} onClose={() => setPreview(false)} />}
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
