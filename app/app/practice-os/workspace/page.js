'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Workspace — a private, per-doctor notes app (Notes/Notion style). Text is saved
// by file name and grouped by day, autosaved as you type. Every document is
// scoped to the doctor server-side, so it's private and secure.

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}
// "Today" / "Yesterday" / weekday / date — for daywise grouping.
function dayGroup(d) {
  const date = new Date(d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dd = new Date(date); dd.setHours(0, 0, 0, 0);
  const diff = Math.round((today - dd) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return date.toLocaleDateString('en-IN', { weekday: 'long' });
  return fmtDate(d);
}
// Split a newest-first list into ordered day groups.
function groupByDay(docs) {
  const groups = [];
  let current = null;
  for (const d of docs) {
    const label = dayGroup(d.updatedAt);
    if (!current || current.label !== label) { current = { label, items: [] }; groups.push(current); }
    current.items.push(d);
  }
  return groups;
}
function wordCount(s) {
  const t = (s || '').trim();
  return t ? t.split(/\s+/).length : 0;
}

export default function WorkspacePage() {
  const router = useRouter();
  const [docs, setDocs] = useState(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | saved
  const [mobileEditor, setMobileEditor] = useState(false);

  const searchTimer = useRef(null);
  const saveTimer = useRef(null);
  const lastSaved = useRef({ title: '', content: '' }); // last persisted state, to detect dirt

  const load = useCallback(async (q = '') => {
    const res = await fetch(`/api/practice-os/documents${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
    const data = await res.json();
    setDocs(data.success ? data.documents : []);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // Debounced search.
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { load(query); }, 250);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query, load]);

  const openDoc = useCallback(async (id) => {
    const res = await fetch(`/api/practice-os/documents/${id}`);
    if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
    const data = await res.json();
    if (data.success) {
      setSelected(data.document);
      setTitle(data.document.title);
      setContent(data.document.content || '');
      lastSaved.current = { title: data.document.title, content: data.document.content || '' };
      setStatus('idle');
      setMobileEditor(true);
    }
  }, [router]);

  // New notes are created immediately (like Notes), so edits are always autosaves.
  const newDoc = useCallback(async () => {
    const res = await fetch('/api/practice-os/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled', content: '' }),
    });
    if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
    const data = await res.json();
    if (data.success) {
      setSelected(data.document);
      setTitle(data.document.title);
      setContent('');
      lastSaved.current = { title: data.document.title, content: '' };
      setStatus('idle');
      setMobileEditor(true);
      load(query);
    }
  }, [router, load, query]);

  const autosave = useCallback(async () => {
    if (!selected?._id) return;
    if (title === lastSaved.current.title && content === lastSaved.current.content) return;
    setStatus('saving');
    try {
      const res = await fetch(`/api/practice-os/documents/${selected._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
      const data = await res.json();
      if (data.success) {
        lastSaved.current = { title, content };
        setSelected((s) => (s ? { ...s, title: data.document.title, updatedAt: data.document.updatedAt } : s));
        setStatus('saved');
        load(query);
      }
    } catch {
      setStatus('idle');
    }
  }, [selected, title, content, router, load, query]);

  // Debounced autosave whenever the open document is edited.
  useEffect(() => {
    if (!selected?._id) return;
    if (title === lastSaved.current.title && content === lastSaved.current.content) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { autosave(); }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [title, content, selected, autosave]);

  const remove = useCallback(async () => {
    if (!selected?._id) { setSelected(null); setMobileEditor(false); return; }
    if (!window.confirm(`Delete "${title || 'Untitled'}"? This can't be undone.`)) return;
    const res = await fetch(`/api/practice-os/documents/${selected._id}`, { method: 'DELETE' });
    if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
    const data = await res.json();
    if (data.success) {
      setSelected(null);
      setMobileEditor(false);
      load(query);
    }
  }, [selected, title, router, load, query]);

  if (!docs) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;
  }

  const groups = groupByDay(docs);
  const statusLabel = status === 'saving' ? 'Saving…' : status === 'saved' ? 'All changes saved' : '';

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-6 max-w-[1240px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-7">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/app/practice-os" className="flex items-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/curago-logo.png" alt="CuraGo" className="h-6 w-auto" />
          </Link>
          <span className="text-[var(--rule)]">/</span>
          <span className="text-[13px] text-[var(--muted)]">Workspace</span>
        </div>
        <Link href="/app/practice-os" className="pos-link" style={{ color: 'var(--muted)' }}>← Back</Link>
      </div>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="pos-label mb-2">Workspace</p>
          <h1 className="text-[26px] md:text-[30px] font-semibold text-[var(--ink)] leading-tight" style={{ letterSpacing: '-0.027em' }}>
            Your notes
          </h1>
          <p className="text-[14.5px] text-[var(--muted)] mt-1.5 leading-relaxed" style={{ maxWidth: '54ch' }}>
            A private place to write — saved by name, grouped by day, and autosaved as you type. Only you can see these.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 lg:gap-8 mt-7">
        {/* Left — searchable, day-grouped list */}
        <div className={`min-w-0 ${mobileEditor ? 'hidden lg:block' : ''}`}>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes by name"
              className="flex-1 min-w-0 text-[14px] px-3 py-2 rounded-[8px] border bg-[var(--card)] text-[var(--ink)] outline-none focus:border-[var(--green)]"
              style={{ borderColor: 'var(--rule)' }}
            />
            <button onClick={newDoc} className="pos-action pos-focusable shrink-0 whitespace-nowrap" style={{ background: 'var(--green)' }}>
              + New
            </button>
          </div>

          {docs.length === 0 ? (
            <div className="pos-card p-8 text-center text-[var(--muted)] text-[14px]">
              {query ? 'No notes match that search.' : 'No notes yet — create your first one.'}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {groups.map((g) => (
                <div key={g.label}>
                  <p className="pos-label mb-2 px-1">{g.label}</p>
                  <div className="flex flex-col gap-2">
                    {g.items.map((d) => {
                      const active = selected && selected._id === d._id;
                      return (
                        <button
                          key={d._id}
                          onClick={() => openDoc(d._id)}
                          className="pos-card text-left p-3.5 transition-colors"
                          style={{ borderColor: active ? 'var(--green)' : 'var(--rule)', background: active ? 'var(--green-soft)' : 'var(--card)' }}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-[14.5px] font-medium text-[var(--ink)] truncate">{d.title}</p>
                            <span className="text-[11px] text-[var(--muted)] shrink-0">{fmtTime(d.updatedAt)}</span>
                          </div>
                          {d.preview && <p className="text-[12.5px] text-[var(--muted)] mt-1 line-clamp-2">{d.preview}</p>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — the editor */}
        <div className={`min-w-0 ${mobileEditor ? '' : 'hidden lg:block'}`}>
          {!selected ? (
            <div className="pos-card p-12 text-center text-[var(--muted)]">
              <p className="text-[15px]">Select a note to edit, or create a new one.</p>
              <button onClick={newDoc} className="pos-link mt-3 inline-block" style={{ color: 'var(--green)' }}>+ New note</button>
            </div>
          ) : (
            <div className="pos-card p-5 sm:p-7">
              <button onClick={() => { setSelected(null); setMobileEditor(false); }} className="pos-link text-[13px] mb-4 lg:hidden inline-block" style={{ color: 'var(--muted)' }}>← All notes</button>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled"
                className="w-full text-[22px] font-semibold text-[var(--ink)] bg-transparent outline-none"
                style={{ letterSpacing: '-0.02em' }}
              />
              <div className="flex items-center gap-3 mt-1.5 mb-4 text-[11px] text-[var(--muted)]">
                <span>{selected.updatedAt ? `Edited ${fmtDate(selected.updatedAt)}, ${fmtTime(selected.updatedAt)}` : 'New note'}</span>
                <span>·</span>
                <span>{wordCount(content)} words</span>
                {statusLabel && <span className="ml-auto inline-flex items-center gap-1" style={{ color: status === 'saved' ? 'var(--green)' : 'var(--muted)' }}>{status === 'saved' && '✓ '}{statusLabel}</span>}
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing…"
                rows={18}
                className="w-full text-[15px] leading-relaxed text-[var(--ink)] bg-transparent outline-none resize-y border-t pt-4"
                style={{ borderColor: 'var(--rule-soft)', minHeight: '360px' }}
              />

              <div className="flex items-center mt-4 pt-4 border-t" style={{ borderColor: 'var(--rule-soft)' }}>
                <button onClick={remove} className="pos-link text-[13px]" style={{ color: 'var(--orange)' }}>Delete note</button>
                <span className="ml-auto text-[11px] text-[var(--muted)] inline-flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Private to you · autosaved
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
