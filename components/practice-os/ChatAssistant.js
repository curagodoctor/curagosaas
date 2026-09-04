'use client';

import { useState, useEffect, useRef } from 'react';
import Markdown from './Markdown';

// Per-module chat assistant — full conversation with history + context (PRD §8).
// 1 credit per message; scoped to the current module. Shared by the focus workspace
// and the track (Day view) so the mission intro + assistant live on one screen.
export default function ChatAssistant({ missionId, moduleId, moduleTitle, autoPrompt = '' }) {
  const [messages, setMessages] = useState([]);
  const [meta, setMeta] = useState(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pendingNewSession, setPendingNewSession] = useState(false);
  const [typing, setTyping] = useState(null); // { full, shown } — reveals the reply as it "streams"
  const [expanded, setExpanded] = useState(false);
  const [autoDrafting, setAutoDrafting] = useState(false); // first response is being generated
  const [savedIdx, setSavedIdx] = useState({}); // { [messageIndex]: 'saving'|'saved' } — save-to-workspace state
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const autoFiredRef = useRef(false);

  const [actionState, setActionState] = useState({}); // { [i]: { blog?:..., reel?:... } }
  const [publishedUrl, setPublishedUrl] = useState(null);

  const deriveTitle = (text) => {
    const firstLine = String(text || '').replace(/[#>*_`-]/g, ' ').split('\n').map((l) => l.trim()).find(Boolean) || 'AI note';
    return firstLine.slice(0, 70) + (firstLine.length > 70 ? '…' : '');
  };

  // One-click: store an assistant reply in the doctor's workspace as a titled,
  // dated note (universal-AI "action from the chatbox").
  async function saveToWorkspace(text, i) {
    if (savedIdx[i]) return;
    setSavedIdx((s) => ({ ...s, [i]: 'saving' }));
    const dated = `${deriveTitle(text)} · ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    try {
      const res = await fetch('/api/practice-os/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ title: dated, content: text }),
      });
      const d = await res.json();
      setSavedIdx((s) => ({ ...s, [i]: d.success ? 'saved' : undefined }));
    } catch {
      setSavedIdx((s) => ({ ...s, [i]: undefined }));
    }
  }

  // One-click: turn an assistant reply into a LIVE blog page.
  async function publishBlog(text, i) {
    if (actionState[i]?.blog) return;
    setActionState((s) => ({ ...s, [i]: { ...s[i], blog: 'saving' } }));
    try {
      const res = await fetch('/api/practice-os/actions/publish-blog', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ text }),
      });
      const d = await res.json();
      if (d.success) { setActionState((s) => ({ ...s, [i]: { ...s[i], blog: 'done' } })); setPublishedUrl({ url: d.url, title: d.title }); }
      else setActionState((s) => ({ ...s, [i]: { ...s[i], blog: undefined } }));
    } catch { setActionState((s) => ({ ...s, [i]: { ...s[i], blog: undefined } })); }
  }

  // One-tap: expand this reply into a LONG blog DRAFT and open it for review
  // (draft → edit → publish) — "pages written by the Mission Assistant".
  async function draftBlog(text, i) {
    if (actionState[i]?.draft) return;
    setActionState((s) => ({ ...s, [i]: { ...s[i], draft: 'saving' } }));
    try {
      const res = await fetch('/api/practice-os/actions/draft-blog', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ context: text }),
      });
      const d = await res.json();
      if (d.success && d.id) { window.location.href = `/admin/dashboard/blog-articles/${d.id}`; }
      else { setActionState((s) => ({ ...s, [i]: { ...s[i], draft: undefined } })); alert(d.message || d.error || 'Could not draft the article.'); }
    } catch { setActionState((s) => ({ ...s, [i]: { ...s[i], draft: undefined } })); }
  }

  // One-click: send an assistant reel script to the Content Planner.
  async function sendToPlanner(text, i) {
    if (actionState[i]?.reel) return;
    setActionState((s) => ({ ...s, [i]: { ...s[i], reel: 'saving' } }));
    try {
      const res = await fetch('/api/practice-os/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ kind: 'reel', status: 'approved', title: deriveTitle(text), content: text }),
      });
      const d = await res.json();
      setActionState((s) => ({ ...s, [i]: { ...s[i], reel: d.success ? 'done' : undefined } }));
    } catch { setActionState((s) => ({ ...s, [i]: { ...s[i], reel: undefined } })); }
  }

  // Auto-grow the input as the doctor types (prompts can be long), capped so it
  // never eats the whole panel.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(expanded ? 300 : 160, el.scrollHeight)}px`;
  }, [input, expanded]);

  useEffect(() => {
    autoFiredRef.current = false;
    (async () => {
      try {
        const q = moduleId ? `?moduleId=${encodeURIComponent(moduleId)}` : '';
        const res = await fetch(`/api/practice-os/day/${missionId}/ai${q}`);
        if (res.ok) {
          const d = await res.json();
          setMeta(d);
          // Hide the auto-fired prompt turns — the doctor sees only replies + their own messages.
          setMessages((d.messages || []).filter((m) => !m.hidden).map((m) => ({ role: m.role, content: m.content })));
          // Auto-draft: if this module's thread is empty and we have a prompt, fire it
          // once so the assistant's response is ready without the doctor pasting anything.
          if (d.threadEmpty && autoPrompt && autoPrompt.trim() && (d.creditsRemaining ?? 0) > 0 && !autoFiredRef.current) {
            autoFiredRef.current = true;
            autoDraft(autoPrompt.trim());
          }
        }
      } catch { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId, moduleId, autoPrompt]);

  // Fire the module's prompt silently (hidden) and reveal only the assistant reply.
  async function autoDraft(p) {
    setAutoDrafting(true);
    setError('');
    try {
      const res = await fetch(`/api/practice-os/day/${missionId}/ai`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p, moduleId, auto: true }),
      });
      const data = await res.json();
      if (data.success && !data.skipped) {
        setTyping({ full: data.text || '', shown: '' });
        setMeta((mt) => ({ ...mt, creditsRemaining: data.creditsRemaining }));
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError('Could not generate a first draft. Type below to ask the assistant.');
    } finally {
      setAutoDrafting(false);
    }
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy, typing, autoDrafting]);

  // Reveal the assistant reply progressively (a lightweight "streaming" feel over
  // the single-shot API response), then commit it to the message list.
  useEffect(() => {
    if (!typing) return;
    if (typing.shown.length >= typing.full.length) {
      setMessages((m) => [...m, { role: 'assistant', content: typing.full }]);
      setTyping(null);
      return;
    }
    const step = Math.max(2, Math.ceil(typing.full.length / 180)); // finish in ~2s regardless of length
    const t = setTimeout(() => setTyping((s) => (s ? { ...s, shown: s.full.slice(0, s.shown.length + step) } : s)), 16);
    return () => clearTimeout(t);
  }, [typing]);

  const credits = meta?.creditsRemaining;
  const noCredits = credits === 0;
  const canStartNew = messages.length > 0 && !pendingNewSession;

  function newChat() {
    if (busy) return;
    setMessages([]); setError(''); setInput(''); setPendingNewSession(true);
  }

  async function send() {
    const p = input.trim();
    if (!p || busy || noCredits) return;
    setError(''); setInput('');
    const startingNew = pendingNewSession;
    setMessages((m) => [...m, { role: 'user', content: p }]);
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-os/day/${missionId}/ai`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p, newSession: startingNew, moduleId }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingNewSession(false);
        setTyping({ full: data.text || '', shown: '' });
        setMeta((mt) => ({ ...mt, creditsRemaining: data.creditsRemaining }));
      } else {
        setError(data.error || 'Something went wrong.');
        if (typeof data.creditsRemaining === 'number') setMeta((mt) => ({ ...mt, creditsRemaining: data.creditsRemaining }));
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
    {publishedUrl && (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" onClick={() => setPublishedUrl(null)}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: 'var(--green-soft)' }}>
            <svg className="w-6 h-6" style={{ color: 'var(--green)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--ink)]">Your page is live 🎉</h3>
          <p className="text-sm text-[var(--muted)] mt-1">“{publishedUrl.title}” has been published as a blog page.</p>
          <a href={publishedUrl.url} target="_blank" rel="noopener noreferrer" className="pos-action inline-block mt-4">View live page →</a>
          <button onClick={() => setPublishedUrl(null)} className="block mx-auto mt-3 pos-link text-sm">Close</button>
        </div>
      </div>
    )}
    <div className={`pos-card flex flex-col overflow-hidden ${expanded ? 'fixed inset-3 sm:inset-6 z-[80]' : ''}`} style={expanded ? { boxShadow: '0 20px 60px rgba(16,26,19,.25)' } : { height: 'min(82vh, 820px)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--rule)' }}>
        <div>
          <p className="pos-label">Mission assistant</p>
          <p className="text-[11px] text-[var(--muted)] truncate max-w-[180px]">On: {moduleTitle}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={newChat} disabled={busy || !canStartNew} className="pos-link text-[12px] disabled:opacity-40" title="Start a fresh conversation">+ New chat</button>
          {typeof credits === 'number' && <span className="pos-label" style={{ color: 'var(--muted)' }}>{credits}/{meta?.dailyLimit || 10}</span>}
          <button onClick={() => setExpanded((e) => !e)} className="pos-link text-[12px] inline-flex items-center" title={expanded ? 'Shrink' : 'Expand'} aria-label={expanded ? 'Shrink' : 'Expand'}>
            {expanded ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0v4m0-4h4m7 5l5-5m0 0v4m0-4h-4M9 15l-5 5m0 0v-4m0 4h4m7-5l5 5m0 0v-4m0 4h-4" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            )}
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !busy && !autoDrafting && !typing && (
          <div className="text-center text-sm text-[var(--muted)] py-8 px-2">
            Ask about this module — the assistant can draft, refine and format for you.
          </div>
        )}
        {autoDrafting && !typing && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-3.5 py-2.5 text-[14px] text-[var(--muted)] inline-flex items-center gap-2" style={{ background: 'var(--rule-soft)' }}>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" />
              Drafting this for you…
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed"
              style={{ background: m.role === 'user' ? 'var(--green)' : 'var(--rule-soft)', color: m.role === 'user' ? '#fff' : 'var(--ink)' }}>
              {m.role === 'user'
                ? <span className="whitespace-pre-wrap">{m.content}</span>
                : <Markdown text={m.content} />}
            </div>
            {m.role === 'assistant' && (
              <div className="mt-1 flex items-center gap-3 flex-wrap text-[11px]">
                <button onClick={() => saveToWorkspace(m.content, i)} disabled={!!savedIdx[i]}
                  className="inline-flex items-center gap-1" style={{ color: savedIdx[i] === 'saved' ? 'var(--green)' : 'var(--muted)' }} title="Save this to your workspace">
                  {savedIdx[i] === 'saved' ? '✓ Saved' : savedIdx[i] === 'saving' ? 'Saving…' : '⤓ Save to workspace'}
                </button>
                <button onClick={() => draftBlog(m.content, i)} disabled={actionState[i]?.draft === 'saving'}
                  className="inline-flex items-center gap-1" style={{ color: 'var(--muted)' }} title="Expand into a full blog draft and review it before publishing">
                  {actionState[i]?.draft === 'saving' ? 'Drafting…' : '📝 Draft as blog'}
                </button>
                <button onClick={() => publishBlog(m.content, i)} disabled={actionState[i]?.blog === 'saving' || actionState[i]?.blog === 'done'}
                  className="inline-flex items-center gap-1" style={{ color: actionState[i]?.blog === 'done' ? 'var(--green)' : 'var(--muted)' }} title="Publish this as a live blog page">
                  {actionState[i]?.blog === 'done' ? '✓ Published' : actionState[i]?.blog === 'saving' ? 'Publishing…' : '🌐 Publish as blog'}
                </button>
                <button onClick={() => sendToPlanner(m.content, i)} disabled={actionState[i]?.reel === 'saving' || actionState[i]?.reel === 'done'}
                  className="inline-flex items-center gap-1" style={{ color: actionState[i]?.reel === 'done' ? 'var(--green)' : 'var(--muted)' }} title="Send this reel script to the Content Planner">
                  {actionState[i]?.reel === 'done' ? '✓ In planner' : actionState[i]?.reel === 'saving' ? 'Sending…' : '🎬 Send to planner'}
                </button>
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed" style={{ background: 'var(--rule-soft)', color: 'var(--ink)' }}>
              <Markdown text={typing.shown} />
            </div>
          </div>
        )}
        {busy && !typing && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-3.5 py-2.5 text-[14px] text-[var(--muted)]" style={{ background: 'var(--rule-soft)' }}>Thinking…</div>
          </div>
        )}
      </div>

      <div className="border-t px-3 py-3 shrink-0" style={{ borderColor: 'var(--rule)' }}>
        {meta && meta.configured === false && <p className="text-[12px] text-[var(--orange)] mb-2 px-1">The assistant isn&apos;t configured yet.</p>}
        {error && <p className="text-[12px] text-red-600 mb-2 px-1">{error}</p>}
        {noCredits && <p className="text-[12px] text-[var(--muted)] mb-2 px-1">You&apos;ve used today&apos;s credits — they reset tomorrow.</p>}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about this module… (Shift+Enter for a new line)"
            rows={2}
            disabled={busy || noCredits}
            className="flex-1 pos-card px-3 py-2 text-sm resize-y"
            style={{ maxHeight: expanded ? 300 : 160 }}
          />
          <button onClick={send} disabled={busy || noCredits || !input.trim()} className="pos-action pos-focusable disabled:opacity-50 shrink-0">Send</button>
        </div>
        <p className="text-[10.5px] text-[var(--muted)] mt-2 px-1">1 credit per message · Enter to send</p>
      </div>
    </div>
    </>
  );
}
