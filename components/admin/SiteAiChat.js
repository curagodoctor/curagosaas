'use client';

import { useState, useRef, useEffect } from 'react';

// Friendly label for a section type (matches the config-forms set).
const SECTION_LABELS = {
  header: 'Header', hero_carousel: 'Hero', banner_image: 'Banner', doctor_profile: 'About / Doctor',
  benefits_list: 'Services / Benefits', testimonials: 'Testimonials', faqs: 'FAQs',
  location_map: 'Location', cta_button: 'Call to action', custom_text: 'Text block',
  disease_icons_scroll: 'Conditions', footer: 'Footer', clinic_info: 'Clinic info',
  professional_fees: 'Fees', booking_form: 'Booking form',
};
const label = (t) => SECTION_LABELS[t] || (t || 'section').replace(/_/g, ' ');

// Website-builder AI chat. Proposes an edit to one section; the doctor clicks
// "Apply" and it's written into the editor's local state (live preview) — they
// then Save/Publish with the normal button. No direct DB writes here.
export default function SiteAiChat({ sections = [], onApplyEdit }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! Tell me what to change on your website — e.g. \"make the About section warmer\" or \"add an FAQ about appointment timings\"." },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null); // { edits: [{index,type,config}] }
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages, pending]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    const history = messages.filter((m) => m.role === 'user' || m.role === 'assistant');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setBusy(true);
    setPending(null);
    try {
      const res = await fetch('/api/practice-os/actions/site-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ message: text, sections, history }),
      });
      const d = await res.json();
      if (!d.success) {
        const msg = d.error === 'PaymentRequired' ? 'This needs an active builder pack.'
          : d.error === 'NoCredits' ? (d.message || "You've used today's AI credits.")
          : (d.error || 'Something went wrong.');
        setMessages((m) => [...m, { role: 'assistant', content: msg }]);
      } else {
        const edits = Array.isArray(d.edits) ? d.edits : (d.edit ? [d.edit] : []);
        setMessages((m) => [...m, { role: 'assistant', content: d.reply || (edits.length ? 'Here are the suggested changes.' : '') }]);
        if (edits.length) setPending({ edits });
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'The assistant is unavailable right now.' }]);
    } finally { setBusy(false); }
  };

  const apply = () => {
    if (!pending?.edits?.length) return;
    pending.edits.forEach((e) => onApplyEdit?.(e.index, e.config));
    const names = pending.edits.map((e) => label(e.type)).join(', ');
    setMessages((m) => [...m, { role: 'assistant', content: `Applied to ${names} — review in the preview, then Save to publish.` }]);
    setPending(null);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 bg-[#096b17] text-white rounded-full shadow-lg px-4 py-3 text-sm font-semibold hover:bg-[#075512] flex items-center gap-2"
      >
        ✨ Edit with AI
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[360px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col" style={{ height: 520, maxHeight: 'calc(100vh - 40px)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#096b17] text-white grid place-items-center text-sm">✨</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">Website AI</p>
            <p className="text-[11px] text-gray-400 leading-tight">Ask for changes · review before saving</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13.5px] leading-snug ${m.role === 'user' ? 'bg-[#096b17] text-white' : 'bg-gray-100 text-gray-800'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {pending?.edits?.length > 0 && (
          <div className="border border-[#096b17]/30 bg-[#096b17]/5 rounded-xl p-3">
            <p className="text-[11px] font-semibold text-[#096b17] uppercase tracking-wide mb-1">
              Suggested {pending.edits.length === 1 ? 'change' : `changes (${pending.edits.length})`} · {pending.edits.map((e) => label(e.type)).join(', ')}
            </p>
            <p className="text-[12px] text-gray-600 mb-2">Apply to preview, then Save to publish.</p>
            <div className="flex gap-2">
              <button onClick={apply} className="px-3 py-1.5 bg-[#096b17] text-white rounded-lg text-[13px] font-medium hover:bg-[#075512]">Apply {pending.edits.length > 1 ? 'changes' : 'change'}</button>
              <button onClick={() => setPending(null)} className="px-3 py-1.5 text-gray-500 text-[13px] hover:text-gray-700">Discard</button>
            </div>
          </div>
        )}
        {busy && <div className="text-[12px] text-gray-400">Thinking…</div>}
      </div>

      <div className="border-t border-gray-100 p-2.5">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            placeholder="Ask for a change…"
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#096b17] focus:border-transparent max-h-24"
          />
          <button onClick={send} disabled={busy || !input.trim()} className="shrink-0 bg-[#096b17] text-white rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40 hover:bg-[#075512]">Send</button>
        </div>
      </div>
    </div>
  );
}
