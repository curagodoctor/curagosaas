'use client';

import { useState, useEffect, useRef } from 'react';

// Per-module chat assistant — full conversation with history + context (PRD §8).
// 1 credit per message; scoped to the current module. Shared by the focus workspace
// and the track (Day view) so the mission intro + assistant live on one screen.
export default function ChatAssistant({ missionId, moduleId, moduleTitle }) {
  const [messages, setMessages] = useState([]);
  const [meta, setMeta] = useState(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pendingNewSession, setPendingNewSession] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/practice-os/day/${missionId}/ai`);
        if (res.ok) {
          const d = await res.json();
          setMeta(d);
          setMessages((d.messages || []).map((m) => ({ role: m.role, content: m.content })));
        }
      } catch { /* ignore */ }
    })();
  }, [missionId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

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
        setMessages((m) => [...m, { role: 'assistant', content: data.text }]);
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
    <div className="pos-card flex flex-col overflow-hidden" style={{ height: 'min(70vh, 650px)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--rule)' }}>
        <div>
          <p className="pos-label">Mission assistant</p>
          <p className="text-[11px] text-[var(--muted)] truncate max-w-[180px]">On: {moduleTitle}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={newChat} disabled={busy || !canStartNew} className="pos-link text-[12px] disabled:opacity-40" title="Start a fresh conversation">+ New chat</button>
          {typeof credits === 'number' && <span className="pos-label" style={{ color: 'var(--muted)' }}>{credits}/{meta?.dailyLimit || 10}</span>}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !busy && (
          <div className="text-center text-sm text-[var(--muted)] py-8 px-2">
            Ask about this module — or paste the prompt above and ask me to draft it for you.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[14px] whitespace-pre-wrap leading-relaxed"
              style={{ background: m.role === 'user' ? 'var(--green)' : 'var(--rule-soft)', color: m.role === 'user' ? '#fff' : 'var(--ink)' }}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about this module…"
            rows={1}
            disabled={busy || noCredits}
            className="flex-1 pos-card px-3 py-2 text-sm resize-none"
            style={{ maxHeight: 120 }}
          />
          <button onClick={send} disabled={busy || noCredits || !input.trim()} className="pos-action pos-focusable disabled:opacity-50 shrink-0">Send</button>
        </div>
        <p className="text-[10.5px] text-[var(--muted)] mt-2 px-1">1 credit per message · Enter to send</p>
      </div>
    </div>
  );
}
