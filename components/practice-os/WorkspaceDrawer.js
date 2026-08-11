'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

// A slide-over Workspace available on every Practice OS screen — jot or open
// notes without leaving what you're doing. Uses the same /api/practice-os/documents
// backend as the full Workspace page, so notes are one shared, private store.
export default function WorkspaceDrawer() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [docs, setDocs] = useState([]);
  const [view, setView] = useState('list'); // 'list' | 'edit'
  const [selId, setSelId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | saved
  const saveTimer = useRef(null);
  const lastSaved = useRef({ title: '', content: '' });

  const loadDocs = useCallback(async () => {
    const res = await fetch('/api/practice-os/documents');
    if (!res.ok) { setLoaded(true); return; }
    const data = await res.json();
    if (data.success) setDocs(data.documents);
    setLoaded(true);
  }, []);

  useEffect(() => { if (open && !loaded) loadDocs(); }, [open, loaded, loadDocs]);

  const openNote = useCallback(async (id) => {
    const res = await fetch(`/api/practice-os/documents/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.success) {
      setSelId(id);
      setTitle(data.document.title);
      setContent(data.document.content || '');
      lastSaved.current = { title: data.document.title, content: data.document.content || '' };
      setStatus('idle');
      setView('edit');
    }
  }, []);

  const newNote = useCallback(async () => {
    const res = await fetch('/api/practice-os/documents', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled', content: '' }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.success) {
      setSelId(data.document._id);
      setTitle('Untitled');
      setContent('');
      lastSaved.current = { title: 'Untitled', content: '' };
      setStatus('idle');
      setView('edit');
      loadDocs();
    }
  }, [loadDocs]);

  const autosave = useCallback(async () => {
    if (!selId) return;
    if (title === lastSaved.current.title && content === lastSaved.current.content) return;
    setStatus('saving');
    try {
      const res = await fetch(`/api/practice-os/documents/${selId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (data.success) { lastSaved.current = { title, content }; setStatus('saved'); loadDocs(); }
    } catch { setStatus('idle'); }
  }, [selId, title, content, loadDocs]);

  useEffect(() => {
    if (view !== 'edit' || !selId) return;
    if (title === lastSaved.current.title && content === lastSaved.current.content) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => autosave(), 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [title, content, view, selId, autosave]);

  const statusLabel = status === 'saving' ? 'Saving…' : status === 'saved' ? '✓ Saved' : 'Autosaves as you type';

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed z-40 bottom-5 right-5 text-white rounded-full shadow-lg inline-flex items-center gap-2 px-4 py-3 text-[14px] font-semibold"
          style={{ background: 'var(--green)' }}
          aria-label="Open workspace notes"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Notes
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: 'rgba(16,26,19,.2)' }} onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 top-0 right-0 h-full flex flex-col"
            style={{ width: 'min(92vw, 380px)', background: 'var(--card)', borderLeft: '1px solid var(--rule)', boxShadow: '-12px 0 40px rgba(16,26,19,.14)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--rule)' }}>
              <p className="pos-label">Workspace{view === 'edit' ? ' · note' : ''}</p>
              <div className="flex items-center gap-3">
                <Link href="/app/practice-os/workspace" className="pos-link text-[12px]" style={{ color: 'var(--muted)' }}>Open full</Link>
                <button onClick={() => setOpen(false)} className="pos-link" style={{ color: 'var(--muted)' }} aria-label="Close">✕</button>
              </div>
            </div>

            {view === 'list' ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <button onClick={newNote} className="pos-action pos-focusable w-full mb-2" style={{ background: 'var(--green)' }}>+ New note</button>
                {!loaded ? (
                  <p className="text-[13px] text-[var(--muted)] text-center mt-6">Loading…</p>
                ) : docs.length === 0 ? (
                  <p className="text-[13px] text-[var(--muted)] text-center mt-6">No notes yet — jot your first one.</p>
                ) : (
                  docs.map((d) => (
                    <button key={d._id} onClick={() => openNote(d._id)} className="pos-card text-left p-3 w-full block" style={{ borderColor: 'var(--rule)' }}>
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-[14px] font-medium text-[var(--ink)] truncate">{d.title}</p>
                        <span className="text-[10.5px] text-[var(--muted)] shrink-0">{new Date(d.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      {d.preview && <p className="text-[12px] text-[var(--muted)] line-clamp-1 mt-0.5">{d.preview}</p>}
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-4 min-h-0">
                <button onClick={() => { setView('list'); loadDocs(); }} className="pos-link text-[13px] mb-3 self-start" style={{ color: 'var(--muted)' }}>← All notes</button>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled"
                  className="w-full text-[17px] font-semibold text-[var(--ink)] bg-transparent outline-none mb-2"
                  style={{ letterSpacing: '-0.01em' }}
                />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Jot a note while you work…"
                  className="flex-1 w-full text-[14px] leading-relaxed text-[var(--ink)] bg-transparent outline-none resize-none border-t pt-3"
                  style={{ borderColor: 'var(--rule-soft)' }}
                />
                <p className="text-[11px] mt-2 shrink-0" style={{ color: status === 'saved' ? 'var(--green)' : 'var(--muted)' }}>{statusLabel}</p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
