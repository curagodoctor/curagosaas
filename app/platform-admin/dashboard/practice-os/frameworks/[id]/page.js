'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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
    if (!confirm('Delete this framework and all its missions? This cannot be undone.')) return;
    await fetch(`/api/platform/practice-os/frameworks/${id}`, { method: 'DELETE' });
    router.push('/dashboard/practice-os');
  };

  if (loading) {
    return <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
  }
  if (!data) {
    return <div className="text-center py-24 text-gray-500">Framework not found.</div>;
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
          Delete Framework
        </button>
      </div>

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
