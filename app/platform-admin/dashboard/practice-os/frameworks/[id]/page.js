'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Pack (framework) settings the doctor-facing catalog reads: price, publish
// state, tagline, summary, and outcomes. A pack must be Published (and have a
// price, unless free) to appear in the catalog and be purchasable.
function PackSettings({ framework, onSaved }) {
  const [form, setForm] = useState({
    tagline: framework.tagline || '',
    summary: framework.summary || '',
    category: framework.category || '',
    priceInInr: framework.priceInInr ?? 0,
    isPublished: !!framework.isPublished,
    outcomes: (framework.outcomes || []).join('\n'),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      const res = await fetch(`/api/platform/practice-os/frameworks/${framework._id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagline: form.tagline,
          summary: form.summary,
          category: form.category,
          priceInInr: Number(form.priceInInr) || 0,
          isPublished: form.isPublished,
          outcomes: form.outcomes.split('\n').map((o) => o.trim()).filter(Boolean),
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-medium text-gray-500 uppercase">Category</span>
          <input value={form.category} onChange={(e) => set('category', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Get found on Google" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-500 uppercase">Price (₹) — 0 = free</span>
          <input type="number" min="0" value={form.priceInInr} onChange={(e) => set('priceInInr', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
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

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving…' : 'Save pack settings'}
        </button>
        {saved && <span className="text-sm text-green-600">Saved ✓</span>}
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
        <Link href="/dashboard/practice-os" className="text-sm text-blue-600 hover:underline">← Back to Practice OS</Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{framework.title}</h1>
          <p className="text-gray-500">{framework.category || 'No category'} · {modules.length} modules · {missions.length} missions</p>
        </div>
        <button onClick={handleDeleteFramework} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium">
          Delete Builder Pack
        </button>
      </div>

      <PackSettings framework={framework} onSaved={load} />

      {missions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
          No missions yet. Import them from the Practice OS home page.
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {byWeek[week].sort((a, b) => a.dayNumber - b.dayNumber).map((m) => (
                  <tr key={m._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-500">{m.missionNumber}</td>
                    <td className="px-6 py-3 text-gray-600">Day {m.dayNumber}</td>
                    <td className="px-6 py-3 text-gray-600">{moduleName(m.moduleId)}</td>
                    <td className="px-6 py-3">
                      <Link href={`/dashboard/practice-os/missions/${m._id}`} className="text-blue-600 hover:underline">
                        {m.missionText?.slice(0, 60) || 'Untitled'}{m.missionText?.length > 60 ? '…' : ''}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{m.category || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'
                      }`}>
                        {m.status === 'draft' ? 'Draft' : 'Published'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
