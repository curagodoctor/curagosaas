'use client';

import { useState, useEffect, useCallback } from 'react';

// §6 admin — manage the ordered orientation video set shown to doctors while GBP
// verification is pending. Saves the whole list to PracticeOsSettings via the
// existing settings PUT.
export default function OrientationVideosTab() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // { type, text }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/platform/practice-os/settings');
      const data = await res.json();
      if (data.success) setVideos((data.settings?.orientationVideos || []).map((v) => ({ ...v })));
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const update = (i, field, value) => setVideos((list) => list.map((v, j) => (j === i ? { ...v, [field]: value } : v)));
  const add = () => setVideos((list) => [...list, { title: '', description: '', videoUrl: '', order: list.length }]);
  const remove = (i) => setVideos((list) => list.filter((_, j) => j !== i));
  const move = (i, dir) => setVideos((list) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const copy = list.slice();
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  });

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const payload = videos.map((v, i) => ({ ...v, order: i }));
      const res = await fetch('/api/platform/practice-os/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orientationVideos: payload }),
      });
      const data = await res.json();
      if (data.success) {
        setVideos((data.settings?.orientationVideos || []).map((v) => ({ ...v })));
        setMsg({ type: 'ok', text: 'Saved. Empty rows (no title or URL) were dropped.' });
      } else setMsg({ type: 'err', text: data.error || 'Could not save.' });
    } catch { setMsg({ type: 'err', text: 'Something went wrong.' }); } finally { setSaving(false); }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Orientation videos</h2>
          <p className="text-sm text-gray-500 mt-0.5">Shown to doctors during setup (while GBP verification is pending). YouTube links or direct video URLs.</p>
        </div>
        <button onClick={add} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium whitespace-nowrap">+ Add video</button>
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-2.5 text-sm mb-4 ${msg.type === 'ok' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg.text}</div>
      )}

      {videos.length === 0 && <p className="text-sm text-gray-400 mb-4">No videos yet. Add the first one.</p>}

      <div className="space-y-4">
        {videos.map((v, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Lesson {i + 1}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="px-2 py-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" title="Move up">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === videos.length - 1} className="px-2 py-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" title="Move down">↓</button>
                <button onClick={() => remove(i)} className="px-2 py-1 text-red-500 hover:text-red-700 text-sm" title="Remove">Remove</button>
              </div>
            </div>
            <input value={v.title} onChange={(e) => update(i, 'title', e.target.value)} placeholder="Title" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2" />
            <input value={v.videoUrl} onChange={(e) => update(i, 'videoUrl', e.target.value)} placeholder="Video URL (YouTube or direct)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2" />
            <textarea value={v.description} onChange={(e) => update(i, 'description', e.target.value)} placeholder="Lecture notes (optional)" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        ))}
      </div>

      <button onClick={save} disabled={saving} className="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
        {saving ? 'Saving…' : 'Save videos'}
      </button>
    </div>
  );
}
