'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const TABS = [
  { id: 'import', label: 'Bulk Upload' },
  { id: 'curriculum', label: 'Builder Packs' },
  { id: 'knowledge', label: 'Knowledge Base' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'doctors', label: 'Doctors' },
];

export default function PracticeOSPage() {
  const [tab, setTab] = useState('import');
  const [frameworks, setFrameworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const loadFrameworks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/platform/practice-os/frameworks');
      const data = await res.json();
      if (data.success) setFrameworks(data.frameworks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFrameworks(); }, [loadFrameworks]);

  return (
    <div className="space-y-6">
      {/* Command Center banner */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Zero To Practice Builder — Command Center</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload a full curriculum from Excel, and manage your Builder Packs — pricing, publishing, missions and per-doctor progress.
        </p>
        {/* Sub-tabs */}
        <div className="flex gap-2 mt-5 border-b border-gray-100 -mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'import' && <BulkUpload frameworks={frameworks} onImported={loadFrameworks} />}
      {tab === 'curriculum' && (
        <CurriculumTab frameworks={frameworks} loading={loading} onNew={() => setShowNew(true)} onChanged={loadFrameworks} />
      )}
      {tab === 'knowledge' && <KnowledgeBaseTab frameworks={frameworks} />}
      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'doctors' && <DoctorsTab />}

      {showNew && <NewFrameworkModal onClose={() => setShowNew(false)} onDone={loadFrameworks} />}
    </div>
  );
}

/* ---------------- Settings ---------------- */
function SettingsTab() {
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/platform/practice-os/settings');
        const data = await res.json();
        if (data.success) setPrice(String(data.settings.priceInInr));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch('/api/platform/practice-os/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceInInr: Number(price) }),
      });
      const data = await res.json();
      if (data.success) { setPrice(String(data.settings.priceInInr)); setMsg({ type: 'ok', text: 'Saved.' }); }
      else setMsg({ type: 'err', text: data.error || 'Save failed' });
    } catch {
      setMsg({ type: 'err', text: 'Something went wrong.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="bg-white rounded-xl shadow-sm p-6 text-gray-400 text-sm">Loading…</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg">
      <h2 className="font-semibold text-gray-900 mb-1">Legacy default price</h2>
      <p className="text-sm text-gray-500 mb-4">Pricing is now set <strong>per Builder Pack</strong> (open a pack → Pack settings → Price). This legacy value only seeds the price when migrating older packs and is otherwise unused.</p>
      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹, one-time)</label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
          <input
            type="number"
            min="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-48 pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button onClick={save} disabled={saving || !price} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
          {saving ? 'Saving…' : 'Save'}
        </button>
        {msg && <span className={`text-sm ${msg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>}
      </div>
    </div>
  );
}

/* ---------------- Bulk Upload ---------------- */
function BulkUpload({ frameworks = [], onImported }) {
  const [file, setFile] = useState(null);
  const [frameworkId, setFrameworkId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    if (!frameworkId) { setError('Choose the Builder Pack to import into.'); return; }
    setUploading(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('frameworkId', frameworkId);
      const res = await fetch('/api/platform/practice-os/import', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) { setResult(data); onImported(); }
      else setError(data.error || 'Import failed');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 flex gap-3">
        <svg className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <div className="space-y-1">
          <p className="font-semibold">Spreadsheet guidelines</p>
          <p>One row = one <strong>module</strong>. Rows that share the same <strong>Week + Day</strong> become one mission with multiple modules. Content imports into the <strong>Builder Pack you select below</strong> — nothing is created automatically. Re-uploading updates existing missions in place.</p>
        </div>
      </div>

      {/* Prominent sample/template download */}
      <a
        href="/api/platform/practice-os/import/template"
        className="flex items-center gap-3 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/40 rounded-lg p-4 transition-colors"
      >
        <span className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 6H7a2 2 0 01-2-2V6a2 2 0 012-2h5l2 2h4a2 2 0 012 2v10a2 2 0 01-2 2z" /></svg>
        </span>
        <span>
          <span className="block font-semibold text-gray-900 text-sm">Download the sample template (.xlsx)</span>
          <span className="block text-xs text-gray-500">Pre-filled example — includes an Instructions sheet and a mission with multiple modules. Copy its format.</span>
        </span>
      </a>

      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Import into Builder Pack</label>
        <select
          value={frameworkId}
          onChange={(e) => setFrameworkId(e.target.value)}
          className="block w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
        >
          <option value="">— Choose a pack —</option>
          {frameworks.map((f) => (
            <option key={f._id} value={f._id}>{f.title}</option>
          ))}
        </select>
        {frameworks.length === 0 && (
          <p className="text-xs text-amber-700 mt-1">No packs yet — create a Builder Pack first (Builder Packs tab → New).</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Select .xlsx file</label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-green-800">Curriculum imported</p>
          <p className="text-green-700">Created: {result.created} · Updated: {result.updated} · Skipped: {result.skipped} · Frameworks: {result.frameworks} · Modules: {result.modules}</p>
          {result.errors?.length > 0 && (
            <ul className="mt-2 text-red-700 list-disc list-inside max-h-32 overflow-y-auto">
              {result.errors.map((e, i) => <li key={i}>Row {e.row}: {e.error}</li>)}
            </ul>
          )}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || !frameworkId || uploading}
        className="bg-gray-900 hover:bg-black text-white font-medium text-sm px-5 py-2.5 rounded-lg disabled:opacity-50 inline-flex items-center gap-2"
      >
        {uploading ? 'Importing…' : 'Process Bulk Import'}
      </button>
    </div>
  );
}

/* ---------------- Knowledge Base ---------------- */
function KnowledgeBaseTab({ frameworks = [] }) {
  const [entries, setEntries] = useState(null);
  const [editing, setEditing] = useState(null); // entry being edited, or a new draft
  const [form, setForm] = useState({ title: '', frameworkId: '', content: '', sourceName: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const packName = (fid) => frameworks.find((f) => f._id === fid)?.title || 'Unknown pack';

  const load = useCallback(async () => {
    const res = await fetch('/api/platform/practice-os/knowledge');
    const data = await res.json();
    setEntries(data.success ? data.entries : []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const startNew = () => { setEditing({}); setForm({ title: '', frameworkId: '', content: '', sourceName: '' }); setError(''); };
  const startEdit = (e) => {
    setEditing(e);
    setForm({ title: e.title || '', frameworkId: e.frameworkId || '', content: e.content || '', sourceName: e.sourceName || '' });
    setError('');
  };

  const [reading, setReading] = useState(false);
  const onFile = async (file) => {
    if (!file) return;
    if (!/\.(txt|md|csv|pdf|docx)$/i.test(file.name)) { setError('Upload a .pdf, .docx, .txt, .md or .csv file — or paste text.'); return; }
    setReading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/platform/practice-os/knowledge/extract', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setForm((f) => ({ ...f, content: (f.content ? f.content + '\n\n' : '') + data.text, sourceName: data.sourceName, title: f.title || data.sourceName.replace(/\.[^.]+$/, '') }));
      } else {
        setError(data.error || 'Could not read the file.');
      }
    } catch {
      setError('Could not read the file.');
    } finally {
      setReading(false);
    }
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) { setError('Title and content are required.'); return; }
    setSaving(true); setError('');
    try {
      const isNew = !editing?._id;
      const res = await fetch(
        isNew ? '/api/platform/practice-os/knowledge' : `/api/platform/practice-os/knowledge/${editing._id}`,
        { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) },
      );
      const data = await res.json();
      if (data.success) { setEditing(null); await load(); }
      else setError(data.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const remove = async (e) => {
    if (!window.confirm(`Delete "${e.title}"?`)) return;
    await fetch(`/api/platform/practice-os/knowledge/${e._id}`, { method: 'DELETE' });
    load();
  };

  if (!entries) return <div className="bg-white rounded-xl shadow-sm p-8 text-gray-500">Loading…</div>;

  const globals = entries.filter((e) => !e.frameworkId);
  const scoped = entries.filter((e) => e.frameworkId);

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
        Knowledge the mission assistant learns from. <strong>Global</strong> entries apply to every pack; <strong>pack-scoped</strong> entries apply only inside that pack. The assistant combines global + the doctor&apos;s current pack automatically. Paste text or upload a PDF, DOCX, TXT, MD or CSV file.
      </div>

      {!editing ? (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Knowledge entries</h2>
            <button onClick={startNew} className="bg-gray-900 hover:bg-black text-white text-sm font-medium px-4 py-2 rounded-lg">+ Add knowledge</button>
          </div>
          {entries.length === 0 ? (
            <p className="text-sm text-gray-500">No knowledge yet. Add global knowledge (all packs) or scope it to a specific Builder Pack.</p>
          ) : (
            <div className="space-y-5">
              <KbGroup label="Global — applies to all packs" list={globals} onEdit={startEdit} onRemove={remove} />
              {frameworks.map((f) => {
                const list = scoped.filter((e) => String(e.frameworkId) === String(f._id));
                if (!list.length) return null;
                return <KbGroup key={f._id} label={`${f.title} — this pack only`} list={list} onEdit={startEdit} onRemove={remove} />;
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{editing._id ? 'Edit knowledge' : 'Add knowledge'}</h2>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Title</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. GBP verification playbook" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Applies to</label>
            <select value={form.frameworkId} onChange={(e) => setForm((f) => ({ ...f, frameworkId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Global — all packs</option>
              {frameworks.map((f) => <option key={f._id} value={f._id}>{f.title} — this pack only</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Content</label>
            <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={12} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" placeholder="Paste the working knowledge here…" />
            <div className="mt-2 flex items-center gap-3">
              <label className="text-xs text-blue-700 underline cursor-pointer">
                {reading ? 'Reading…' : 'Upload PDF / DOCX / TXT / MD / CSV'}
                <input type="file" accept=".pdf,.docx,.txt,.md,.csv" className="hidden" disabled={reading} onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
              {form.sourceName && <span className="text-xs text-gray-500">from {form.sourceName}</span>}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving} className="bg-gray-900 hover:bg-black text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => setEditing(null)} className="text-sm text-gray-500">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function KbGroup({ label, list, onEdit, onRemove }) {
  if (!list.length) return null;
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase mb-2">{label}</p>
      <div className="space-y-2">
        {list.map((e) => (
          <div key={e._id} className="border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{e.title}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{(e.content || '').slice(0, 160)}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => onEdit(e)} className="text-sm text-blue-600 hover:underline">Edit</button>
              <button onClick={() => onRemove(e)} className="text-sm text-red-600 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Curriculum (frameworks) ---------------- */
function CurriculumTab({ frameworks, loading, onNew, onChanged }) {
  const router = useRouter();
  const active = frameworks.filter((f) => !f.deletedAt);
  const deleted = frameworks.filter((f) => f.deletedAt);

  const restore = async (fw) => {
    await fetch(`/api/platform/practice-os/frameworks/${fw._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restore: true }),
    });
    onChanged?.();
  };
  const purge = async (fw) => {
    if (!window.confirm(`Permanently delete "${fw.title}" and ALL its content? This cannot be undone.`)) return;
    await fetch(`/api/platform/practice-os/frameworks/${fw._id}?permanent=true`, { method: 'DELETE' });
    onChanged?.();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Builder Packs</h2>
          <div className="flex items-center gap-2">
            <a
              href="/api/platform/practice-os/frameworks/export"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium inline-flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
              Export to Excel
            </a>
            <button onClick={onNew} className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium">New Builder Pack</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Builder Pack</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Missions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse"><td className="px-6 py-4" colSpan={5}><div className="h-4 bg-gray-100 rounded w-1/3" /></td></tr>
                ))
              ) : active.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No builder packs yet. Use <strong>Bulk Upload</strong> to import one.</td></tr>
              ) : (
                active.map((fw) => (
                  <tr
                    key={fw._id}
                    onClick={() => router.push(`/dashboard/practice-os/frameworks/${fw._id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 text-blue-600 font-medium">{fw.title}</td>
                    <td className="px-6 py-4 text-gray-600">{fw.category || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{fw.missionCount}</td>
                    <td className="px-6 py-4 text-gray-600">{(fw.priceInInr || 0) > 0 ? `₹${Number(fw.priceInInr).toLocaleString('en-IN')}` : 'Free'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${fw.isPublished ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {fw.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deleted packs — restorable (content + enrolments were kept). (#26) */}
      {deleted.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Deleted packs</h2>
            <p className="text-xs text-gray-500 mt-0.5">Hidden from doctors. Restore to bring a pack back exactly as it was, or delete it permanently.</p>
          </div>
          <ul className="divide-y divide-gray-200">
            {deleted.map((fw) => (
              <li key={fw._id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{fw.title}</p>
                  <p className="text-xs text-gray-500">{fw.missionCount} missions · deleted {fw.deletedAt ? new Date(fw.deletedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => restore(fw)} className="px-3 py-1.5 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 text-sm font-medium">Restore</button>
                  <button onClick={() => purge(fw)} className="px-3 py-1.5 text-red-600 hover:underline text-sm">Delete forever</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------- Shared form styles ---------------- */
const INPUT = 'w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500';
const LBL = 'block text-[11px] font-bold text-gray-500 uppercase mb-1';

/* ---------------- New Framework modal ---------------- */
function NewFrameworkModal({ onClose, onDone }) {
  const [form, setForm] = useState({ title: '', category: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/platform/practice-os/frameworks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { onDone(); onClose(); } else setError(data.error || 'Failed to create');
    } catch { setError('Something went wrong.'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">New Builder Pack</h2>
        <p className="text-sm text-gray-500 -mt-2 mb-4">Create the pack, then open it to set its price, outcomes, publish state and add missions.</p>
        <div className="space-y-4">
          <div><label className={LBL}>Title *</label><input className={INPUT} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Practice Building" /></div>
          <div><label className={LBL}>Category</label><input className={INPUT} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div><label className={LBL}>Description</label><textarea className={`${INPUT} h-20`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving…' : 'Create'}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Analytics ---------------- */
const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#ef4444'];

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/platform/practice-os/analytics');
        const json = await res.json();
        if (json.success) setData(json.analytics);
        else setError(json.error || 'Failed to load analytics');
      } catch {
        setError('Something went wrong.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="bg-white rounded-xl shadow-sm p-6 text-gray-400 text-sm">Loading analytics…</div>;
  if (error) return <div className="bg-white rounded-xl shadow-sm p-6 text-red-600 text-sm">{error}</div>;
  if (!data) return null;

  const completionChart = (data.completionByMission || []).map((m) => ({
    name: m.title.length > 28 ? `${m.title.slice(0, 28)}…` : m.title,
    completed: m.completed,
    skipped: m.skipped,
  }));
  const specChart = (data.specialtyProgress || []).map((s) => ({
    name: s.specialization.length > 20 ? `${s.specialization.slice(0, 20)}…` : s.specialization,
    avgDaysCompleted: s.avgDaysCompleted,
    doctors: s.doctors,
  }));

  return (
    <div className="space-y-6">
      {/* Headline stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Enrolled" value={data.totalEnrolled} />
        <StatCard label="Active (7d)" value={data.activeUsers} />
        <StatCard label="Setup Pending" value={data.setupPending} />
        <StatCard label="Completed" value={data.completed} />
        <StatCard label="Avg Days Completed" value={data.avgDaysCompleted} sub="of 30" />
        <StatCard label="Avg Performance" value={data.avgPerformance} sub="overall score" />
        <StatCard label="Avg Streak" value={data.avgStreak} sub="days" />
        <StatCard label="Avg Completion Time" value={`${data.avgCompletionMinutes}m`} sub="per mission" />
      </div>

      {/* AI usage */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="AI Prompts Used" value={data.aiUsage?.prompts ?? 0} />
        <StatCard label="Doctors Using AI" value={data.aiUsage?.doctors ?? 0} />
      </div>

      {/* Completion by mission */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Completion by Mission (top 10)</h2>
        {completionChart.length === 0 ? (
          <p className="text-sm text-gray-400">No progress recorded yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(220, completionChart.length * 38)}>
            <BarChart data={completionChart} layout="vertical" margin={{ left: 12, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="completed" fill="#10b981" radius={[0, 4, 4, 0]} />
              <Bar dataKey="skipped" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Specialty progress + drop-off */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Avg Days Completed by Specialty</h2>
          {specChart.length === 0 ? (
            <p className="text-sm text-gray-400">No enrollments yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, specChart.length * 40)}>
              <BarChart data={specChart} layout="vertical" margin={{ left: 12, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="avgDaysCompleted" radius={[0, 4, 4, 0]}>
                  {specChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Where doctors are stuck</h2>
          <p className="text-xs text-gray-400 mb-4">Doctors currently sitting on each day number</p>
          {(data.dropOff || []).length === 0 ? (
            <p className="text-sm text-gray-400">No active enrollments.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.dropOff.map((d) => (
                <li key={d.missionNumber} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">Day {d.missionNumber}</span>
                  <span className="text-sm font-medium text-gray-900">{d.count} {d.count === 1 ? 'doctor' : 'doctors'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Most skipped */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Most Skipped Missions</h2>
        {(data.mostSkipped || []).length === 0 ? (
          <p className="text-sm text-gray-400">No missions have been skipped.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.mostSkipped.map((m, i) => (
              <li key={i} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700 pr-4">{m.title}</span>
                <span className="text-sm font-medium text-orange-600">{m.skipped} skipped</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------------- Doctors ---------------- */
const STATUS_STYLES = {
  setup_pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  renewed: 'bg-purple-100 text-purple-800',
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function DoctorsTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/platform/practice-os/users');
        const json = await res.json();
        if (json.success) setUsers(json.users || []);
        else setError(json.error || 'Failed to load doctors');
      } catch {
        setError('Something went wrong.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Enrolled Doctors</h2>
        <p className="text-sm text-gray-500">Click a doctor to see their full Zero To Practice Builder record.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Streak</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="animate-pulse"><td className="px-6 py-4" colSpan={7}><div className="h-4 bg-gray-100 rounded w-1/3" /></td></tr>
              ))
            ) : error ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-red-600">{error}</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No doctors enrolled yet.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.doctorId} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(u.doctorId)}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-blue-600">{u.name}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{u.specialization || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[u.status] || 'bg-gray-100 text-gray-600'}`}>
                      {u.status?.replace('_', ' ') || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{u.daysCompleted}/30</td>
                  <td className="px-6 py-4 text-gray-600">{u.performance}</td>
                  <td className="px-6 py-4 text-gray-600">{u.currentStreak}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{fmtDate(u.lastActiveAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && <DoctorDetailModal doctorId={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// Grant or remove a doctor's Builder Pack access (no payment needed). Grant is
// non-destructive and reversible; Remove drops the paid entitlement but keeps
// their progress (free packs stay accessible regardless).
function AccessManager({ doctorId, packs, ownedPackIds, onChange }) {
  const [pack, setPack] = useState(packs[0]?.id || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const owned = new Set(ownedPackIds);

  const act = async (action) => {
    if (!pack) return;
    setBusy(true); setMsg('');
    try {
      const res = await fetch(`/api/platform/practice-os/users/${doctorId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, frameworkId: pack }),
      });
      const d = await res.json();
      if (d.success) { setMsg(action === 'grant' ? 'Access granted.' : 'Access removed.'); await onChange?.(); }
      else setMsg(d.error || 'Failed.');
    } catch { setMsg('Something went wrong.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-1">Pack access</h3>
      <p className="text-xs text-gray-400 mb-3">Grant or remove this doctor&apos;s access to a Builder Pack (no payment required).</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {packs.filter((p) => owned.has(p.id)).map((p) => (
          <span key={p.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{p.title}</span>
        ))}
        {ownedPackIds.length === 0 && <span className="text-xs text-gray-400">No paid pack access.</span>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <select value={pack} onChange={(e) => setPack(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {packs.length === 0 && <option value="">No packs</option>}
          {packs.map((p) => <option key={p.id} value={p.id}>{p.title}{p.priceInInr > 0 ? ` (₹${p.priceInInr})` : ' (free)'}</option>)}
        </select>
        <button onClick={() => act('grant')} disabled={busy || !pack} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">Grant</button>
        <button onClick={() => act('revoke')} disabled={busy || !pack} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50">Remove</button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </div>
  );
}

function DoctorDetailModal({ doctorId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/platform/practice-os/users/${doctorId}`);
      const json = await res.json();
      if (json.success) setData(json);
      else setError(json.error || 'Failed to load record');
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => { load(); }, [load]);

  const progressStyle = {
    locked: 'bg-gray-100 text-gray-500',
    available: 'bg-orange-100 text-orange-700',
    completed: 'bg-green-100 text-green-700',
    skipped: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            {data?.doctor?.name || 'Doctor record'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <p className="text-gray-400 text-sm">Loading record…</p>
          ) : error ? (
            <p className="text-red-600 text-sm">{error}</p>
          ) : data ? (
            <>
              {/* Doctor + enrollment summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Specialty</p>
                  <p className="text-sm text-gray-800">{data.doctor.specialization || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Status</p>
                  <p className="text-sm text-gray-800">{data.enrollment?.status?.replace('_', ' ') || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Days Completed</p>
                  <p className="text-sm text-gray-800">{data.enrollment?.daysCompleted ?? 0}/30</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Current Day</p>
                  <p className="text-sm text-gray-800">{data.enrollment?.currentDayNumber ?? '—'}</p>
                </div>
              </div>

              {/* Pack access — grant / remove from backend */}
              <AccessManager doctorId={doctorId} packs={data.packs || []} ownedPackIds={data.ownedPackIds || []} onChange={load} />

              {/* Performance */}
              {data.performance && (
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div><p className="text-xs text-gray-400 uppercase">Overall</p><p className="text-lg font-bold text-gray-900">{data.performance.overallScore}</p></div>
                  <div><p className="text-xs text-gray-400 uppercase">Current Streak</p><p className="text-lg font-bold text-gray-900">{data.performance.currentStreak}</p></div>
                  <div><p className="text-xs text-gray-400 uppercase">Longest Streak</p><p className="text-lg font-bold text-gray-900">{data.performance.longestStreak}</p></div>
                  <div><p className="text-xs text-gray-400 uppercase">Execution</p><p className="text-lg font-bold text-gray-900">{data.performance.executionScore}</p></div>
                </div>
              )}

              {/* Progress */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Mission Progress</h3>
                {data.progress.length === 0 ? (
                  <p className="text-sm text-gray-400">No mission progress yet.</p>
                ) : (
                  <div className="overflow-x-auto border border-gray-100 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mission</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Est/Actual</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.progress.map((p) => (
                          <tr key={p._id}>
                            <td className="px-3 py-2 text-gray-500">{p.missionNumber}</td>
                            <td className="px-3 py-2 text-gray-800">{p.title}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${progressStyle[p.status] || 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                            </td>
                            <td className="px-3 py-2 text-gray-600">{p.estimatedMinutes}m / {p.actualMinutes}m</td>
                            <td className="px-3 py-2 text-gray-500">{fmtDate(p.completedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* KPIs */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">KPIs</h3>
                {data.kpis.length === 0 ? (
                  <p className="text-sm text-gray-400">No KPI entries yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                    {data.kpis.map((k) => (
                      <li key={k._id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="text-gray-700">{k.label || k.key}</span>
                        <span className="text-gray-900 font-medium">{k.value} {k.unit} <span className="text-gray-400 font-normal">· {fmtDate(k.recordedAt)}</span></span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Journey */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Journey Timeline</h3>
                {data.journey.length === 0 ? (
                  <p className="text-sm text-gray-400">No timeline entries yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.journey.map((j) => (
                      <li key={j._id} className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{j.title}</p>
                          {j.description && <p className="text-xs text-gray-500">{j.description}</p>}
                          <p className="text-xs text-gray-400">{fmtDate(j.occurredAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
