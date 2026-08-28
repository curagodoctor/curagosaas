'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import PosNav from '@/components/practice-os/PosNav';

const STATUSES = [
  { key: 'idea', label: 'Idea', color: '#9ca3af' },
  { key: 'approved', label: 'Approved', color: '#F26A1B' },
  { key: 'scheduled', label: 'Scheduled', color: '#3B82F6' },
  { key: 'posted', label: 'Posted', color: '#096B17' },
];

function PlannerInner() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null); // expanded item id

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/practice-os/documents?kind=reel', { credentials: 'include' });
      const d = await res.json();
      if (d.success) setItems(d.documents || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const patch = async (id, body) => {
    setItems((arr) => arr.map((x) => x._id === id ? { ...x, ...body } : x));
    await fetch(`/api/practice-os/documents/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
  };
  const remove = async (id) => {
    if (!confirm('Remove this reel from the planner?')) return;
    setItems((arr) => arr.filter((x) => x._id !== id));
    await fetch(`/api/practice-os/documents/${id}`, { method: 'DELETE', credentials: 'include' });
  };

  const byStatus = (s) => items.filter((i) => (i.status || 'idea') === s);

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 pt-[64px] pb-6 max-w-[1100px] mx-auto">
      <PosNav breadcrumb="Content Planner" />
      <p className="pos-label mb-2">Content Planner</p>
      <h1 className="text-[30px] md:text-[38px] font-semibold text-[var(--ink)] leading-tight" style={{ letterSpacing: '-0.027em' }}>Content Planner</h1>
      <p className="text-[16px] text-[var(--muted)] mt-3 leading-relaxed" style={{ maxWidth: '54ch' }}>
        Reel scripts the assistant drafted, ready to plan. Move each through Idea → Approved → Scheduled → Posted, and set the date you&apos;ll publish.
      </p>

      {loading ? (
        <div className="mt-10 text-center text-[var(--muted)]">Loading…</div>
      ) : items.length === 0 ? (
        <div className="pos-card p-10 text-center text-[var(--muted)] mt-8">
          No reels yet. In a mission, ask the assistant for a reel script, then hit <strong>Send to Content Planner</strong>.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 items-start">
          {STATUSES.map((s) => (
            <div key={s.key}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <p className="pos-label">{s.label} <span className="text-[var(--muted)]">· {byStatus(s.key).length}</span></p>
              </div>
              <div className="space-y-3">
                {byStatus(s.key).map((it) => (
                  <div key={it._id} className="pos-card p-4">
                    <p className="text-[14px] font-medium text-[var(--ink)] leading-snug">{it.title}</p>
                    {open === it._id ? (
                      <p className="text-[12.5px] text-[var(--muted)] mt-1.5 whitespace-pre-wrap">{it.preview}</p>
                    ) : (
                      <p className="text-[12.5px] text-[var(--muted)] mt-1 line-clamp-2">{it.preview}</p>
                    )}
                    <button onClick={() => setOpen(open === it._id ? null : it._id)} className="pos-link text-[11px] mt-1">{open === it._id ? 'Less' : 'More'}</button>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <select value={it.status || 'idea'} onChange={(e) => patch(it._id, { status: e.target.value })}
                        className="text-[12px] pos-card px-2 py-1">
                        {STATUSES.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
                      </select>
                      <input type="date" value={it.plannedFor || ''} onChange={(e) => patch(it._id, { plannedFor: e.target.value })}
                        className="text-[12px] pos-card px-2 py-1" />
                      <button onClick={() => remove(it._id)} className="text-[11px] text-red-600 ml-auto">Remove</button>
                    </div>
                  </div>
                ))}
                {byStatus(s.key).length === 0 && <p className="text-[12px] text-[var(--muted)]">—</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlannerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>}>
      <PlannerInner />
    </Suspense>
  );
}
