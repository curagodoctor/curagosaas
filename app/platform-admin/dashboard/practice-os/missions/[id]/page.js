'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const LABEL = 'block text-sm font-medium text-gray-700 mb-1';
const INPUT = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500';

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
      </Section>

      {/* Modules */}
      <Section title="Modules">
        <p className="text-sm text-gray-500 mb-4">
          The rich work-units the doctor steps through in the workspace. The mission completes when all its modules are done.
        </p>
        <ModulesEditor modules={m.modules || []} onChange={(modules) => set({ modules })} />
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

      {/* Reward (Visibility Score + celebration) */}
      <Section title="Reward">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Visibility Score points</label>
            <input type="number" className={INPUT} value={m.reward?.points ?? 0} onChange={(e) => set({ reward: { ...m.reward, points: Number(e.target.value) } })} />
            <p className="mt-1 text-xs text-gray-500">Added to the mission&apos;s Visibility Score component (set above) when completed. Not the per-module XP.</p>
          </div>
          <div><label className={LABEL}>Badge (celebration)</label><input className={INPUT} value={m.reward?.badge || ''} onChange={(e) => set({ reward: { ...m.reward, badge: e.target.value } })} /></div>
        </div>
        <div className="mt-4"><label className={LABEL}>Celebration Message</label><input className={INPUT} value={m.reward?.message || ''} onChange={(e) => set({ reward: { ...m.reward, message: e.target.value } })} /></div>
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

// Editor for the ordered array of rich modules inside a mission. Each module
// keeps its persisted `_id` (when present) so edits update in place on save.
function ModulesEditor({ modules = [], onChange }) {
  const updateMod = (i, patch) =>
    onChange(modules.map((mod, idx) => (idx === i ? { ...mod, ...patch } : mod)));

  const removeMod = (i) => {
    if (!window.confirm('Delete this module? This cannot be undone until you save.')) return;
    onChange(modules.filter((_, idx) => idx !== i));
  };

  const addMod = () =>
    onChange([
      ...modules,
      {
        title: '',
        order: modules.length,
        xp: 40,
        videoUrl: '',
        expectedOutcome: '',
        prerequisites: '',
        lecture: '',
        education: [],
        steps: [],
        aiPrompt: '',
        aiPrompts: [],
        aiSystemPrompt: '',
        buttons: [],
        inputs: [],
      },
    ]);

  // Swap two modules and keep their `order` fields in sync with position.
  const swap = (a, b) => {
    if (b < 0 || b >= modules.length) return;
    const next = modules.slice();
    [next[a], next[b]] = [next[b], next[a]];
    onChange(next.map((mod, idx) => ({ ...mod, order: idx })));
  };

  return (
    <div className="space-y-4">
      {modules.map((mod, i) => (
        <div key={mod._id || i} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Module {i + 1}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => swap(i, i - 1)} disabled={i === 0} className="px-2 py-1 text-sm text-gray-600 hover:text-blue-600 disabled:opacity-30" title="Move up">↑</button>
              <button type="button" onClick={() => swap(i, i + 1)} disabled={i === modules.length - 1} className="px-2 py-1 text-sm text-gray-600 hover:text-blue-600 disabled:opacity-30" title="Move down">↓</button>
              <button type="button" onClick={() => removeMod(i)} className="px-2 py-1 text-sm text-gray-400 hover:text-red-500" title="Delete module">Delete</button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-8"><label className={LABEL}>Title</label><input className={INPUT} value={mod.title || ''} onChange={(e) => updateMod(i, { title: e.target.value })} /></div>
            <div className="col-span-4"><label className={LABEL}>XP</label><input type="number" className={INPUT} value={mod.xp ?? 40} onChange={(e) => updateMod(i, { xp: Number(e.target.value) })} /></div>
          </div>

          <div className="mt-3">
            <label className={LABEL}>Walkthrough video</label>
            <VideoUpload value={mod.videoUrl || ''} onChange={(url) => updateMod(i, { videoUrl: url })} />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div><label className={LABEL}>Expected outcome</label><textarea rows={2} className={INPUT} value={mod.expectedOutcome || ''} onChange={(e) => updateMod(i, { expectedOutcome: e.target.value })} /></div>
            <div><label className={LABEL}>Prerequisites</label><textarea rows={2} className={INPUT} value={mod.prerequisites || ''} onChange={(e) => updateMod(i, { prerequisites: e.target.value })} /></div>
          </div>

          <div className="mt-3">
            <label className={LABEL}>Lecture notes (shown before the task)</label>
            <textarea rows={3} className={INPUT} value={mod.lecture || ''} onChange={(e) => updateMod(i, { lecture: e.target.value })} />
          </div>

          <div className="mt-3">
            <label className={LABEL}>Education / resources — one per line as <span className="font-mono">Label | https://url</span></label>
            <textarea
              rows={3}
              className={INPUT}
              value={(mod.education || []).map((e) => `${e.label || ''} | ${e.url || ''}`).join('\n')}
              onChange={(e) => updateMod(i, {
                education: e.target.value.split('\n').map((line) => {
                  const [label, url] = line.split('|').map((s) => (s || '').trim());
                  return (label || url) ? { type: 'link', label: label || url, url: url || '' } : null;
                }).filter(Boolean),
              })}
            />
          </div>

          <div className="mt-3">
            <label className={LABEL}>Steps (one per line)</label>
            <textarea rows={4} className={INPUT} value={(mod.steps || []).join('\n')} onChange={(e) => updateMod(i, { steps: e.target.value.split('\n') })} />
          </div>

          <div className="mt-3">
            <label className={LABEL}>AI prompts (ready-to-copy, shown to the doctor)</label>
            <p className="text-xs text-gray-500 mb-2">Add one or more. Each prompt shows as its own copy card in the mission.</p>
            {(() => {
              const prompts = (mod.aiPrompts && mod.aiPrompts.length) ? mod.aiPrompts : (mod.aiPrompt ? [mod.aiPrompt] : ['']);
              const setPrompts = (arr) => updateMod(i, { aiPrompts: arr, aiPrompt: arr[0] || '' });
              return (
                <div className="space-y-2">
                  {prompts.map((p, pi) => (
                    <div key={pi} className="flex items-start gap-2">
                      <textarea rows={3} className={`${INPUT} flex-1`} value={p} placeholder={`Prompt ${pi + 1}`} onChange={(e) => setPrompts(prompts.map((x, xi) => (xi === pi ? e.target.value : x)))} />
                      {prompts.length > 1 && (
                        <button type="button" onClick={() => setPrompts(prompts.filter((_, xi) => xi !== pi))} className="p-2 text-gray-400 hover:text-red-500" title="Remove prompt">✕</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setPrompts([...prompts, ''])} className="text-sm text-blue-600 hover:underline">+ Add prompt</button>
                </div>
              );
            })()}
          </div>

          <div className="mt-3">
            <label className={LABEL}>Hidden assistant prompt (never shown to the doctor)</label>
            <textarea rows={3} className={INPUT} value={mod.aiSystemPrompt || ''} onChange={(e) => updateMod(i, { aiSystemPrompt: e.target.value })} />
          </div>

          <div className="mt-3">
            <label className={LABEL}>Action buttons</label>
            <p className="text-xs text-gray-500 mb-1.5">
              URL can be a link or a <span className="font-mono">{'{{profile_field}}'}</span> token — it&apos;s replaced per doctor with what they entered in My Profile.
              e.g. <span className="font-mono">{'{{gbp_link}}'}</span>, <span className="font-mono">{'{{drive_link}}'}</span>, <span className="font-mono">{'{{clinic_name}}'}</span>.
            </p>
            <ArrayEditor
              items={mod.buttons || []}
              onChange={(buttons) => updateMod(i, { buttons })}
              empty={{ label: '', url: '' }}
              render={(item, upd) => (
                <div className="grid grid-cols-2 gap-2">
                  <input className={INPUT} placeholder="Label" value={item.label} onChange={(e) => upd({ label: e.target.value })} />
                  <input className={INPUT} placeholder="https://…  or  {{gbp_link}}" value={item.url} onChange={(e) => upd({ url: e.target.value })} />
                </div>
              )}
            />
          </div>

          <div className="mt-3">
            <label className={LABEL}>Evidence inputs</label>
            <ArrayEditor
              items={mod.inputs || []}
              onChange={(inputs) => updateMod(i, { inputs })}
              empty={{ label: '', placeholder: '', required: false, variable: '' }}
              render={(item, upd) => (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <input className={`${INPUT} col-span-5`} placeholder="Label" value={item.label} onChange={(e) => upd({ label: e.target.value })} />
                    <input className={`${INPUT} col-span-5`} placeholder="Placeholder" value={item.placeholder} onChange={(e) => upd({ placeholder: e.target.value })} />
                    <label className="col-span-2 flex items-center gap-1.5 text-sm text-gray-600">
                      <input type="checkbox" checked={!!item.required} onChange={(e) => upd({ required: e.target.checked })} />
                      Required
                    </label>
                  </div>
                  <div>
                    <input className={INPUT} placeholder="e.g. gbp_link" value={item.variable || ''} onChange={(e) => upd({ variable: e.target.value })} />
                    <p className="mt-1 text-xs text-gray-500">Variable name (optional) — reuse in prompts as {'{{name}}'}</p>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      ))}
      <button type="button" onClick={addMod} className="text-sm text-blue-600 hover:underline">+ Add module</button>
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
