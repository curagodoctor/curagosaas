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
  '/app/control-center/onboard',
  '/app/control-center/focus',
  '/app/control-center/content',
  '/app/control-center/day',
  '/app/control-center/clusters',
];

// Render assistant text with markdown links [label](url) and **bold** as real
// elements (so the "Review & publish →" action links are clickable).
function renderRich(text) {
  const str = String(text || '');
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  const parts = [];
  let last = 0, m, k = 0;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) parts.push(str.slice(last, m.index));
    if (m[1] && m[2]) parts.push(<a key={k++} href={m[2]} style={{ color: 'var(--ga-green)', fontWeight: 600, textDecoration: 'underline' }}>{m[1]}</a>);
    else if (m[3]) parts.push(<strong key={k++}>{m[3]}</strong>);
    last = re.lastIndex;
  }
  if (last < str.length) parts.push(str.slice(last));
  return parts;
}

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

  // The single floating FAB opens the assistant via this event (no own launcher).
  useEffect(() => {
    const openAssistant = () => setOpen(true);
    window.addEventListener('pos:open-assistant', openAssistant);
    return () => window.removeEventListener('pos:open-assistant', openAssistant);
  }, []);
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

  // Refresh the live credit balance every time the assistant opens, so it never
  // shows a stale count (e.g. after onboarding generations deducted elsewhere).
  useEffect(() => {
    if (!open) return;
    fetch('/api/practice-os/credits', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d?.success) setCredits(d.unlimited ? Infinity : d.remaining); })
      .catch(() => {});
  }, [open]);

  // Do NOT auto-open — the assistant stays a collapsed button until the doctor
  // opens it (auto-popping after sign-in was unwanted). autoedRef retained to
  // avoid an unused-import churn.
  useEffect(() => { autoedRef.current = pathname; }, [pathname]);

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
      if (d.success) {
        setMessages((m) => [...m, { role: 'assistant', content: d.reply }]);
        if (typeof d.creditsRemaining === 'number') setCredits(d.creditsRemaining);
        // Unified assistant actions: write a page (hand off to the blog engine)
        // or route to the website builder.
        if (d.action?.type === 'write_page') {
          try {
            const r2 = await fetch('/api/practice-os/actions/draft-blog', {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
              body: JSON.stringify({ context: d.action.topic, pageType: 'disease' }),
            });
            const b = await r2.json();
            if (b.success && b.id) {
              setMessages((m) => [...m, { role: 'assistant', content: `Drafted **${b.title || 'your page'}**. [Review & publish →](/admin/dashboard/blog-articles/${b.id})` }]);
              if (typeof b.creditsRemaining === 'number') setCredits(b.creditsRemaining);
            } else setMessages((m) => [...m, { role: 'assistant', content: b.message || b.error || 'Could not draft the page.' }]);
          } catch { setMessages((m) => [...m, { role: 'assistant', content: 'Could not draft the page just now.' }]); }
        } else if (d.action?.type === 'edit_website' && d.action.link) {
          setMessages((m) => [...m, { role: 'assistant', content: `[Open the AI website builder →](${d.action.link})` }]);
        }
      }
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
      {/* Launcher removed — opened by the single floating FAB. */}
      {open && (
        <div className="fixed z-[60] flex flex-col shadow-2xl bottom-0 right-0 left-0 h-[80vh] rounded-t-2xl sm:bottom-5 sm:right-5 sm:left-auto sm:w-[380px] sm:h-[560px] sm:rounded-2xl"
          style={{ background: 'var(--ga-card)', border: '1px solid var(--ga-rule)' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--ga-rule)' }}>
            <div>
              <p className="text-[15px] font-semibold" style={{ color: 'var(--ga-ink)' }}>Assistant</p>
              {credits !== null && <p className="text-[11px]" style={{ color: 'var(--ga-muted)' }}>{credits === Infinity || credits >= 999999 ? '∞' : credits} AI credits left</p>}
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
                  {renderRich(m.content)}
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
              <>
                <div className="flex items-end gap-2">
                  <button onClick={() => setEditOpen((v) => !v)} aria-label="Quick edit" className="shrink-0 rounded-lg p-2.5" style={{ border: '1px solid var(--ga-rule)', color: 'var(--ga-muted)' }} title="Quick edit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} placeholder="Message the assistant…" className="flex-1 resize-none rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1px solid var(--ga-rule)', maxHeight: 96 }} />
                  <button onClick={() => send()} disabled={sending || !input.trim()} className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: 'var(--ga-green)', color: '#fff', opacity: sending || !input.trim() ? 0.5 : 1 }}>Send</button>
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--ga-muted)', lineHeight: 1.4 }}>AI can make mistakes. Check for accuracy and compliance before publishing.</p>
              </>
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
