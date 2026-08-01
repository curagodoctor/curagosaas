'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const LABEL = 'block text-sm font-medium text-gray-700 mb-1';
const INPUT = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500';
const EVIDENCE_TYPES = ['image', 'pdf', 'document', 'url', 'text'];

export default function MissionEditorPage() {
  const { id } = useParams();
  const [m, setM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [unlockEmail, setUnlockEmail] = useState('');
  const [unlockMsg, setUnlockMsg] = useState(null);
  const [unlocking, setUnlocking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/platform/practice-os/missions/${id}`);
      const json = await res.json();
      if (json.success) setM(json.mission);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const set = (patch) => setM((prev) => ({ ...prev, ...patch }));

  const patch = async (fields) => {
    const res = await fetch(`/api/platform/practice-os/missions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    return res.json();
  };

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const json = await patch(m);
      setMsg(json.success ? { type: 'ok', text: 'Saved.' } : { type: 'err', text: json.error || 'Save failed' });
    } catch {
      setMsg({ type: 'err', text: 'Something went wrong.' });
    } finally {
      setSaving(false);
    }
  };

  const handleUnlock = async () => {
    if (!unlockEmail.trim()) return;
    setUnlocking(true); setUnlockMsg(null);
    try {
      const res = await fetch(`/api/platform/practice-os/missions/${id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorEmail: unlockEmail.trim() }),
      });
      const json = await res.json();
      setUnlockMsg(json.success ? { type: 'ok', text: json.message } : { type: 'err', text: json.error || 'Failed' });
      if (json.success) setUnlockEmail('');
    } catch {
      setUnlockMsg({ type: 'err', text: 'Something went wrong.' });
    } finally {
      setUnlocking(false);
    }
  };

  const togglePublish = async () => {
    const next = m.status === 'published' ? 'draft' : 'published';
    setMsg(null);
    const json = await patch({ status: next });
    if (json.success) {
      set({ status: next });
      setMsg({ type: 'ok', text: next === 'published' ? 'Published.' : 'Unpublished.' });
    } else {
      setMsg({ type: 'err', text: json.error || 'Failed to update publish state' });
    }
  };

  if (loading) return <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
  if (!m) return <div className="text-center py-24 text-gray-500">Mission not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/dashboard/practice-os/frameworks/${m.frameworkId}`} className="text-sm text-blue-600 hover:underline">← Back to framework</Link>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            m.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {m.status === 'published' ? 'Published' : 'Draft'}
          </span>
          <button
            onClick={togglePublish}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              m.status === 'published'
                ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {m.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={m.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
          Active
        </label>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Edit Mission</h1>

      {/* Position */}
      <Section title="Position">
        <div className="grid grid-cols-3 gap-4">
          <div><label className={LABEL}>Week</label><input type="number" className={INPUT} value={m.weekNumber} onChange={(e) => set({ weekNumber: Number(e.target.value) })} /></div>
          <div><label className={LABEL}>Day</label><input type="number" className={INPUT} value={m.dayNumber} onChange={(e) => set({ dayNumber: Number(e.target.value) })} /></div>
          <div><label className={LABEL}>Mission #</label><input type="number" className={INPUT} value={m.missionNumber} onChange={(e) => set({ missionNumber: Number(e.target.value) })} /></div>
        </div>
      </Section>

      {/* Content */}
      <Section title="Content">
        <div><label className={LABEL}>Category</label><input className={INPUT} value={m.category} onChange={(e) => set({ category: e.target.value })} /></div>
        <div className="mt-4"><label className={LABEL}>Purpose</label><textarea rows={2} className={INPUT} value={m.purpose} onChange={(e) => set({ purpose: e.target.value })} /></div>
        <div className="mt-4"><label className={LABEL}>Task (the day&apos;s objective)</label><textarea rows={3} className={INPUT} value={m.missionText} onChange={(e) => set({ missionText: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className={LABEL}>Visibility Score component</label>
            <select className={INPUT} value={m.scoreComponent || 'none'} onChange={(e) => set({ scoreComponent: e.target.value })}>
              <option value="none">None</option>
              <option value="gbp">Google Business Profile</option>
              <option value="reviews">Reviews</option>
              <option value="website">Website</option>
              <option value="systems">Systems</option>
              <option value="social">Social presence</option>
            </select>
          </div>
          <div><label className={LABEL}>Estimated minutes</label><input type="number" className={INPUT} value={m.estimatedMinutes ?? 35} onChange={(e) => set({ estimatedMinutes: Number(e.target.value) })} /></div>
        </div>
        <div className="mt-4">
          <label className={LABEL}>Sub-steps (one per line)</label>
          <textarea rows={3} className={INPUT} value={(m.subSteps || []).join('\n')} onChange={(e) => set({ subSteps: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
        </div>
      </Section>

      {/* Lecture */}
      <Section title="Lecture">
        <label className={LABEL}>Lecture text (short, 3–5 min read — optional)</label>
        <textarea rows={3} className={INPUT} value={m.lecture || ''} onChange={(e) => set({ lecture: e.target.value })} />
        <div className="mt-4">
          <label className={LABEL}>Lecture video</label>
          <VideoUpload value={m.lectureVideoUrl || ''} onChange={(url) => set({ lectureVideoUrl: url })} />
        </div>
      </Section>

      {/* Education */}
      <Section title="Education Resources">
        <ArrayEditor
          items={m.education}
          onChange={(education) => set({ education })}
          empty={{ type: 'link', label: '', url: '' }}
          render={(item, upd) => (
            <div className="grid grid-cols-12 gap-2 items-start">
              <select className={`${INPUT} col-span-3`} value={item.type} onChange={(e) => upd({ type: e.target.value })}>
                {['video', 'pdf', 'link', 'checklist', 'template'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input className={`${INPUT} col-span-3`} placeholder="Label" value={item.label} onChange={(e) => upd({ label: e.target.value })} />
              <div className="col-span-6">
                <input className={INPUT} placeholder="URL" value={item.url} onChange={(e) => upd({ url: e.target.value })} />
                {item.type === 'video' && (
                  <div className="mt-2"><VideoUpload value={item.url} onChange={(url) => upd({ url })} compact /></div>
                )}
              </div>
            </div>
          )}
        />
      </Section>

      {/* Buttons */}
      <Section title="Action Buttons">
        <ArrayEditor
          items={m.buttons}
          onChange={(buttons) => set({ buttons })}
          empty={{ label: '', url: '' }}
          render={(item, upd) => (
            <div className="grid grid-cols-2 gap-2">
              <input className={INPUT} placeholder="Label" value={item.label} onChange={(e) => upd({ label: e.target.value })} />
              <input className={INPUT} placeholder="URL" value={item.url} onChange={(e) => upd({ url: e.target.value })} />
            </div>
          )}
        />
      </Section>

      {/* AI */}
      <Section title="AI Assistant">
        <label className={LABEL}>System Prompt (scope this mission&apos;s assistant)</label>
        <textarea rows={4} className={INPUT} value={m.aiContext?.systemPrompt || ''} onChange={(e) => set({ aiContext: { ...m.aiContext, systemPrompt: e.target.value } })} />
      </Section>

      {/* Evidence */}
      <Section title="Evidence">
        <label className="flex items-center gap-2 text-sm text-gray-700 mb-3">
          <input type="checkbox" checked={m.evidence?.required} onChange={(e) => set({ evidence: { ...m.evidence, required: e.target.checked } })} />
          Evidence required to complete
        </label>
        <div className="flex flex-wrap gap-3">
          {EVIDENCE_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-1.5 text-sm text-gray-600">
              <input type="checkbox"
                checked={m.evidence?.allowedTypes?.includes(t)}
                onChange={(e) => {
                  const cur = new Set(m.evidence?.allowedTypes || []);
                  e.target.checked ? cur.add(t) : cur.delete(t);
                  set({ evidence: { ...m.evidence, allowedTypes: [...cur] } });
                }} />
              {t}
            </label>
          ))}
        </div>
      </Section>

      {/* KPIs */}
      <Section title="KPI Fields">
        <ArrayEditor
          items={m.kpiFields}
          onChange={(kpiFields) => set({ kpiFields })}
          empty={{ key: '', label: '', unit: '' }}
          render={(item, upd) => (
            <div className="grid grid-cols-3 gap-2">
              <input className={INPUT} placeholder="key" value={item.key} onChange={(e) => upd({ key: e.target.value })} />
              <input className={INPUT} placeholder="Label" value={item.label} onChange={(e) => upd({ label: e.target.value })} />
              <input className={INPUT} placeholder="unit" value={item.unit} onChange={(e) => upd({ unit: e.target.value })} />
            </div>
          )}
        />
      </Section>

      {/* Reward + unlock */}
      <Section title="Reward & Unlock">
        <div className="grid grid-cols-2 gap-4">
          <div><label className={LABEL}>XP Points</label><input type="number" className={INPUT} value={m.reward?.points ?? 0} onChange={(e) => set({ reward: { ...m.reward, points: Number(e.target.value) } })} /></div>
          <div><label className={LABEL}>Badge</label><input className={INPUT} value={m.reward?.badge || ''} onChange={(e) => set({ reward: { ...m.reward, badge: e.target.value } })} /></div>
        </div>
        <div className="mt-4"><label className={LABEL}>Celebration Message</label><input className={INPUT} value={m.reward?.message || ''} onChange={(e) => set({ reward: { ...m.reward, message: e.target.value } })} /></div>
        <div className="mt-4 w-40"><label className={LABEL}>Unlock Delay (days)</label><input type="number" className={INPUT} value={m.unlockDelayDays} onChange={(e) => set({ unlockDelayDays: Number(e.target.value) })} /></div>
      </Section>

      {/* Manual unlock */}
      <Section title="Manual Unlock (admin override)">
        <p className="text-sm text-gray-500 mb-3">Unlock this mission for a specific doctor immediately, bypassing the normal day-by-day schedule.</p>
        <div className="flex gap-2">
          <input
            type="email"
            className={INPUT}
            placeholder="doctor@email.com"
            value={unlockEmail}
            onChange={(e) => setUnlockEmail(e.target.value)}
          />
          <button
            onClick={handleUnlock}
            disabled={unlocking || !unlockEmail.trim()}
            className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50 whitespace-nowrap"
          >
            {unlocking ? 'Unlocking…' : 'Unlock'}
          </button>
        </div>
        {unlockMsg && (
          <p className={`mt-2 text-sm ${unlockMsg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{unlockMsg.text}</p>
        )}
      </Section>

      {/* Save bar */}
      <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-gray-100 py-3">
        {msg && <span className={msg.type === 'ok' ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>{msg.text}</span>}
        <button onClick={save} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
          {saving ? 'Saving…' : 'Save Mission'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

// Generic add/remove list editor for embedded arrays.
function ArrayEditor({ items = [], onChange, empty, render }) {
  const update = (i, patch) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { ...empty }]);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1">{render(item, (patch) => update(i, patch))}</div>
          <button onClick={() => remove(i)} className="p-2 text-gray-400 hover:text-red-500" title="Remove">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
      <button onClick={add} className="text-sm text-blue-600 hover:underline">+ Add</button>
    </div>
  );
}

// Upload a lecture video straight to GCS via a signed URL, or paste a URL
// (e.g. a YouTube unlisted link). Sets the resulting URL via onChange.
function VideoUpload({ value, onChange, compact }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [localPreview, setLocalPreview] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) { setError('Please choose a video file.'); return; }
    setError(''); setUploading(true); setProgress(0);
    try {
      // 1) Ask the server for a signed upload URL.
      const signRes = await fetch('/api/platform/practice-os/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
      });
      const signed = await signRes.json();
      if (!signed.success) { setError(signed.error || 'Could not start upload.'); setUploading(false); return; }

      // 2) PUT the file directly to GCS with progress.
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signed.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100)); };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(file);
      });

      // The bucket is private — store a gs:// reference; playback uses signed URLs.
      setLocalPreview(URL.createObjectURL(file));
      onChange(signed.gsUri);
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  // Preview: local object URL if just uploaded, a signed URL for a stored gs:// ref, else the raw URL.
  async function openPreview() {
    setError('');
    if (localPreview) { window.open(localPreview, '_blank'); return; }
    if (value?.startsWith('gs://')) {
      try {
        const res = await fetch(`/api/platform/practice-os/sign-read?ref=${encodeURIComponent(value)}`);
        const data = await res.json();
        if (data.success) window.open(data.url, '_blank');
        else setError(data.error || 'Preview failed.');
      } catch { setError('Preview failed.'); }
      return;
    }
    if (value) window.open(value, '_blank');
  }

  const isGcs = value?.startsWith('gs://');

  return (
    <div>
      {!compact && (
        <input className={INPUT} placeholder="Paste a video URL (e.g. YouTube unlisted) or upload below" value={value || ''} onChange={(e) => { setLocalPreview(''); onChange(e.target.value); }} />
      )}
      <div className={`flex items-center gap-3 ${compact ? '' : 'mt-2'}`}>
        <label className="text-sm text-blue-600 hover:underline cursor-pointer">
          {uploading ? `Uploading… ${progress}%` : (value ? 'Replace video' : 'Upload video to cloud')}
          <input type="file" accept="video/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
        {isGcs && !uploading && <span className="text-xs text-green-600">cloud video ✓</span>}
        {value && !uploading && (
          <>
            <button type="button" onClick={openPreview} className="text-sm text-gray-500 hover:underline">preview</button>
            <button type="button" onClick={() => { setLocalPreview(''); onChange(''); }} className="text-sm text-gray-400 hover:text-red-500">clear</button>
          </>
        )}
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
