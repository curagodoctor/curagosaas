'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SectionRenderer from '@/components/booking-page/SectionRenderer';

// Config forms (manual section editing) — same set the full page builder uses.
import HeaderConfig from '@/components/admin/booking-pages/config-forms/HeaderConfig';
import HeroCarouselConfig from '@/components/admin/booking-pages/config-forms/HeroCarouselConfig';
import BannerImageConfig from '@/components/admin/booking-pages/config-forms/BannerImageConfig';
import BenefitsListConfig from '@/components/admin/booking-pages/config-forms/BenefitsListConfig';
import DoctorProfileConfig from '@/components/admin/booking-pages/config-forms/DoctorProfileConfig';
import TestimonialsConfig from '@/components/admin/booking-pages/config-forms/TestimonialsConfig';
import FAQConfig from '@/components/admin/booking-pages/config-forms/FAQConfig';
import LocationMapConfig from '@/components/admin/booking-pages/config-forms/LocationMapConfig';
import DiseaseIconsScrollConfig from '@/components/admin/booking-pages/config-forms/DiseaseIconsScrollConfig';
import CustomTextConfig from '@/components/admin/booking-pages/config-forms/CustomTextConfig';
import CTAButtonConfig from '@/components/admin/booking-pages/config-forms/CTAButtonConfig';
import BookingFormConfig from '@/components/admin/booking-pages/config-forms/BookingFormConfig';
import ClinicInfoConfig from '@/components/admin/booking-pages/config-forms/ClinicInfoConfig';
import FooterConfig from '@/components/admin/booking-pages/config-forms/FooterConfig';
import ProfessionalFeesConfig from '@/components/admin/booking-pages/config-forms/ProfessionalFeesConfig';
import WhatsAppStickyButtonConfig from '@/components/admin/booking-pages/config-forms/WhatsAppStickyButtonConfig';
import BookNowStickyButtonConfig from '@/components/admin/booking-pages/config-forms/BookNowStickyButtonConfig';
import ChatbotConfig from '@/components/admin/booking-pages/config-forms/ChatbotConfig';

const CONFIG_FORMS = {
  header: HeaderConfig, hero_carousel: HeroCarouselConfig, banner_image: BannerImageConfig,
  benefits_list: BenefitsListConfig, doctor_profile: DoctorProfileConfig, testimonials: TestimonialsConfig,
  faqs: FAQConfig, location_map: LocationMapConfig, disease_icons_scroll: DiseaseIconsScrollConfig,
  custom_text: CustomTextConfig, cta_button: CTAButtonConfig, booking_form: BookingFormConfig,
  clinic_info: ClinicInfoConfig, professional_fees: ProfessionalFeesConfig, footer: FooterConfig,
  whatsapp_sticky: WhatsAppStickyButtonConfig, book_now_sticky: BookNowStickyButtonConfig, faq_chatbot: ChatbotConfig,
};
const SECTION_LABELS = {
  header: 'Header', hero_carousel: 'Hero', banner_image: 'Banner', doctor_profile: 'About', benefits_list: 'Services',
  testimonials: 'Testimonials', faqs: 'FAQs', location_map: 'Location', disease_icons_scroll: 'Conditions',
  custom_text: 'Text', cta_button: 'Call to action', booking_form: 'Booking form', clinic_info: 'Clinic info',
  professional_fees: 'Fees', footer: 'Footer', whatsapp_sticky: 'WhatsApp button', book_now_sticky: 'Book Now button', faq_chatbot: 'FAQ chatbot',
};
const label = (t) => SECTION_LABELS[t] || (t || 'section').replace(/_/g, ' ');

export default function AiSiteEditor() {
  const router = useRouter();
  const [sections, setSections] = useState([]);
  const [selected, setSelected] = useState(null); // index being manually edited
  const [hasDraft, setHasDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [flash, setFlash] = useState(null);
  const [tab, setTab] = useState('chat'); // 'chat' | 'sections'

  // Chat state
  const [messages, setMessages] = useState([{ role: 'assistant', content: "Tell me what to change — e.g. \"make the About section warmer\" or \"add an FAQ about timings\". I'll update the preview on the right." }]);
  const [input, setInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [pending, setPending] = useState(null);
  const chatRef = useRef(null);
  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, [messages, pending]);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/practice-os/actions/site-draft', { credentials: 'include' });
      const d = await r.json();
      if (!d.exists) { setSections([]); }
      else { setSections((d.hasDraft ? d.draftSections : d.liveSections) || []); setHasDraft(!!d.hasDraft); }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const setSectionConfig = (index, patch) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, config: { ...s.config, ...patch } } : s)));
  };
  const move = (i, dir) => {
    const j = i + dir; if (j < 0 || j >= sections.length) return;
    setSections((prev) => { const n = [...prev]; [n[i], n[j]] = [n[j], n[i]]; return n.map((s, k) => ({ ...s, order: k })); });
    setSelected(null);
  };
  const remove = (i) => { setSections((prev) => prev.filter((_, k) => k !== i)); setSelected(null); };
  const toggleVisible = (i) => setSections((prev) => prev.map((s, k) => (k === i ? { ...s, visible: s.visible === false } : s)));

  const say = (type, text) => setFlash({ type, text });

  const sendChat = async () => {
    const text = input.trim(); if (!text || chatBusy) return;
    setInput(''); setPending(null);
    const history = messages;
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setChatBusy(true);
    try {
      const res = await fetch('/api/practice-os/actions/site-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ message: text, sections, history }),
      });
      const d = await res.json();
      if (!d.success) {
        const msg = d.error === 'PaymentRequired' ? 'This needs an active Builder Pack.' : d.error === 'NoCredits' ? (d.message || "You've used today's AI credits.") : (d.error || 'Something went wrong.');
        setMessages((m) => [...m, { role: 'assistant', content: msg }]);
      } else {
        const edits = Array.isArray(d.edits) ? d.edits : (d.edit ? [d.edit] : []);
        setMessages((m) => [...m, { role: 'assistant', content: d.reply || (edits.length ? 'Here are the changes.' : '') }]);
        if (edits.length) setPending({ edits });
      }
    } catch { setMessages((m) => [...m, { role: 'assistant', content: 'The assistant is unavailable right now.' }]); }
    finally { setChatBusy(false); }
  };
  const applyPending = () => {
    if (!pending?.edits?.length) return;
    setSections((prev) => prev.map((s, i) => {
      const e = pending.edits.find((x) => x.index === i);
      return e ? { ...s, config: e.config } : s;
    }));
    setMessages((m) => [...m, { role: 'assistant', content: `Applied — check the preview. Save when you're happy.` }]);
    setPending(null);
  };

  const saveDraft = async () => {
    setSaving('save'); setFlash(null);
    try {
      const res = await fetch('/api/practice-os/actions/site-draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ action: 'save', sections }),
      });
      const d = await res.json();
      if (d.success) { setHasDraft(true); say('ok', 'Draft saved.'); } else say('err', d.error || 'Could not save.');
    } catch { say('err', 'Something went wrong.'); }
    finally { setSaving(''); }
  };
  const approve = async () => {
    setSaving('approve'); setFlash(null);
    try {
      // Persist current edits as the draft, then promote it live.
      await fetch('/api/practice-os/actions/site-draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ action: 'save', sections }),
      });
      const res = await fetch('/api/practice-os/actions/site-draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ action: 'approve' }),
      });
      const d = await res.json();
      if (d.success) { say('ok', 'Published! Your homepage is live.'); setHasDraft(false); } else say('err', d.error || 'Could not publish.');
    } catch { say('err', 'Something went wrong.'); }
    finally { setSaving(''); }
  };

  const ConfigForm = selected != null ? CONFIG_FORMS[sections[selected]?.type] : null;

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50" style={{ zIndex: 50 }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/dashboard/ai-generate')} className="text-gray-500 hover:text-gray-800 text-sm">← Back</button>
          <span className="font-semibold text-gray-900 text-sm">AI Website Editor</span>
          {hasDraft && <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Draft</span>}
        </div>
        <div className="flex items-center gap-2">
          {flash && <span className={`text-xs ${flash.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{flash.text}</span>}
          <button onClick={saveDraft} disabled={!!saving} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">{saving === 'save' ? 'Saving…' : 'Save draft'}</button>
          <button onClick={approve} disabled={!!saving} className="px-4 py-1.5 bg-[#096b17] text-white rounded-lg text-sm font-medium hover:bg-[#075512] disabled:opacity-50">{saving === 'approve' ? 'Publishing…' : 'Approve & publish'}</button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* LEFT: chat + sections */}
        <div className="w-[380px] max-w-[42vw] border-r border-gray-200 bg-white flex flex-col min-h-0">
          <div className="flex border-b border-gray-100 text-sm">
            <button onClick={() => setTab('chat')} className={`flex-1 py-2.5 font-medium ${tab === 'chat' ? 'text-[#096b17] border-b-2 border-[#096b17]' : 'text-gray-500'}`}>💬 Edit with AI</button>
            <button onClick={() => { setTab('sections'); setSelected(null); }} className={`flex-1 py-2.5 font-medium ${tab === 'sections' ? 'text-[#096b17] border-b-2 border-[#096b17]' : 'text-gray-500'}`}>☰ Sections</button>
          </div>

          {tab === 'chat' ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-[13.5px] leading-snug ${m.role === 'user' ? 'bg-[#096b17] text-white' : 'bg-gray-100 text-gray-800'}`}>{m.content}</div>
                  </div>
                ))}
                {pending?.edits?.length > 0 && (
                  <div className="border border-[#096b17]/30 bg-[#096b17]/5 rounded-xl p-3">
                    <p className="text-[11px] font-semibold text-[#096b17] uppercase tracking-wide mb-1">Suggested {pending.edits.length === 1 ? 'change' : `changes (${pending.edits.length})`} · {pending.edits.map((e) => label(e.type)).join(', ')}</p>
                    <div className="flex gap-2">
                      <button onClick={applyPending} className="px-3 py-1.5 bg-[#096b17] text-white rounded-lg text-[13px] font-medium">Apply</button>
                      <button onClick={() => setPending(null)} className="px-3 py-1.5 text-gray-500 text-[13px]">Discard</button>
                    </div>
                  </div>
                )}
                {chatBusy && <p className="text-[12px] text-gray-400">Thinking…</p>}
              </div>
              <div className="border-t border-gray-100 p-2.5 flex items-end gap-2">
                <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }} rows={1} placeholder="Ask for a change…" className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm max-h-24 focus:ring-2 focus:ring-[#096b17] focus:border-transparent" />
                <button onClick={sendChat} disabled={chatBusy || !input.trim()} className="shrink-0 bg-[#096b17] text-white rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40">Send</button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3">
              {selected == null ? (
                <ul className="space-y-1.5">
                  {sections.map((s, i) => (
                    <li key={i} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${s.visible === false ? 'opacity-50 border-gray-100' : 'border-gray-200'}`}>
                      <button onClick={() => setSelected(i)} className="text-left text-sm text-gray-800 flex-1">{i + 1}. {label(s.type)}</button>
                      <div className="flex items-center gap-1 text-gray-400">
                        <button onClick={() => move(i, -1)} disabled={i === 0} className="px-1.5 disabled:opacity-30" title="Up">↑</button>
                        <button onClick={() => move(i, 1)} disabled={i === sections.length - 1} className="px-1.5 disabled:opacity-30" title="Down">↓</button>
                        <button onClick={() => toggleVisible(i)} className="px-1.5" title="Show/hide">{s.visible === false ? '🚫' : '👁'}</button>
                        <button onClick={() => remove(i)} className="px-1.5 hover:text-red-500" title="Remove">✕</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div>
                  <button onClick={() => setSelected(null)} className="text-sm text-gray-500 hover:text-gray-800 mb-3">← All sections</button>
                  <h3 className="font-semibold text-gray-900 text-sm mb-3">{label(sections[selected].type)}</h3>
                  {ConfigForm ? (
                    <ConfigForm config={sections[selected].config} onChange={(c) => setSectionConfig(selected, c)} slug="home" sections={sections} />
                  ) : <p className="text-sm text-gray-500">This section has no editable settings.</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: live preview */}
        <div className="flex-1 overflow-y-auto bg-gray-100">
          {loading ? (
            <div className="h-full grid place-items-center text-gray-400 text-sm">Loading preview…</div>
          ) : sections.length === 0 ? (
            <div className="h-full grid place-items-center text-gray-400 text-sm text-center px-6">No homepage yet. Generate one from the AI Website Builder first.</div>
          ) : (
            <div className="bg-white mx-auto my-4 shadow-sm" style={{ maxWidth: 1100 }}>
              {sections.map((s, i) => (
                <SectionRenderer key={i} section={s} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
