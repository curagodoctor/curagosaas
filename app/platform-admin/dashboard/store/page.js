'use client';

import { useState, useEffect, useCallback } from 'react';

const INPUT = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600/30';
const LBL = 'block text-xs font-semibold text-gray-600 mb-1';
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Upload a file straight to GCS via a signed URL. kind: 'book' | 'video' | 'cover'.
function Uploader({ kind, value, onChange, accept, label }) {
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState('');

  const pick = async (file) => {
    if (!file) return;
    setErr(''); setBusy(true); setPct(0);
    try {
      const res = await fetch('/api/platform/store/upload-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size, kind }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || 'Upload could not start');
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', d.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setPct(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed')));
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(file);
      });
      onChange({ gsUri: d.gsUri, fileType: (file.name.split('.').pop() || d.fileType || '').toLowerCase() });
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div>
      {label && <label className={LBL}>{label}</label>}
      <div className="flex items-center gap-3">
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm cursor-pointer hover:bg-gray-50">
          <input type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files?.[0])} disabled={busy} />
          {busy ? `Uploading ${pct}%` : value ? 'Replace file' : 'Choose file'}
        </label>
        {value && !busy && <span className="text-xs text-green-700">✓ uploaded</span>}
      </div>
      {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
    </div>
  );
}

const emptyProduct = () => ({ title: '', type: 'book', summary: '', description: '', priceInInr: 0, coverImage: '', fileRef: '', fileType: '', lessons: [], isPublished: false, order: 0 });

function ProductForm({ initial, onSave, onCancel, saving }) {
  const [p, setP] = useState(initial);
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }));
  const setLesson = (i, k, v) => setP((s) => ({ ...s, lessons: s.lessons.map((l, j) => (j === i ? { ...l, [k]: v } : l)) }));
  const addLesson = () => setP((s) => ({ ...s, lessons: [...s.lessons, { title: '', videoRef: '', durationLabel: '' }] }));
  const removeLesson = (i) => setP((s) => ({ ...s, lessons: s.lessons.filter((_, j) => j !== i) }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className={LBL}>Title</label><input className={INPUT} value={p.title} onChange={(e) => set('title', e.target.value)} placeholder="Zero to Practice" /></div>
        <div>
          <label className={LBL}>Type</label>
          <select className={INPUT} value={p.type} onChange={(e) => set('type', e.target.value)}>
            <option value="book">Book (PDF / DOCX / TXT)</option>
            <option value="course">Video course</option>
          </select>
        </div>
      </div>
      <div><label className={LBL}>Short summary (card)</label><input className={INPUT} value={p.summary} onChange={(e) => set('summary', e.target.value)} placeholder="One line shown on the store card" /></div>
      <div><label className={LBL}>Description</label><textarea className={INPUT} rows={3} value={p.description} onChange={(e) => set('description', e.target.value)} /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className={LBL}>Price (₹, final — GST inclusive; 0 = free)</label><input type="number" className={INPUT} value={p.priceInInr} onChange={(e) => set('priceInInr', Number(e.target.value))} /></div>
        <Uploader kind="cover" label="Cover image" accept="image/*" value={p.coverImage} onChange={({ gsUri }) => set('coverImage', gsUri)} />
      </div>

      {p.type === 'book' ? (
        <div className="p-3 bg-gray-50 rounded-lg">
          <Uploader kind="book" label="Book file (PDF / DOCX / TXT)" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            value={p.fileRef} onChange={({ gsUri, fileType }) => setP((s) => ({ ...s, fileRef: gsUri, fileType }))} />
          <p className="text-[11px] text-gray-500 mt-1">The file is extracted into an in-app reader on save. The original is never downloadable by buyers.</p>
        </div>
      ) : (
        <div className="p-3 bg-gray-50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Lessons</span>
            <button type="button" onClick={addLesson} className="text-sm text-green-700 font-semibold">+ Add lesson</button>
          </div>
          {p.lessons.length === 0 && <p className="text-xs text-gray-500">No lessons yet.</p>}
          {p.lessons.map((l, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-end border-b border-gray-200 pb-3">
              <div><label className={LBL}>Lesson {i + 1} title</label><input className={INPUT} value={l.title} onChange={(e) => setLesson(i, 'title', e.target.value)} /></div>
              <Uploader kind="video" label="Video" accept="video/*" value={l.videoRef} onChange={({ gsUri }) => setLesson(i, 'videoRef', gsUri)} />
              <div className="flex items-end gap-2">
                <div><label className={LBL}>Duration</label><input className={INPUT + ' w-24'} value={l.durationLabel} onChange={(e) => setLesson(i, 'durationLabel', e.target.value)} placeholder="12 min" /></div>
                <button type="button" onClick={() => removeLesson(i)} className="text-red-600 text-sm pb-2">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.isPublished} onChange={(e) => set('isPublished', e.target.checked)} /> Published (visible on the public store)</label>

      <div className="flex gap-3 pt-2">
        <button disabled={saving || !p.title} onClick={() => onSave(p)} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">{saving ? 'Saving…' : 'Save product'}</button>
        <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
      </div>
    </div>
  );
}

export default function StoreAdminPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // product object or 'new'
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await (await fetch('/api/platform/store/products')).json(); if (d.success) setProducts(d.products || []); } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    setSaving(true);
    try {
      const isNew = editing === 'new';
      const url = isNew ? '/api/platform/store/products' : `/api/platform/store/products/${editing._id}`;
      const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!d.success) { alert(d.error || 'Save failed'); return; }
      setEditing(null); await load();
    } finally { setSaving(false); }
  };

  const remove = async (p) => {
    if (!confirm(`Delete "${p.title}"? Existing buyers keep their purchase record.`)) return;
    await fetch(`/api/platform/store/products/${p._id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store</h1>
          <p className="text-sm text-gray-500">Books &amp; video courses sold on the public store. Buyers access them securely in their account.</p>
        </div>
        {!editing && <button onClick={() => setEditing('new')} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-semibold">+ New product</button>}
      </div>

      {editing ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">{editing === 'new' ? 'New product' : `Edit — ${editing.title}`}</h2>
          <ProductForm initial={editing === 'new' ? emptyProduct() : { ...emptyProduct(), ...editing, lessons: editing.lessons || [] }} onSave={save} onCancel={() => setEditing(null)} saving={saving} />
        </div>
      ) : loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : products.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-500">No products yet. Create your first book or course.</div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p._id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 truncate">{p.title}</span>
                  <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{p.type}</span>
                  {p.isPublished ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">Published</span> : <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Draft</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1">{p.priceInInr > 0 ? inr(p.priceInInr) : 'Free'} · {p.buyers || 0} buyers{p.type === 'course' ? ` · ${p.lessons?.length || 0} lessons` : ''}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setEditing(p)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg">Edit</button>
                <button onClick={() => remove(p)} className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
