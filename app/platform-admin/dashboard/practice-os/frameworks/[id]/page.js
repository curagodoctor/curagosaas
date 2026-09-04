'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { sanitizeSalesPage } from '@/lib/practice-os/salesPage';

// Pack (framework) settings the doctor-facing catalog reads: price, publish
// state, tagline, summary, and outcomes. A pack must be Published (and have a
// price, unless free) to appear in the catalog and be purchasable.
function PackSettings({ framework, onSaved }) {
  const [form, setForm] = useState({
    title: framework.title || '',
    tagline: framework.tagline || '',
    summary: framework.summary || '',
    category: framework.category || '',
    priceInInr: framework.priceInInr ?? 0,
    order: framework.order ?? 0,
    isPublished: !!framework.isPublished,
    outcomes: (framework.outcomes || []).join('\n'),
    isContinuation: !!framework.isContinuation,
    prerequisiteFrameworkId: framework.prerequisiteFrameworkId ? String(framework.prerequisiteFrameworkId) : '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // Other packs, to pick a prerequisite for a Continue pack.
  const [otherPacks, setOtherPacks] = useState([]);
  useEffect(() => {
    fetch('/api/platform/practice-os/frameworks')
      .then((r) => r.json())
      .then((d) => setOtherPacks((d.frameworks || []).filter((f) => String(f._id) !== String(framework._id))))
      .catch(() => {});
  }, [framework._id]);

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      const res = await fetch(`/api/platform/practice-os/frameworks/${framework._id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          tagline: form.tagline,
          summary: form.summary,
          category: form.category,
          priceInInr: Number(form.priceInInr) || 0,
          order: Number(form.order) || 0,
          isPublished: form.isPublished,
          outcomes: form.outcomes.split('\n').map((o) => o.trim()).filter(Boolean),
          isContinuation: form.isContinuation,
          prerequisiteFrameworkId: form.isContinuation ? (form.prerequisiteFrameworkId || null) : null,
        }),
      });
      const json = await res.json();
      if (json.success) { setSaved(true); onSaved?.(); }
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => { setForm((s) => ({ ...s, [k]: v })); setSaved(false); };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Pack settings (catalog)</h2>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${form.isPublished ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
          {form.isPublished ? 'Published — visible to doctors' : 'Draft — hidden from catalog'}
        </span>
      </div>

      <label className="block">
        <span className="text-xs font-medium text-gray-500 uppercase">Pack title</span>
        <input value={form.title} onChange={(e) => set('title', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Get Found on Google" />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-medium text-gray-500 uppercase">Category</span>
          <input value={form.category} onChange={(e) => set('category', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Get found on Google" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-500 uppercase">Price (₹) — 0 = free</span>
          <input type="number" min="0" value={form.priceInInr} onChange={(e) => set('priceInInr', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-500 uppercase">Order — lower shows first</span>
          <input type="number" value={form.order} onChange={(e) => set('order', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-medium text-gray-500 uppercase">Tagline (one line)</span>
        <input value={form.tagline} onChange={(e) => set('tagline', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Get found by patients searching near you." />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-gray-500 uppercase">Summary (catalog card)</span>
        <textarea value={form.summary} onChange={(e) => set('summary', e.target.value)} rows={2} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="A short description of what this pack is." />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-gray-500 uppercase">Outcomes (one per line)</span>
        <textarea value={form.outcomes} onChange={(e) => set('outcomes', e.target.value)} rows={4} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder={'A verified Google Business Profile\nYour first 10 patient reviews\n…'} />
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isPublished} onChange={(e) => set('isPublished', e.target.checked)} className="w-4 h-4" />
        <span className="text-sm text-gray-700">Published (visible &amp; purchasable in the doctor catalog)</span>
      </label>

      <div className="border-t border-gray-100 pt-3 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isContinuation} onChange={(e) => set('isContinuation', e.target.checked)} className="w-4 h-4" />
          <span className="text-sm text-gray-700">Continue pack (unlocks only after another pack is completed)</span>
        </label>
        {form.isContinuation && (
          <label className="block">
            <span className="text-xs font-medium text-gray-500 uppercase">Prerequisite pack (must be completed first)</span>
            <select value={form.prerequisiteFrameworkId} onChange={(e) => set('prerequisiteFrameworkId', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Select a pack…</option>
              {otherPacks.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving…' : 'Save pack settings'}
        </button>
        {saved && <span className="text-sm text-green-600">Saved ✓</span>}
      </div>
    </div>
  );
}

// Manually add a mission to THIS pack (alternative to Excel import). Creates the
// mission with a starter module, then opens the mission editor to add modules.
function AddMissionForm({ frameworkId, onAdded }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ missionText: '', weekNumber: 1, dayNumber: 1, missionNumber: 1, module: 'Module 1', category: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.missionText.trim()) { setError('Mission text is required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/platform/practice-os/missions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, frameworkId }),
      });
      const data = await res.json();
      if (data.success) {
        onAdded();
        if (data.mission?._id) router.push(`/dashboard/practice-os/missions/${data.mission._id}`);
      } else setError(data.error || 'Failed to add mission');
    } finally { setSaving(false); }
  };

  if (!open) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">Add a mission to this pack manually, then add its modules in the editor.</p>
        <button onClick={() => setOpen(true)} className="bg-gray-900 hover:bg-black text-white text-sm font-medium px-4 py-2 rounded-lg">+ Add mission</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <h2 className="font-semibold text-gray-900">Add mission</h2>
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mission (today&apos;s task)</label>
        <input value={form.missionText} onChange={(e) => set('missionText', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Add three clinic photos to your Google profile" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Week</label>
          <input type="number" min={1} value={form.weekNumber} onChange={(e) => set('weekNumber', Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Day</label>
          <input type="number" min={1} value={form.dayNumber} onChange={(e) => set('dayNumber', Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mission #</label>
          <input type="number" min={1} value={form.missionNumber} onChange={(e) => set('missionNumber', Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">First module</label>
          <input value={form.module} onChange={(e) => set('module', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Module 1" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button onClick={submit} disabled={saving} className="bg-gray-900 hover:bg-black text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-50">{saving ? 'Adding…' : 'Add & edit modules'}</button>
        <button onClick={() => { setOpen(false); setError(''); }} className="text-sm text-gray-500">Cancel</button>
      </div>
    </div>
  );
}

// Add a TASK to a task-mode pack. A task is a single-module mission; we create
// it with the next order number and open the editor.
function AddTaskForm({ frameworkId, nextNumber, onAdded }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!title.trim()) { setError('Task title is required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/platform/practice-os/missions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameworkId, missionText: title.trim(),
          weekNumber: 1, dayNumber: nextNumber, missionNumber: nextNumber,
          module: title.trim(), category: '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        onAdded();
        if (data.mission?._id) router.push(`/dashboard/practice-os/missions/${data.mission._id}`);
      } else setError(data.error || 'Failed to add task');
    } finally { setSaving(false); }
  };

  if (!open) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">Add a task to this pack, then fill in its content in the editor.</p>
        <button onClick={() => setOpen(true)} className="bg-gray-900 hover:bg-black text-white text-sm font-medium px-4 py-2 rounded-lg">+ Add task</button>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <h2 className="font-semibold text-gray-900">Add task</h2>
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Task title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Claim your Google Business Profile" autoFocus />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button onClick={submit} disabled={saving} className="bg-gray-900 hover:bg-black text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-50">{saving ? 'Adding…' : 'Add & edit content'}</button>
        <button onClick={() => { setOpen(false); setError(''); }} className="text-sm text-gray-500">Cancel</button>
      </div>
    </div>
  );
}

/* ---------------- Sales page editor ---------------- */

const SP_INPUT = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm';
const SP_LABEL = 'block text-xs font-medium text-gray-500 uppercase mb-1';

// A add/remove/reorder list of plain strings.
function StringList({ label, value, onChange, placeholder }) {
  const list = Array.isArray(value) ? value : [];
  const upd = (i, v) => onChange(list.map((x, xi) => (xi === i ? v : x)));
  const add = () => onChange([...list, '']);
  const remove = (i) => onChange(list.filter((_, xi) => xi !== i));
  const move = (i, d) => {
    const j = i + d; if (j < 0 || j >= list.length) return;
    const next = [...list]; [next[i], next[j]] = [next[j], next[i]]; onChange(next);
  };
  return (
    <div>
      {label && <span className={SP_LABEL}>{label}</span>}
      <div className="space-y-2">
        {list.map((v, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input value={v} onChange={(e) => upd(i, e.target.value)} className={SP_INPUT} placeholder={placeholder} />
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-2 py-1 text-gray-500 disabled:opacity-30" title="Up">↑</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="px-2 py-1 text-gray-500 disabled:opacity-30" title="Down">↓</button>
            <button type="button" onClick={() => remove(i)} className="px-2 py-1 text-gray-400 hover:text-red-500" title="Remove">✕</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-2 text-sm text-blue-600 hover:underline">+ Add</button>
    </div>
  );
}

// A add/remove/reorder list of objects with named text fields.
function ObjectList({ label, value, onChange, fields }) {
  const list = Array.isArray(value) ? value : [];
  const upd = (i, k, v) => onChange(list.map((x, xi) => (xi === i ? { ...x, [k]: v } : x)));
  const add = () => onChange([...list, Object.fromEntries(fields.map((f) => [f.key, '']))]);
  const remove = (i) => onChange(list.filter((_, xi) => xi !== i));
  const move = (i, d) => {
    const j = i + d; if (j < 0 || j >= list.length) return;
    const next = [...list]; [next[i], next[j]] = [next[j], next[i]]; onChange(next);
  };
  return (
    <div>
      {label && <span className={SP_LABEL}>{label}</span>}
      <div className="space-y-3">
        {list.map((row, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
            <div className="flex justify-end gap-1.5">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-2 text-gray-500 disabled:opacity-30" title="Up">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="px-2 text-gray-500 disabled:opacity-30" title="Down">↓</button>
              <button type="button" onClick={() => remove(i)} className="px-2 text-gray-400 hover:text-red-500" title="Remove">✕</button>
            </div>
            {fields.map((f) => (
              f.multiline
                ? <textarea key={f.key} value={row[f.key] || ''} onChange={(e) => upd(i, f.key, e.target.value)} rows={2} className={SP_INPUT} placeholder={f.placeholder} />
                : <input key={f.key} value={row[f.key] || ''} onChange={(e) => upd(i, f.key, e.target.value)} className={SP_INPUT} placeholder={f.placeholder} />
            ))}
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-2 text-sm text-blue-600 hover:underline">+ Add</button>
    </div>
  );
}

// An image URL field with an upload button (reuses /api/admin/upload-image).
function ImageField({ label, value, onChange, placeholder }) {
  const [busy, setBusy] = useState(false);
  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('kind', 'image');
      const res = await fetch('/api/platform/newsletter/upload', { method: 'POST', body: fd });
      const d = await res.json();
      if (d.success && d.url) onChange(d.url);
      else alert(d.error || 'Upload failed');
    } catch { alert('Upload failed'); }
    finally { setBusy(false); }
  };
  return (
    <div>
      {label && <span className={SP_LABEL}>{label}</span>}
      <div className="flex items-center gap-2">
        <input value={value || ''} onChange={(e) => onChange(e.target.value)} className={SP_INPUT} placeholder={placeholder || 'https://… or upload →'} />
        <label className="shrink-0 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
          {busy ? '…' : 'Upload'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      </div>
      {value && <img src={value} alt="" className="mt-2 h-16 rounded border border-gray-200 object-cover" />}
    </div>
  );
}

// One collapsible section card with a "show on page" toggle.
function SPSection({ title, sec, onToggle, defaultOpen, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const enabled = sec?.enabled !== false;
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
        <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-2 text-left">
          <span className="text-gray-400 text-xs">{open ? '▼' : '▶'}</span>
          <span className="font-semibold text-gray-900 text-sm">{title}</span>
        </button>
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
          Show on page
        </label>
      </div>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

// The full sales-page editor: one card per section, saved via the framework PATCH.
function SalesPageEditor({ framework, onSaved }) {
  const [sp, setSp] = useState(() => sanitizeSalesPage(framework.salesPage || {}));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const setSec = (key, patch) => { setSp((s) => ({ ...s, [key]: { ...s[key], ...patch } })); setSaved(false); };
  const toggle = (key) => (v) => setSec(key, { enabled: v });

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      const res = await fetch(`/api/platform/practice-os/frameworks/${framework._id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salesPage: sp }),
      });
      const json = await res.json();
      if (json.success) { setSaved(true); onSaved?.(); }
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Sales page (public /packs/{framework.slug})</h2>
        <p className="text-sm text-gray-500 mt-0.5">The rich public page. Blank fields fall back to the pack title/tagline/summary/outcomes and this pack&apos;s missions. Uncheck a section to hide it.</p>
      </div>

      <SPSection title="1 · Hero" sec={sp.hero} onToggle={toggle('hero')} defaultOpen>
        <StringList label="Badges (chips)" value={sp.hero.badges} onChange={(v) => setSec('hero', { badges: v })} placeholder="BUILDER PACK 02" />
        <input value={sp.hero.title} onChange={(e) => setSec('hero', { title: e.target.value })} className={SP_INPUT} placeholder={`Title — defaults to "${framework.title}"`} />
        <input value={sp.hero.subtitle} onChange={(e) => setSec('hero', { subtitle: e.target.value })} className={SP_INPUT} placeholder={`Italic accent line — defaults to tagline`} />
        <textarea value={sp.hero.description} onChange={(e) => setSec('hero', { description: e.target.value })} rows={2} className={SP_INPUT} placeholder="Description — defaults to summary" />
        <textarea value={sp.hero.supportingLine} onChange={(e) => setSec('hero', { supportingLine: e.target.value })} rows={2} className={SP_INPUT} placeholder="Supporting line (e.g. Built for doctors.)" />
        <ObjectList label="Spec grid (value + label)" value={sp.hero.specs} onChange={(v) => setSec('hero', { specs: v })} fields={[{ key: 'value', placeholder: '21' }, { key: 'label', placeholder: 'MISSIONS' }]} />
        <StringList label="Product images / banner" value={sp.hero.images} onChange={(v) => setSec('hero', { images: v })} placeholder="https://…" />
        <StringList label="Ticker lines" value={sp.hero.ticker} onChange={(v) => setSec('hero', { ticker: v })} placeholder="LEARN BY DOING" />
      </SPSection>

      <SPSection title="2 · Problem / The gap" sec={sp.problem} onToggle={toggle('problem')}>
        <input value={sp.problem.title} onChange={(e) => setSec('problem', { title: e.target.value })} className={SP_INPUT} placeholder="Title" />
        <input value={sp.problem.subtitle} onChange={(e) => setSec('problem', { subtitle: e.target.value })} className={SP_INPUT} placeholder="Italic subtitle" />
        <StringList label="Bullets" value={sp.problem.bullets} onChange={(v) => setSec('problem', { bullets: v })} placeholder="Complete it." />
        <textarea value={sp.problem.conclusion} onChange={(e) => setSec('problem', { conclusion: e.target.value })} rows={2} className={SP_INPUT} placeholder="Conclusion line" />
      </SPSection>

      <SPSection title="3 · Big idea / How it works" sec={sp.bigIdea} onToggle={toggle('bigIdea')}>
        <input value={sp.bigIdea.title} onChange={(e) => setSec('bigIdea', { title: e.target.value })} className={SP_INPUT} placeholder="Title" />
        <input value={sp.bigIdea.subtitle1} onChange={(e) => setSec('bigIdea', { subtitle1: e.target.value })} className={SP_INPUT} placeholder="Italic subtitle" />
        <StringList label="The loop (steps)" value={sp.bigIdea.loop} onChange={(v) => setSec('bigIdea', { loop: v })} placeholder="Learn" />
        <ObjectList label="Bullet cards (title + description)" value={sp.bigIdea.bullets} onChange={(v) => setSec('bigIdea', { bullets: v })} fields={[{ key: 'title', placeholder: 'Your own practice' }, { key: 'desc', placeholder: 'Every mission runs on your real profile.', multiline: true }]} />
        <textarea value={sp.bigIdea.conclusion} onChange={(e) => setSec('bigIdea', { conclusion: e.target.value })} rows={2} className={SP_INPUT} placeholder="Green banner conclusion" />
      </SPSection>

      <SPSection title="4 · Video demo" sec={sp.videoDemo} onToggle={toggle('videoDemo')}>
        <input value={sp.videoDemo.title} onChange={(e) => setSec('videoDemo', { title: e.target.value })} className={SP_INPUT} placeholder="Title" />
        <label className="block">
          <span className={SP_LABEL}>Video URL (mp4) — section hides if empty</span>
          <input value={sp.videoDemo.videoUrl} onChange={(e) => setSec('videoDemo', { videoUrl: e.target.value })} className={SP_INPUT} placeholder="https://…/walkthrough.mp4" />
        </label>
        <textarea value={sp.videoDemo.description} onChange={(e) => setSec('videoDemo', { description: e.target.value })} rows={2} className={SP_INPUT} placeholder="Description" />
        <input value={sp.videoDemo.caption} onChange={(e) => setSec('videoDemo', { caption: e.target.value })} className={SP_INPUT} placeholder="Caption under the video" />
        <StringList label="Flow chips" value={sp.videoDemo.flow} onChange={(v) => setSec('videoDemo', { flow: v })} placeholder="Dashboard" />
      </SPSection>

      <SPSection title="5 · Honest promise" sec={sp.honestPromise} onToggle={toggle('honestPromise')}>
        <input value={sp.honestPromise.title} onChange={(e) => setSec('honestPromise', { title: e.target.value })} className={SP_INPUT} placeholder="No magic tricks." />
        <input value={sp.honestPromise.intro} onChange={(e) => setSec('honestPromise', { intro: e.target.value })} className={SP_INPUT} placeholder="… does not guarantee:" />
        <StringList label="What it does NOT guarantee" value={sp.honestPromise.negatives} onChange={(v) => setSec('honestPromise', { negatives: v })} placeholder="#1 rankings" />
        <input value={sp.honestPromise.highlight} onChange={(e) => setSec('honestPromise', { highlight: e.target.value })} className={SP_INPUT} placeholder="Green highlight line" />
        <textarea value={sp.honestPromise.conclusion} onChange={(e) => setSec('honestPromise', { conclusion: e.target.value })} rows={2} className={SP_INPUT} placeholder="Conclusion" />
      </SPSection>

      <SPSection title="6 · Curriculum (from this pack's missions)" sec={sp.curriculum} onToggle={toggle('curriculum')}>
        <input value={sp.curriculum.title} onChange={(e) => setSec('curriculum', { title: e.target.value })} className={SP_INPUT} placeholder="Title — defaults to “N missions. One complete workflow.”" />
        <label className="block">
          <span className={SP_LABEL}>How many missions to show before “Show all”</span>
          <input type="number" min={1} max={50} value={sp.curriculum.previewCount} onChange={(e) => setSec('curriculum', { previewCount: Number(e.target.value) })} className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </label>
        <p className="text-xs text-gray-500">Missions are pulled live from this pack — no need to re-enter them here.</p>
      </SPSection>

      <SPSection title="7 · Offer" sec={sp.offer} onToggle={toggle('offer')}>
        <input value={sp.offer.title} onChange={(e) => setSec('offer', { title: e.target.value })} className={SP_INPUT} placeholder="Title" />
        <StringList label="Benefits — defaults to outcomes" value={sp.offer.benefits} onChange={(v) => setSec('offer', { benefits: v })} placeholder="21 practical missions" />
        <input value={sp.offer.ctaLabel} onChange={(e) => setSec('offer', { ctaLabel: e.target.value })} className={SP_INPUT} placeholder="CTA label — e.g. Start GBP Mastery (price is automatic)" />
        <input value={sp.offer.supportingLine} onChange={(e) => setSec('offer', { supportingLine: e.target.value })} className={SP_INPUT} placeholder="Instant access · Learn at your own pace" />
      </SPSection>

      <SPSection title="8 · FAQ" sec={sp.faq} onToggle={toggle('faq')}>
        <input value={sp.faq.title} onChange={(e) => setSec('faq', { title: e.target.value })} className={SP_INPUT} placeholder="Frequently asked questions" />
        <ObjectList label="Questions" value={sp.faq.items} onChange={(v) => setSec('faq', { items: v })} fields={[{ key: 'q', placeholder: 'Question' }, { key: 'a', placeholder: 'Answer', multiline: true }]} />
      </SPSection>

      <SPSection title="9 · Final CTA" sec={sp.finalCta} onToggle={toggle('finalCta')}>
        <input value={sp.finalCta.title} onChange={(e) => setSec('finalCta', { title: e.target.value })} className={SP_INPUT} placeholder="Title" />
        <input value={sp.finalCta.subtitle} onChange={(e) => setSec('finalCta', { subtitle: e.target.value })} className={SP_INPUT} placeholder="Subtitle" />
        <input value={sp.finalCta.ctaLabel} onChange={(e) => setSec('finalCta', { ctaLabel: e.target.value })} className={SP_INPUT} placeholder="CTA label" />
        <input value={sp.finalCta.supportingLine} onChange={(e) => setSec('finalCta', { supportingLine: e.target.value })} className={SP_INPUT} placeholder="Supporting line" />
      </SPSection>

      <SPSection title="Founder box" sec={sp.founder} onToggle={toggle('founder')}>
        <input value={sp.founder.eyebrow} onChange={(e) => setSec('founder', { eyebrow: e.target.value })} className={SP_INPUT} placeholder="BUILT BY A DOCTOR WHO UNDERSTANDS THE PROBLEM" />
        <textarea value={sp.founder.intro} onChange={(e) => setSec('founder', { intro: e.target.value })} rows={2} className={SP_INPUT} placeholder="Intro line" />
        <textarea value={sp.founder.body} onChange={(e) => setSec('founder', { body: e.target.value })} rows={3} className={SP_INPUT} placeholder="Body — section hides if this and name are empty" />
        <input value={sp.founder.name} onChange={(e) => setSec('founder', { name: e.target.value })} className={SP_INPUT} placeholder="Dr Yuvaraj" />
        <input value={sp.founder.credential} onChange={(e) => setSec('founder', { credential: e.target.value })} className={SP_INPUT} placeholder="Surgical Gastroenterologist · Founder, CuraGo" />
        <ImageField label="Photo" value={sp.founder.photo} onChange={(v) => setSec('founder', { photo: v })} />
      </SPSection>

      <div className="flex items-center gap-3 pt-2">
        <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving…' : 'Save sales page'}
        </button>
        {saved && <span className="text-sm text-green-600">Saved ✓</span>}
        <a href={`/packs/${framework.slug}`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline ml-auto">Preview public page →</a>
      </div>
    </div>
  );
}

export default function FrameworkDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/platform/practice-os/frameworks/${id}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteFramework = async () => {
    if (!confirm('Delete this builder pack and all its missions? This cannot be undone.')) return;
    await fetch(`/api/platform/practice-os/frameworks/${id}`, { method: 'DELETE' });
    router.push('/dashboard/practice-os');
  };

  const handleDeleteMission = async (mission) => {
    if (!confirm(`Delete mission "${mission.missionText?.slice(0, 60) || 'Untitled'}"? This cannot be undone.`)) return;
    await fetch(`/api/platform/practice-os/missions/${mission._id}`, { method: 'DELETE' });
    load();
  };

  // Rearrange two adjacent missions by swapping their ordering keys (day +
  // mission #). The curriculum sorts by week → day → mission #, so swapping both
  // reliably swaps their position. (#32)
  const reorderMission = async (list, index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const a = list[index], b = list[target];
    await Promise.all([
      fetch(`/api/platform/practice-os/missions/${a._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dayNumber: b.dayNumber, missionNumber: b.missionNumber }) }),
      fetch(`/api/platform/practice-os/missions/${b._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dayNumber: a.dayNumber, missionNumber: a.missionNumber }) }),
    ]);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
  }
  if (!data) {
    return <div className="text-center py-24 text-gray-500">Builder pack not found.</div>;
  }

  const { framework, modules, missions } = data;
  const moduleName = (mid) => modules.find((m) => m._id === mid)?.title || '—';

  // Group missions by week -> day for display.
  const byWeek = {};
  for (const m of missions) {
    (byWeek[m.weekNumber] ??= []).push(m);
  }
  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/practice-os" className="text-sm text-blue-600 hover:underline">← Back to Zero To Practice Builder</Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{framework.title}</h1>
          <p className="text-gray-500">{framework.category || 'No category'} · {modules.length} modules · {missions.length} missions</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/platform/practice-os/frameworks/${id}/export`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium inline-flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
            Export to Excel
          </a>
          <button onClick={handleDeleteFramework} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium">
            Delete Builder Pack
          </button>
        </div>
      </div>

      <PackSettings framework={framework} onSaved={load} />

      <SalesPageEditor framework={framework} onSaved={load} />

      {framework.mode === 'task' ? (
        <>
          <AddTaskForm frameworkId={framework._id} nextNumber={(missions?.length || 0) + 1} onAdded={load} />
          {missions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">No tasks yet — add one above.</div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200"><h2 className="font-semibold text-gray-900">Tasks</h2></div>
              <table className="w-full">
                <thead><tr className="text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-6 py-2">#</th><th className="px-6 py-2">Task</th><th className="px-6 py-2">Status</th><th className="px-6 py-2 text-right">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {missions.slice().sort((a, b) => (a.dayNumber - b.dayNumber) || (a.missionNumber - b.missionNumber)).map((m, idx, arr) => (
                    <tr key={m._id} onClick={() => router.push(`/dashboard/practice-os/missions/${m._id}`)} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-3 text-gray-500">
                        <div className="flex items-center gap-1">
                          <div className="flex flex-col">
                            <button type="button" onClick={(e) => { e.stopPropagation(); reorderMission(arr, idx, -1); }} disabled={idx === 0} className="text-gray-400 hover:text-blue-600 disabled:opacity-30 leading-none" title="Move up">▲</button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); reorderMission(arr, idx, 1); }} disabled={idx === arr.length - 1} className="text-gray-400 hover:text-blue-600 disabled:opacity-30 leading-none" title="Move down">▼</button>
                          </div>
                          <span>{idx + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-blue-600 font-medium">{m.missionText?.slice(0, 80) || 'Untitled'}{m.missionText?.length > 80 ? '…' : ''}</td>
                      <td className="px-6 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${m.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'}`}>{m.status === 'draft' ? 'Draft' : 'Published'}</span></td>
                      <td className="px-6 py-3 text-right"><button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteMission(m); }} className="text-sm text-red-600 hover:text-red-700 hover:underline">Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
      <AddMissionForm frameworkId={framework._id} onAdded={load} />

      {missions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
          No missions yet — add one above, or import from the Bulk Upload tab.
        </div>
      ) : (
        weeks.map((week) => (
          <div key={week} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Week {week}</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-6 py-2">#</th>
                  <th className="px-6 py-2">Day</th>
                  <th className="px-6 py-2">Module</th>
                  <th className="px-6 py-2">Mission</th>
                  <th className="px-6 py-2">Category</th>
                  <th className="px-6 py-2">Status</th>
                  <th className="px-6 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(() => {
                  const rows = byWeek[week].slice().sort((a, b) => (a.dayNumber - b.dayNumber) || (a.missionNumber - b.missionNumber));
                  return rows.map((m, idx) => (
                  <tr
                    key={m._id}
                    onClick={() => router.push(`/dashboard/practice-os/missions/${m._id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-3 text-gray-500">
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col">
                          <button type="button" onClick={(e) => { e.stopPropagation(); reorderMission(rows, idx, -1); }} disabled={idx === 0} className="text-gray-400 hover:text-blue-600 disabled:opacity-30 leading-none" title="Move up">▲</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); reorderMission(rows, idx, 1); }} disabled={idx === rows.length - 1} className="text-gray-400 hover:text-blue-600 disabled:opacity-30 leading-none" title="Move down">▼</button>
                        </div>
                        <span>{m.missionNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-600">Day {m.dayNumber}</td>
                    <td className="px-6 py-3 text-gray-600">{moduleName(m.moduleId)}</td>
                    <td className="px-6 py-3 text-blue-600 font-medium">
                      {m.missionText?.slice(0, 60) || 'Untitled'}{m.missionText?.length > 60 ? '…' : ''}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{m.category || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'
                      }`}>
                        {m.status === 'draft' ? 'Draft' : 'Published'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteMission(m); }}
                        className="text-sm text-red-600 hover:text-red-700 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        ))
      )}
        </>
      )}
    </div>
  );
}
