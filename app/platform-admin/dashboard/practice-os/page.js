'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const TABS = [
  { id: 'import', label: 'Bulk Upload' },
  { id: 'curriculum', label: 'Builder Packs' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'doctors', label: 'Doctors' },
  { id: 'settings', label: 'Settings' },
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

      {tab === 'import' && <BulkUpload onImported={loadFrameworks} />}
      {tab === 'curriculum' && (
        <CurriculumTab frameworks={frameworks} loading={loading} onNew={() => setShowNew(true)} />
      )}
      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'doctors' && <DoctorsTab />}
      {tab === 'settings' && <SettingsTab />}

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
        <h2 className="font-semibold text-gray-900">Builder Packs</h2>
        <button onClick={onNew} className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium">New Builder Pack</button>
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
            ) : frameworks.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No builder packs yet. Use <strong>Bulk Upload</strong> to import one.</td></tr>
            ) : (
              frameworks.map((fw) => (
                <tr key={fw._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/practice-os/frameworks/${fw._id}`} className="text-blue-600 hover:underline font-medium">{fw.title}</Link>
                  </td>
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
        <p className="text-sm text-gray-500">Click a doctor to see their full Practice OS record.</p>
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
