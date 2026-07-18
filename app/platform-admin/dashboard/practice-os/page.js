'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const TABS = [
  { id: 'import', label: 'Bulk Upload' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'create', label: 'Mission Creator' },
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
        <h1 className="text-2xl font-bold text-gray-900">Practice OS — Command Center</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload a full curriculum from Excel, browse frameworks &amp; missions, and create missions manually. Nothing is hardcoded.
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

      {tab === 'import' && <BulkUpload onImported={loadFrameworks} />}
      {tab === 'curriculum' && (
        <CurriculumTab frameworks={frameworks} loading={loading} onNew={() => setShowNew(true)} />
      )}
      {tab === 'create' && <MissionCreator onCreated={loadFrameworks} />}

      {showNew && <NewFrameworkModal onClose={() => setShowNew(false)} onDone={loadFrameworks} />}
    </div>
  );
}

/* ---------------- Bulk Upload ---------------- */
function BulkUpload({ onImported }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
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
          <p>One row = one mission. Frameworks and modules are created automatically. Re-uploading the same sheet updates existing missions in place (matched by Framework + Module + Week + Day + Mission Number). Start from the template below.</p>
          <a href="/api/platform/practice-os/import/template" className="inline-block mt-1 text-blue-700 underline font-medium">Download the Excel template</a>
        </div>
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
        disabled={!file || uploading}
        className="bg-gray-900 hover:bg-black text-white font-medium text-sm px-5 py-2.5 rounded-lg disabled:opacity-50 inline-flex items-center gap-2"
      >
        {uploading ? 'Importing…' : 'Process Bulk Import'}
      </button>
    </div>
  );
}

/* ---------------- Curriculum (frameworks) ---------------- */
function CurriculumTab({ frameworks, loading, onNew }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Frameworks</h2>
        <button onClick={onNew} className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium">New Framework</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Framework</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modules</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Missions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse"><td className="px-6 py-4" colSpan={5}><div className="h-4 bg-gray-100 rounded w-1/3" /></td></tr>
              ))
            ) : frameworks.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No frameworks yet. Use <strong>Bulk Upload</strong> or <strong>Mission Creator</strong> to add content.</td></tr>
            ) : (
              frameworks.map((fw) => (
                <tr key={fw._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/practice-os/frameworks/${fw._id}`} className="text-blue-600 hover:underline font-medium">{fw.title}</Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{fw.category || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{fw.moduleCount}</td>
                  <td className="px-6 py-4 text-gray-600">{fw.missionCount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${fw.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {fw.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Mission Creator ---------------- */
const INPUT = 'w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500';
const LBL = 'block text-[11px] font-bold text-gray-500 uppercase mb-1';
const EMPTY = {
  framework: 'Practice Building', module: '', weekNumber: 1, dayNumber: 1, missionNumber: 1,
  category: '', purpose: '', missionText: '', videoUrl: '', pdfUrl: '', externalLink: '',
  gptPrompt: '', b1l: '', b1u: '', b2l: '', b2u: '',
  evidenceRequired: 'none', rewardPoints: 10, celebrationMessage: '', kpiFields: '', unlockDelayDays: 1,
};

function MissionCreator({ onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setMsg(null);
    if (!form.framework.trim() || !form.module.trim() || !form.missionText.trim()) {
      setMsg({ type: 'err', text: 'Framework, Module and Mission text are required.' });
      return;
    }
    setSaving(true);
    try {
      const buttons = [
        { label: form.b1l, url: form.b1u },
        { label: form.b2l, url: form.b2u },
      ].filter((b) => b.label.trim());
      const res = await fetch('/api/platform/practice-os/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, buttons }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'ok', text: 'Mission created & published.', frameworkId: data.frameworkId });
        setForm((p) => ({ ...EMPTY, framework: p.framework, module: p.module, weekNumber: p.weekNumber, missionNumber: Number(p.missionNumber) + 1, dayNumber: Number(p.dayNumber) + 1 }));
        onCreated();
      } else {
        setMsg({ type: 'err', text: data.error || 'Failed to create mission' });
      }
    } catch {
      setMsg({ type: 'err', text: 'Something went wrong.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <h2 className="font-semibold text-gray-900">Create a Mission</h2>
      <p className="text-sm text-gray-500 -mt-2">Same fields as one import row. The framework and module are created if they don&apos;t exist.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={LBL}>Framework *</label><input className={INPUT} value={form.framework} onChange={(e) => set('framework', e.target.value)} /></div>
        <div><label className={LBL}>Module *</label><input className={INPUT} value={form.module} onChange={(e) => set('module', e.target.value)} placeholder="e.g. Google Business Profile" /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className={LBL}>Week</label><input type="number" className={INPUT} value={form.weekNumber} onChange={(e) => set('weekNumber', e.target.value)} /></div>
        <div><label className={LBL}>Day</label><input type="number" className={INPUT} value={form.dayNumber} onChange={(e) => set('dayNumber', e.target.value)} /></div>
        <div><label className={LBL}>Mission #</label><input type="number" className={INPUT} value={form.missionNumber} onChange={(e) => set('missionNumber', e.target.value)} /></div>
      </div>
      <div><label className={LBL}>Category</label><input className={INPUT} value={form.category} onChange={(e) => set('category', e.target.value)} /></div>
      <div><label className={LBL}>Purpose (why this matters)</label><textarea className={`${INPUT} h-16`} value={form.purpose} onChange={(e) => set('purpose', e.target.value)} /></div>
      <div><label className={LBL}>Mission (execution objective) *</label><textarea className={`${INPUT} h-16`} value={form.missionText} onChange={(e) => set('missionText', e.target.value)} /></div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div><label className={LBL}>Video URL</label><input className={INPUT} value={form.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} /></div>
        <div><label className={LBL}>PDF URL</label><input className={INPUT} value={form.pdfUrl} onChange={(e) => set('pdfUrl', e.target.value)} /></div>
        <div><label className={LBL}>External Link</label><input className={INPUT} value={form.externalLink} onChange={(e) => set('externalLink', e.target.value)} /></div>
      </div>

      <div><label className={LBL}>AI system prompt</label><textarea className={`${INPUT} h-16 font-mono`} value={form.gptPrompt} onChange={(e) => set('gptPrompt', e.target.value)} placeholder="You are helping this doctor complete this mission. Stay on task." /></div>

      <div className="grid grid-cols-2 gap-4">
        <div><label className={LBL}>Button 1 label</label><input className={INPUT} value={form.b1l} onChange={(e) => set('b1l', e.target.value)} placeholder="Open GBP" /></div>
        <div><label className={LBL}>Button 1 URL</label><input className={INPUT} value={form.b1u} onChange={(e) => set('b1u', e.target.value)} /></div>
        <div><label className={LBL}>Button 2 label</label><input className={INPUT} value={form.b2l} onChange={(e) => set('b2l', e.target.value)} /></div>
        <div><label className={LBL}>Button 2 URL</label><input className={INPUT} value={form.b2u} onChange={(e) => set('b2u', e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LBL}>Evidence required</label>
          <select className={INPUT} value={form.evidenceRequired} onChange={(e) => set('evidenceRequired', e.target.value)}>
            <option value="none">No proof required</option>
            <option value="image">Screenshot / image</option>
            <option value="text">Text statement</option>
            <option value="url">Web link / URL</option>
            <option value="pdf">PDF</option>
            <option value="document">Document</option>
          </select>
        </div>
        <div><label className={LBL}>Reward points (XP)</label><input type="number" className={INPUT} value={form.rewardPoints} onChange={(e) => set('rewardPoints', e.target.value)} /></div>
      </div>
      <div><label className={LBL}>Celebration message</label><input className={INPUT} value={form.celebrationMessage} onChange={(e) => set('celebrationMessage', e.target.value)} placeholder="Great work! Your clinic is on the map." /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={LBL}>KPI fields (comma or ; separated)</label><input className={INPUT} value={form.kpiFields} onChange={(e) => set('kpiFields', e.target.value)} placeholder="Google Reviews, Instagram Followers" /></div>
        <div><label className={LBL}>Unlock delay (days)</label><input type="number" className={INPUT} value={form.unlockDelayDays} onChange={(e) => set('unlockDelayDays', e.target.value)} /></div>
      </div>

      {msg && (
        <p className={`text-sm ${msg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
          {msg.text} {msg.frameworkId && <Link href={`/dashboard/practice-os/frameworks/${msg.frameworkId}`} className="underline">View framework</Link>}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <button onClick={() => setForm(EMPTY)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">Reset</button>
        <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
          {saving ? 'Saving…' : 'Create & Publish Mission'}
        </button>
      </div>
    </div>
  );
}

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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">New Framework</h2>
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
