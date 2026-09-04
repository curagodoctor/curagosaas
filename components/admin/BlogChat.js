'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Conversational blog/content assistant for the AI Website Builder — the same
// experience as the mission assistant, but standalone. Chat back-and-forth to
// draft/refine an article, then one-tap "Draft as blog" turns a reply into a
// draft you review and publish. Credit-metered via content-chat / draft-blog.
export default function BlogChat({ onCredits }) {
  const router = useRouter();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Tell me what to write — e.g. \"an article on managing acidity\" or \"a page about what to expect at a first consultation.\" I'll draft it from your profile and knowledge base. When you like a reply, tap **Draft as blog** to review and publish it." },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [drafting, setDrafting] = useState(-1);
  const scrollRef = useRef(null);
  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    const history = messages;
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setBusy(true);
    try {
      const res = await fetch('/api/practice-os/actions/content-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ message: text, history }),
      });
      const d = await res.json();
      if (!d.success) {
        const msg = d.error === 'PaymentRequired' ? 'This needs an active Builder Pack.' : d.error === 'NoCredits' ? (d.message || "You've used today's AI credits.") : (d.error || 'Something went wrong.');
        setMessages((m) => [...m, { role: 'assistant', content: msg }]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: d.reply }]);
        if (typeof d.creditsRemaining === 'number') onCredits?.(d.creditsRemaining);
      }
    } catch { setMessages((m) => [...m, { role: 'assistant', content: 'The assistant is unavailable right now.' }]); }
    finally { setBusy(false); }
  };

  // Turn an assistant reply into a full blog DRAFT and open it for review.
  const draftAsBlog = async (text, i) => {
    setDrafting(i);
    try {
      const res = await fetch('/api/practice-os/actions/draft-blog', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ context: text }),
      });
      const d = await res.json();
      if (d.success && d.id) { router.push(`/admin/dashboard/blog-articles/${d.id}`); return; }
      alert(d.message || d.error || 'Could not draft the article.');
    } catch { alert('Something went wrong.'); }
    finally { setDrafting(-1); }
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col" style={{ height: 460 }}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] ${m.role === 'user' ? 'bg-[#096b17] text-white' : 'bg-white border border-gray-100 text-gray-800'} rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.role === 'assistant' && i > 0 && (
                <button onClick={() => draftAsBlog(m.content, i)} disabled={drafting === i} className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-[#096b17] hover:underline disabled:opacity-50">
                  {drafting === i ? 'Drafting…' : '📝 Draft as blog →'}
                </button>
              )}
            </div>
          </div>
        ))}
        {busy && <p className="text-[12px] text-gray-400">Writing…</p>}
      </div>
      <div className="border-t border-gray-100 p-2.5 flex items-end gap-2 bg-white">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} placeholder="Ask for an article or a website page…" className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm max-h-28 focus:ring-2 focus:ring-[#096b17] focus:border-transparent" />
        <button onClick={send} disabled={busy || !input.trim()} className="shrink-0 bg-[#096b17] text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40">Send</button>
      </div>
    </div>
  );
}
