'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// §8 — persistent assistant, bottom-right, on every POS page. Collapsed by
// default; opens into a chat panel. History is loaded once and kept in state as
// the doctor navigates (this is mounted in the shared /app layout), and is also
// persisted server-side so it survives reloads. Hidden for non-authenticated
// visitors (the API returns 401).
export default function GlobalAssistant() {
  const [available, setAvailable] = useState(null); // null=unknown, false=hide
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [credits, setCredits] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  // Probe availability once (are we an authenticated POS doctor?).
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

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; });
  }, []);
  useEffect(() => { if (open) scrollToEnd(); }, [open, messages, scrollToEnd]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setError('');
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setSending(true);
    try {
      const res = await fetch('/api/practice-os/assistant', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ prompt: text }),
      });
      const d = await res.json();
      if (d.success) {
        setMessages((m) => [...m, { role: 'assistant', content: d.reply }]);
        if (typeof d.creditsRemaining === 'number') setCredits(d.creditsRemaining);
      } else {
        setError(d.message || d.error || 'Could not send.');
      }
    } catch { setError('Something went wrong.'); }
    finally { setSending(false); scrollToEnd(); }
  };

  if (available === false || available === null) return null;

  return (
    <>
      {/* Collapsed launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open assistant"
          className="fixed z-[60] bottom-5 right-5 flex items-center gap-2 rounded-full shadow-lg pl-4 pr-5 py-3"
          style={{ background: 'var(--green)', color: '#fff' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.84L3 20l1.05-3.5A7.9 7.9 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span className="text-sm font-semibold">Assistant</span>
        </button>
      )}

      {/* Expanded panel */}
      {open && (
        <div
          className="fixed z-[60] bg-[var(--card)] shadow-2xl flex flex-col
                     bottom-0 right-0 left-0 h-[80vh] rounded-t-2xl
                     sm:bottom-5 sm:right-5 sm:left-auto sm:w-[380px] sm:h-[560px] sm:rounded-2xl"
          style={{ border: '1px solid var(--rule)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--rule)' }}>
            <div>
              <p className="text-[15px] font-semibold text-[var(--ink)]">Assistant</p>
              {credits !== null && <p className="text-[11px] text-[var(--muted)]">{credits} AI credits left</p>}
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-[var(--muted)] hover:text-[var(--ink)] p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {!loaded && <p className="text-sm text-[var(--muted)]">Loading…</p>}
            {loaded && messages.length === 0 && (
              <div className="text-sm text-[var(--muted)] mt-4">
                <p className="text-[var(--ink)] font-medium mb-1">How can I help?</p>
                <p>Ask me to draft a GBP post, write an education page, improve your website copy, or plan what to do next.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div
                  className="inline-block max-w-[85%] text-left rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap"
                  style={m.role === 'user'
                    ? { background: 'var(--green)', color: '#fff', borderBottomRightRadius: 4 }
                    : { background: 'var(--rule-soft)', color: 'var(--ink)', borderBottomLeftRadius: 4 }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && <p className="text-[13px] text-[var(--muted)]">Thinking…</p>}
            {error && <p className="text-[13px] text-red-600">{error}</p>}
          </div>

          <div className="p-3 border-t" style={{ borderColor: 'var(--rule)' }}>
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                placeholder="Message the assistant…"
                className="flex-1 resize-none rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--rule)', maxHeight: 96 }}
              />
              <button onClick={send} disabled={sending || !input.trim()} className="pos-action shrink-0" style={{ padding: '9px 14px', opacity: sending || !input.trim() ? 0.5 : 1 }}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
