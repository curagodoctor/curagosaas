'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// §4 — the persistent assistant. Bottom-right on every page the doctor works on
// (POS pages + the /admin AI builder). One conversation, restored on load and
// kept as they navigate. Behavior varies by page:
//   - builder pages (AI builder, practice-builder wizard/focus/content): opens
//     automatically and is fully responsive.
//   - elsewhere: a collapsed button; it opens but tells the doctor it only acts
//     inside the builders (it won't respond out of context).
// An inline-edit sub-window (ChatGPT-style) handles focused one-off edits.

// Self-contained colours so it looks right on /app (POS tokens) AND /admin.
const VARS = {
  '--ga-green': '#096b17', '--ga-card': '#ffffff', '--ga-ink': '#101A13',
  '--ga-muted': '#5E6B5F', '--ga-rule': '#DDE4D9', '--ga-soft': '#EDF1EB',
};
const BUILDER_PREFIXES = [
  '/admin/dashboard/ai-generate',
  '/app/zero-to-practice-builder/onboard',
  '/app/zero-to-practice-builder/focus',
  '/app/zero-to-practice-builder/content',
];

export default function GlobalAssistant() {
  const pathname = usePathname() || '';
  const isBuilder = BUILDER_PREFIXES.some((p) => pathname.startsWith(p));

  const [available, setAvailable] = useState(null); // null unknown, false hide
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [credits, setCredits] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false); // inline-edit sub-window
  const [editText, setEditText] = useState('');
  const scrollRef = useRef(null);
  const autoedRef = useRef('');

  useEffect(() => {
    let on = true;
    fetch('/api/practice-os/assistant', { credentials: 'include' })
      .then((r) => { if (r.status === 401) { if (on) setAvailable(false); return null; } return r.json(); })
      .then((d) => {
        if (!on || !d) return;
        setAvailable(true); setLoaded(true);
        setMessages(d.messages || []);
        setCredits(typeof d.creditsRemaining === 'number' ? d.creditsRemaining : null);
      })
      .catch(() => { if (on) setAvailable(false); });
    return () => { on = false; };
  }, []);

  // Auto-open once when the doctor enters a builder page.
  useEffect(() => {
    if (isBuilder && autoedRef.current !== pathname) { autoedRef.current = pathname; setOpen(true); }
  }, [isBuilder, pathname]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; });
  }, []);
  useEffect(() => { if (open) scrollToEnd(); }, [open, messages, scrollToEnd]);

  const send = async (text) => {
    const body = (text ?? input).trim();
    if (!body || sending) return;
    setError(''); setInput('');
    setMessages((m) => [...m, { role: 'user', content: body }]);
    setSending(true);
    try {
      const res = await fetch('/api/practice-os/assistant', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ prompt: body }),
      });
      const d = await res.json();
      if (d.success) { setMessages((m) => [...m, { role: 'assistant', content: d.reply }]); if (typeof d.creditsRemaining === 'number') setCredits(d.creditsRemaining); }
      else setError(d.message || d.error || 'Could not send.');
    } catch { setError('Something went wrong.'); }
    finally { setSending(false); scrollToEnd(); }
  };

  const applyEdit = async () => {
    const t = editText.trim(); if (!t) return;
    setEditOpen(false); setEditText('');
    await send(`Please make this edit: ${t}`);
  };

  if (available === false || available === null) return null;

  return (
    <div style={VARS}>
      {/* Collapsed launcher */}
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Open assistant"
          className="fixed z-[60] bottom-5 right-5 flex items-center gap-2 rounded-full shadow-lg pl-4 pr-5 py-3"
          style={{ background: 'var(--ga-green)', color: '#fff' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.84L3 20l1.05-3.5A7.9 7.9 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span className="text-sm font-semibold">Assistant</span>
        </button>
      )}

      {open && (
        <div className="fixed z-[60] flex flex-col shadow-2xl bottom-0 right-0 left-0 h-[80vh] rounded-t-2xl sm:bottom-5 sm:right-5 sm:left-auto sm:w-[380px] sm:h-[560px] sm:rounded-2xl"
          style={{ background: 'var(--ga-card)', border: '1px solid var(--ga-rule)' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--ga-rule)' }}>
            <div>
              <p className="text-[15px] font-semibold" style={{ color: 'var(--ga-ink)' }}>Assistant</p>
              {credits !== null && <p className="text-[11px]" style={{ color: 'var(--ga-muted)' }}>{credits} AI credits left</p>}
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="p-1" style={{ color: 'var(--ga-muted)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {!loaded && <p className="text-sm" style={{ color: 'var(--ga-muted)' }}>Loading…</p>}
            {loaded && messages.length === 0 && (
              <div className="text-sm mt-4" style={{ color: 'var(--ga-muted)' }}>
                <p className="font-medium mb-1" style={{ color: 'var(--ga-ink)' }}>How can I help?</p>
                <p>Ask me to draft a GBP post, write an education page, improve your website copy, or plan what to do next.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className="inline-block max-w-[85%] text-left rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap"
                  style={m.role === 'user' ? { background: 'var(--ga-green)', color: '#fff', borderBottomRightRadius: 4 } : { background: 'var(--ga-soft)', color: 'var(--ga-ink)', borderBottomLeftRadius: 4 }}>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && <p className="text-[13px]" style={{ color: 'var(--ga-muted)' }}>Thinking…</p>}
            {error && <p className="text-[13px] text-red-600">{error}</p>}
          </div>

          {/* Composer — full on builders; restricted elsewhere */}
          <div className="p-3 relative" style={{ borderTop: '1px solid var(--ga-rule)' }}>
            {editOpen && (
              <div className="absolute left-3 right-3 bottom-[64px] rounded-xl shadow-lg p-3" style={{ background: 'var(--ga-card)', border: '1px solid var(--ga-green)' }}>
                <p className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--ga-ink)' }}>Quick edit</p>
                <textarea autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} placeholder="Describe the change…" className="w-full resize-none rounded-lg px-2.5 py-2 text-sm outline-none" style={{ border: '1px solid var(--ga-rule)' }} />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => { setEditOpen(false); setEditText(''); }} className="text-[13px]" style={{ color: 'var(--ga-muted)' }}>Cancel</button>
                  <button onClick={applyEdit} className="text-[13px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'var(--ga-green)', color: '#fff' }}>Apply</button>
                </div>
              </div>
            )}

            {isBuilder ? (
              <div className="flex items-end gap-2">
                <button onClick={() => setEditOpen((v) => !v)} aria-label="Quick edit" className="shrink-0 rounded-lg p-2.5" style={{ border: '1px solid var(--ga-rule)', color: 'var(--ga-muted)' }} title="Quick edit">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} placeholder="Message the assistant…" className="flex-1 resize-none rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1px solid var(--ga-rule)', maxHeight: 96 }} />
                <button onClick={() => send()} disabled={sending || !input.trim()} className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: 'var(--ga-green)', color: '#fff', opacity: sending || !input.trim() ? 0.5 : 1 }}>Send</button>
              </div>
            ) : (
              <p className="text-[13px] text-center" style={{ color: 'var(--ga-muted)' }}>
                Open the <b style={{ color: 'var(--ga-ink)' }}>AI builder</b> or a builder page to chat and make changes here.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
