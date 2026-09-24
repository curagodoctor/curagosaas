'use client';

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import PosNav from '@/components/practice-os/PosNav';

// The Content Planner — a day-wise content calendar with AI. Doctors capture
// ideas, refine them into scripts with the assistant, schedule them onto days,
// set reminders, and mark them posted. Backed by PracticeOsDocument (kind=reel).
const STATUSES = [
  { key: 'idea', label: 'Idea', color: '#9ca3af' },
  { key: 'script', label: 'Script', color: '#F26A1B' },
  { key: 'scheduled', label: 'Scheduled', color: '#3B82F6' },
  { key: 'posted', label: 'Posted', color: '#096B17' },
];
// Older items used 'approved' — show them under Script.
const normStatus = (s) => (s === 'approved' ? 'script' : (s || 'idea'));
const statusMeta = (s) => STATUSES.find((x) => x.key === normStatus(s)) || STATUSES[0];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Local YYYY-MM-DD (no UTC shift).
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function PlannerInner() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('calendar'); // calendar | board
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [newIdea, setNewIdea] = useState('');
  const [editing, setEditing] = useState(null); // the item object being edited (in modal)
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/practice-os/documents?kind=reel', { credentials: 'include' });
      const d = await res.json();
      if (d.success) setItems(d.documents || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const addIdea = async (plannedFor = '') => {
    const title = newIdea.trim();
    if (!title || creating) return;
    setCreating(true);
    try {
      const res = await fetch('/api/practice-os/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ kind: 'reel', title, status: 'idea', plannedFor }),
      });
      const d = await res.json();
      if (d.success && d.document) { setItems((a) => [{ ...d.document, kind: 'reel' }, ...a]); setNewIdea(''); }
    } catch { /* ignore */ } finally { setCreating(false); }
  };

  const patch = async (id, body) => {
    setItems((arr) => arr.map((x) => x._id === id ? { ...x, ...body } : x));
    setEditing((e) => (e && e._id === id ? { ...e, ...body } : e));
    await fetch(`/api/practice-os/documents/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
  };
  const remove = async (id) => {
    setItems((arr) => arr.filter((x) => x._id !== id));
    setEditing(null);
    await fetch(`/api/practice-os/documents/${id}`, { method: 'DELETE', credentials: 'include' });
  };

  const byStatus = (s) => items.filter((i) => normStatus(i.status) === s);
  const unscheduled = items.filter((i) => !i.plannedFor);
  const itemsByDay = useMemo(() => {
    const m = {};
    for (const it of items) { if (it.plannedFor) (m[it.plannedFor] = m[it.plannedFor] || []).push(it); }
    return m;
  }, [items]);

  // Build the month grid (weeks of Date cells covering the visible month).
  const weeks = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first); start.setDate(1 - first.getDay()); // back to Sunday
    const cells = [];
    for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); cells.push(d); }
    const rows = [];
    for (let w = 0; w < 6; w++) rows.push(cells.slice(w * 7, w * 7 + 7));
    // Drop a trailing all-next-month week for a tighter grid.
    return rows.filter((row) => !row.every((d) => d.getMonth() !== cursor.getMonth()));
  }, [cursor]);

  const todayKey = ymd(new Date());

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 pt-[64px] pb-10 max-w-[1100px] mx-auto">
      <PosNav breadcrumb="Content Planner" />
      <p className="pos-label mb-2">Content Planner</p>
      <h1 className="text-[28px] md:text-[36px] font-semibold text-[var(--ink)] leading-tight" style={{ letterSpacing: '-0.027em' }}>Content Planner</h1>
      <p className="text-[15px] text-[var(--muted)] mt-2.5 leading-relaxed" style={{ maxWidth: '58ch' }}>
        Capture ideas, refine them into scripts with the assistant, then schedule them onto a day and set a reminder. Idea → Script → Scheduled → Posted.
      </p>

      {/* Quick add + view toggle */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex-1 flex items-stretch pos-card overflow-hidden p-0">
          <input
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addIdea(); }}
            placeholder="Add a content idea…"
            className="flex-1 px-3.5 py-3 text-sm outline-none bg-transparent"
          />
          <button onClick={() => addIdea()} disabled={!newIdea.trim() || creating} className="pos-action m-1 px-4" style={{ opacity: newIdea.trim() ? 1 : 0.5 }}>Add idea</button>
        </div>
        <div className="flex rounded-[10px] overflow-hidden shrink-0" style={{ border: '1px solid var(--rule)' }}>
          {['calendar', 'board'].map((v) => (
            <button key={v} onClick={() => setView(v)} className="px-4 py-2 text-[13px] font-medium capitalize"
              style={{ background: view === v ? 'var(--green)' : 'var(--card)', color: view === v ? '#fff' : 'var(--muted)' }}>{v}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-10 text-center text-[var(--muted)]">Loading…</div>
      ) : view === 'calendar' ? (
        <>
          {/* Month header */}
          <div className="flex items-center justify-between mt-7 mb-3">
            <h2 className="text-[18px] font-semibold text-[var(--ink)]">{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))} className="pos-card w-8 h-8 grid place-items-center" aria-label="Previous month">‹</button>
              <button onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }} className="pos-card px-3 h-8 text-[13px]">Today</button>
              <button onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))} className="pos-card w-8 h-8 grid place-items-center" aria-label="Next month">›</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div style={{ minWidth: 640 }}>
              <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                {DOW.map((d) => <div key={d} className="text-[11px] font-medium text-[var(--muted)] text-center uppercase tracking-wide">{d}</div>)}
              </div>
              <div className="space-y-1.5">
                {weeks.map((row, ri) => (
                  <div key={ri} className="grid grid-cols-7 gap-1.5">
                    {row.map((d) => {
                      const key = ymd(d);
                      const inMonth = d.getMonth() === cursor.getMonth();
                      const dayItems = itemsByDay[key] || [];
                      const isToday = key === todayKey;
                      return (
                        <div key={key} className="pos-card p-1.5 min-h-[92px] flex flex-col" style={{ opacity: inMonth ? 1 : 0.45, borderColor: isToday ? 'var(--orange)' : 'var(--rule)' }}>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium" style={{ color: isToday ? 'var(--orange)' : 'var(--muted)' }}>{d.getDate()}</span>
                            {inMonth && (
                              <button onClick={() => { if (newIdea.trim()) addIdea(key); else setEditing({ _new: true, plannedFor: key, status: 'idea', title: '', content: '' }); }}
                                className="text-[14px] leading-none text-[var(--muted)] hover:text-[var(--green)]" aria-label="Add to this day">+</button>
                            )}
                          </div>
                          <div className="mt-1 space-y-1 overflow-hidden">
                            {dayItems.slice(0, 3).map((it) => {
                              const m = statusMeta(it.status);
                              return (
                                <button key={it._id} onClick={() => setEditing(it)} className="w-full text-left rounded px-1.5 py-1 text-[11px] leading-tight truncate" style={{ background: `${m.color}1a`, color: 'var(--ink)' }} title={it.title}>
                                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{ background: m.color }} />{it.title}
                                </button>
                              );
                            })}
                            {dayItems.length > 3 && <p className="text-[10px] text-[var(--muted)] px-1">+{dayItems.length - 3} more</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Backlog — unscheduled ideas/scripts */}
          <div className="mt-8">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">Not yet scheduled <span className="text-[var(--muted)]">· {unscheduled.length}</span></h2>
            {unscheduled.length === 0 ? (
              <p className="text-[13px] text-[var(--muted)]">Everything is on the calendar. Add an idea above to start another.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {unscheduled.map((it) => <ItemCard key={it._id} it={it} onOpen={() => setEditing(it)} />)}
              </div>
            )}
          </div>
        </>
      ) : (
        // BOARD view — the pipeline as columns.
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 items-start">
          {STATUSES.map((s) => (
            <div key={s.key}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <p className="pos-label">{s.label} <span className="text-[var(--muted)]">· {byStatus(s.key).length}</span></p>
              </div>
              <div className="space-y-3">
                {byStatus(s.key).map((it) => <ItemCard key={it._id} it={it} onOpen={() => setEditing(it)} />)}
                {byStatus(s.key).length === 0 && <p className="text-[12px] text-[var(--muted)]">—</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ItemModal
          item={editing}
          onClose={() => setEditing(null)}
          onPatch={patch}
          onRemove={remove}
          onCreated={(doc) => { setItems((a) => [{ ...doc, kind: 'reel' }, ...a]); setEditing(doc); }}
        />
      )}
    </div>
  );
}

function ItemCard({ it, onOpen }) {
  const m = statusMeta(it.status);
  return (
    <button onClick={onOpen} className="pos-card p-4 text-left w-full hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="pos-label" style={{ color: m.color }}>{m.label}</span>
        {it.plannedFor && <span className="text-[11px] text-[var(--muted)]">· {new Date(it.plannedFor + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
      </div>
      <p className="text-[14px] font-medium text-[var(--ink)] leading-snug">{it.title}</p>
      {it.preview && <p className="text-[12.5px] text-[var(--muted)] mt-1 line-clamp-2">{it.preview}</p>}
    </button>
  );
}

function ItemModal({ item, onClose, onPatch, onRemove, onCreated }) {
  const isNew = !!item._new;
  const [title, setTitle] = useState(item.title || '');
  const [content, setContent] = useState(item.content || '');
  const [status, setStatus] = useState(normStatus(item.status));
  const [plannedFor, setPlannedFor] = useState(item.plannedFor || '');
  const [remindAt, setRemindAt] = useState(item.remindAt ? String(item.remindAt).slice(0, 10) : '');
  const [saving, setSaving] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setSaving(true); setErr('');
    try {
      if (isNew) {
        const res = await fetch('/api/practice-os/documents', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ kind: 'reel', title: title.trim() || 'Untitled idea', content, status, plannedFor, remindAt: remindAt || null }),
        });
        const d = await res.json();
        if (d.success && d.document) { onCreated({ ...d.document, kind: 'reel' }); onClose(); return; }
        setErr(d.error || 'Could not save.');
      } else {
        await onPatch(item._id, { title: title.trim() || 'Untitled', content, status, plannedFor, remindAt: remindAt || null });
        onClose();
      }
    } catch { setErr('Something went wrong.'); } finally { setSaving(false); }
  };

  const refine = async () => {
    if (isNew) { setErr('Save the idea first, then refine it into a script.'); return; }
    setDrafting(true); setErr('');
    try {
      const res = await fetch(`/api/practice-os/documents/${item._id}/draft-script`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ format: 'reel' }),
      });
      const d = await res.json();
      if (d.success && d.document) {
        setTitle(d.document.title || title);
        setContent(d.document.content || content);
        setStatus(normStatus(d.document.status));
        onPatch(item._id, { title: d.document.title, content: d.document.content, status: d.document.status, preview: (d.document.content || '').slice(0, 140) });
      } else if (d.error === 'PaymentRequired') {
        setErr('Refining ideas with AI needs an active plan.');
      } else if (d.error === 'NoCredits') {
        setErr(d.message || "You've used today's AI credits.");
      } else setErr(d.error || 'Could not draft a script.');
    } catch { setErr('The assistant is unavailable right now.'); } finally { setDrafting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5" style={{ background: 'rgba(16,26,19,.45)' }} onClick={onClose}>
      <div className="pos-card w-full sm:max-w-lg p-5 sm:p-6 max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-2xl" style={{ background: 'var(--card)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="pos-label" style={{ color: statusMeta(status).color }}>{isNew ? 'New content' : statusMeta(status).label}</p>
          <button onClick={onClose} className="text-[var(--muted)] text-xl leading-none" aria-label="Close">×</button>
        </div>

        <label className="pos-label">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's the idea?" className="w-full pos-card p-2.5 text-sm mt-1.5 mb-4" />

        <div className="flex items-center justify-between mb-1.5">
          <label className="pos-label">Script</label>
          <button onClick={refine} disabled={drafting} className="text-[12px] font-semibold" style={{ color: 'var(--orange)' }}>
            {drafting ? 'Drafting…' : '✨ Refine into a script'}
          </button>
        </div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Your script, or refine the idea with the assistant." rows={7} className="w-full pos-card p-2.5 text-sm mb-4" style={{ resize: 'vertical', lineHeight: 1.6 }} />

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="pos-label">Stage</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full pos-card p-2.5 text-sm mt-1.5">
              {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="pos-label">Scheduled for</label>
            <input type="date" value={plannedFor} onChange={(e) => setPlannedFor(e.target.value)} className="w-full pos-card p-2.5 text-sm mt-1.5" />
          </div>
        </div>

        <div className="mb-5">
          <label className="pos-label">Remind me</label>
          <input type="date" value={remindAt} onChange={(e) => setRemindAt(e.target.value)} className="w-full pos-card p-2.5 text-sm mt-1.5" />
          <p className="text-[11px] text-[var(--muted)] mt-1">We&apos;ll nudge you on this day — e.g. set it a few days before you want to record.</p>
        </div>

        {err && <p className="text-[13px] text-red-600 mb-3">{err}</p>}

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving} className="pos-action flex-1">{saving ? 'Saving…' : isNew ? 'Add to planner' : 'Save'}</button>
          {!isNew && <button onClick={() => onRemove(item._id)} className="text-[13px] text-red-600 px-3">Delete</button>}
        </div>
      </div>
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
