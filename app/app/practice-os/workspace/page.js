'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Workspace — a private, per-doctor place to write and retrieve text documents,
// each saved with a filename + date. Two panes: a searchable document list and
// an editor.
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function WorkspacePage() {
  const router = useRouter();
  const [docs, setDocs] = useState(null);       // list of {_id,title,updatedAt,preview}
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null); // full doc being edited, or a draft
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [mobileEditor, setMobileEditor] = useState(false);
  const searchTimer = useRef(null);

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
      setSavedAt(0);
      setMobileEditor(true);
    }
  }, [router]);

  const newDoc = useCallback(() => {
    setSelected({ _id: null });
    setTitle('');
    setContent('');
    setSavedAt(0);
    setMobileEditor(true);
  }, []);

  const save = useCallback(async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const isNew = !selected._id;
      const res = await fetch(
        isNew ? '/api/practice-os/documents' : `/api/practice-os/documents/${selected._id}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content }),
        },
      );
      if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
      const data = await res.json();
      if (data.success) {
        setSelected(data.document);
        setTitle(data.document.title);
        setSavedAt(Date.now());
        await load(query);
      }
    } finally {
      setSaving(false);
    }
  }, [selected, title, content, router, load, query]);

  const remove = useCallback(async () => {
    if (!selected || !selected._id) { setSelected(null); setMobileEditor(false); return; }
    const res = await fetch(`/api/practice-os/documents/${selected._id}`, { method: 'DELETE' });
    if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
    const data = await res.json();
    if (data.success) {
      setSelected(null);
      setMobileEditor(false);
      await load(query);
    }
  }, [selected, router, load, query]);

  if (!docs) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-6 max-w-[1240px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/app/practice-os" className="flex items-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo.svg" alt="CuraGo" className="h-7 sm:h-8 w-auto" />
          </Link>
          <span className="text-[var(--rule)]">/</span>
          <span className="text-[13px] text-[var(--muted)]">Workspace</span>
        </div>
        <button onClick={() => router.back()} className="pos-link" style={{ color: 'var(--muted)' }}>← Back</button>
      </div>

      <p className="pos-label mb-2">Workspace</p>
      <h1 className="text-[26px] md:text-[32px] font-semibold text-[var(--ink)] leading-tight" style={{ letterSpacing: '-0.027em' }}>
        Your notes
      </h1>
      <p className="text-[15px] text-[var(--muted)] mt-2 leading-relaxed" style={{ maxWidth: '54ch' }}>
        A private place to draft and keep text — saved with a name and date, easy to find again later.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6 lg:gap-8 mt-8">
        {/* Left — document list */}
        <div className={`min-w-0 ${mobileEditor ? 'hidden lg:block' : ''}`}>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name"
              className="flex-1 min-w-0 text-[14px] px-3 py-2 rounded-[8px] border bg-[var(--card)] text-[var(--ink)] outline-none focus:border-[var(--green)]"
              style={{ borderColor: 'var(--rule)' }}
            />
            <button onClick={newDoc} className="pos-action pos-focusable shrink-0 whitespace-nowrap" style={{ background: 'var(--green)' }}>
              + New
            </button>
          </div>

          {docs.length === 0 ? (
            <div className="pos-card p-8 text-center text-[var(--muted)] text-[14px]">
              {query ? 'No documents match that search.' : 'No documents yet — create your first note.'}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {docs.map((d) => {
                const active = selected && selected._id === d._id;
                return (
                  <button
                    key={d._id}
                    onClick={() => openDoc(d._id)}
                    className="pos-card text-left p-4 transition-colors"
                    style={{ borderColor: active ? 'var(--green)' : 'var(--rule)', background: active ? 'var(--green-soft)' : 'var(--card)' }}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[15px] font-medium text-[var(--ink)] truncate">{d.title}</p>
                      <span className="text-[11px] text-[var(--muted)] shrink-0">{fmtDate(d.updatedAt)}</span>
                    </div>
                    {d.preview && <p className="text-[12.5px] text-[var(--muted)] mt-1 line-clamp-2">{d.preview}</p>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right — editor */}
        <div className={`min-w-0 ${mobileEditor ? '' : 'hidden lg:block'}`}>
          {!selected ? (
            <div className="pos-card p-12 text-center text-[var(--muted)]">
              <p className="text-[15px]">Select a document to edit, or create a new one.</p>
              <button onClick={newDoc} className="pos-link mt-3 inline-block" style={{ color: 'var(--green)' }}>+ New document</button>
            </div>
          ) : (
            <div className="pos-card p-5 sm:p-6">
              <button onClick={() => { setSelected(null); setMobileEditor(false); }} className="pos-link text-[13px] mb-4 lg:hidden inline-block" style={{ color: 'var(--muted)' }}>← All notes</button>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setSavedAt(0); }}
                placeholder="Untitled"
                className="w-full text-[20px] font-semibold text-[var(--ink)] bg-transparent outline-none mb-1"
                style={{ letterSpacing: '-0.02em' }}
              />
              <p className="pos-label mb-4" style={{ color: 'var(--muted)' }}>
                {selected._id ? `Last saved ${fmtDate(selected.updatedAt)}` : 'New document'}
              </p>
              <textarea
                value={content}
                onChange={(e) => { setContent(e.target.value); setSavedAt(0); }}
                placeholder="Start writing…"
                rows={16}
                className="w-full text-[15px] leading-relaxed text-[var(--ink)] bg-transparent outline-none resize-y border-t pt-4"
                style={{ borderColor: 'var(--rule-soft)', minHeight: '320px' }}
              />
              <div className="flex items-center gap-3 mt-5 pt-4 border-t" style={{ borderColor: 'var(--rule-soft)' }}>
                <button onClick={save} disabled={saving} className="pos-action pos-focusable" style={{ background: 'var(--green)', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={remove} className="pos-link" style={{ color: 'var(--orange)' }}>Delete</button>
                {savedAt > 0 && !saving && (
                  <span className="text-[13px] text-[var(--green)] inline-flex items-center gap-1 ml-auto">✓ Saved</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
