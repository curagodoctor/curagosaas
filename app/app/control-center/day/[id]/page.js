'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import PosNav from '@/components/practice-os/PosNav';

// The assistant writes light Markdown. GBP posts / services are copy-pasted into
// Google, which shows literal ** and ### — so flatten Markdown to clean plain
// text for copying.
function toPlainText(md) {
  return String(md || '')
    .replace(/^\s*#{1,6}\s+/gm, '')                 // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1')              // bold
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2')      // italics
    .replace(/`([^`]+)`/g, '$1')                    // inline code
    .replace(/^\s*[-*+]\s+/gm, '• ')                // bullets
    .replace(/^\s*>\s?/gm, '')                      // quotes
    .replace(/^\s*-{3,}\s*$/gm, '')                 // horizontal rules
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)') // links → text (url)
    .replace(/\n{3,}/g, '\n\n')                     // collapse blank runs
    .trim();
}

// The daily-task interface. No lecture, no notes, no modules — the AI response
// for the day's task is generated automatically and shown here. The doctor can
// chat to suggest changes, edit it, copy it, or push it live as a blog page.
function DayInner() {
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const missionId = params.id;
  const packId = search.get('pack');

  const [mission, setMission] = useState(null);   // { title, category }
  const [modules, setModules] = useState([]);     // all modules for this day
  const [modIndex, setModIndex] = useState(0);    // which module we're on
  const [missionButtons, setMissionButtons] = useState([]);
  const [moduleId, setModuleId] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [content, setContent] = useState('');     // the AI response (editable)
  const [thread, setThread] = useState([]);       // visible chat turns
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publish, setPublish] = useState(null);   // null | 'saving' | { url }
  const [finishing, setFinishing] = useState(false);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState([]);          // relevant links (mission buttons)
  const [evidenceRequired, setEvidenceRequired] = useState(false);
  const [evidence, setEvidence] = useState({ link: '', notes: '' });
  const [image, setImage] = useState(null);        // null | 'gen' | { url }
  const [imagePrompt, setImagePrompt] = useState(''); // optional custom image brief
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [primaryAction, setPrimaryAction] = useState(null); // { type, label, url }
  const started = useRef(false);

  const fire = useCallback(async (p, modId, auto) => {
    setGenerating(true); setErr('');
    try {
      const res = await fetch(`/api/practice-os/day/${missionId}/ai`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ prompt: p, moduleId: modId, auto: !!auto }),
      });
      const d = await res.json();
      if (d.needsProfile) { setErr(d.reply || 'Add your specialty, conditions and procedures in Profile first — then reopen this task.'); return null; }
      // This endpoint returns the assistant text as `text` (needsProfile uses
      // `reply`) — accept either. A silent `skipped:true` (auto double-fire guard)
      // has no text, so fall through and reload the saved thread instead.
      const answer = d.text || d.reply;
      if (d.success && answer) { setContent(answer); return answer; }
      if (d.skipped) return null;
      if (d.error === 'NoCredits' || d.creditsRemaining === 0) setErr(d.message || d.error || "You've used today's AI credits.");
      else if (d.error === 'PaymentRequired') setErr('This needs an active plan.');
      else if (d.error) setErr(d.error);
      return null;
    } catch { setErr('The assistant is unavailable right now.'); return null; }
    finally { setGenerating(false); }
  }, [missionId]);

  // Load one module: its prompt, buttons, saved thread — auto-drafting if empty.
  const openModule = useCallback(async (mods, idx, missionBtns) => {
    const mod = mods[idx] || null;
    const modId = mod?.id || null;
    const p = mod?.aiPrompt || (Array.isArray(mod?.aiPrompts) ? mod.aiPrompts[0] : '') || '';
    setModIndex(idx); setModuleId(modId); setPrompt(p);
    setContent(''); setThread([]); setImage(null); setImagePrompt(''); setErr('');
    setLinks([...(missionBtns || []), ...((mod?.buttons || []))].filter((b) => b && (b.url || b.label)));
    try {
      const t = await fetch(`/api/practice-os/day/${missionId}/ai?moduleId=${modId || ''}`, { credentials: 'include' }).then((r) => r.json());
      const visible = (t.messages || []).filter((x) => !x.hidden);
      setThread(visible);
      const lastAssistant = [...visible].reverse().find((x) => x.role === 'assistant');
      if (lastAssistant) setContent(lastAssistant.content);
      else if (p) await fire(p, modId, true);
    } catch { /* leave empty */ }
  }, [missionId, fire]);

  const load = useCallback(async () => {
    try {
      const day = await fetch(`/api/practice-os/day/${missionId}`, { credentials: 'include' }).then((r) => r.json());
      if (!day.success) { router.replace('/app/control-center'); return; }
      const m = day.day || {};
      setMission({ title: m.missionText || m.objective || 'Today’s task', category: m.category || '' });
      setPrimaryAction(m.primaryAction && m.primaryAction.type ? m.primaryAction : { type: 'blog' });
      const mods = (day.modules && day.modules.length) ? day.modules : [{ id: null, aiPrompt: m.aiContext?.systemPrompt || '' }];
      setModules(mods);
      const missionBtns = (m.buttons || []).filter((b) => b && (b.url || b.label));
      setMissionButtons(missionBtns);
      setEvidenceRequired(!!m.evidence?.required);
      if (day.progress?.record) setEvidence({ link: (day.progress.record.links || [])[0] || '', notes: day.progress.record.notes || '' });
      await openModule(mods, 0, missionBtns);
    } catch { router.replace('/app/control-center'); }
    finally { setLoading(false); }
  }, [missionId, router, openModule]);
  useEffect(() => { load(); }, [load]);

  const isLastModule = modIndex >= modules.length - 1;
  const nextModule = () => { if (!isLastModule) { openModule(modules, modIndex + 1, missionButtons); window.scrollTo(0, 0); } };
  const prevModule = () => { if (modIndex > 0) { openModule(modules, modIndex - 1, missionButtons); window.scrollTo(0, 0); } };

  const regenerate = async () => {
    if (!prompt || generating) return;
    setThread([]); setContent(''); setGenerating(true); setErr('');
    try {
      const res = await fetch(`/api/practice-os/day/${missionId}/ai`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        // auto:true → the authored/system prompt is stored HIDDEN (never shown as a
        // chat turn). Without it the full internal prompt leaked into "Suggest a change".
        body: JSON.stringify({ prompt, moduleId, newSession: true, auto: true }),
      });
      const d = await res.json();
      const answer = d.text || d.reply;
      if (d.success && answer) setContent(answer);
      else setErr(d.message || d.error || 'Could not generate.');
    } catch { setErr('The assistant is unavailable right now.'); } finally { setGenerating(false); }
  };

  const send = async () => {
    const msg = chatInput.trim();
    if (!msg || sending) return;
    setSending(true);
    setThread((t) => [...t, { role: 'user', content: msg }]);
    setChatInput('');
    const reply = await fire(msg, moduleId, false);
    if (reply) setThread((t) => [...t, { role: 'assistant', content: reply }]);
    setSending(false);
  };

  const copy = () => { try { navigator.clipboard?.writeText(toPlainText(content)); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ } };

  const genImage = async () => {
    if (image === 'gen') return;
    setImage('gen'); setErr('');
    try {
      const d = await fetch(`/api/practice-os/day/${missionId}/image`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ topic: mission?.title, prompt: imagePrompt.trim() }),
      }).then((r) => r.json());
      if (d.success && d.url) setImage({ url: d.url });
      else { setImage(null); setErr(d.message || d.error || 'Could not generate the image.'); }
    } catch { setImage(null); setErr('Could not generate the image.'); }
  };

  const downloadImage = async () => {
    if (!image?.url) return;
    try {
      const res = await fetch(image.url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `gbp-image-${Date.now()}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch { window.open(image.url, '_blank'); }
  };

  const pushBlog = async () => {
    if (publish === 'saving' || !content.trim()) return;
    setPublish('saving'); setErr('');
    try {
      const d = await fetch('/api/practice-os/actions/publish-blog', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        // Attach the image the doctor generated here, so the blog uses it.
        body: JSON.stringify({ text: content, imageUrl: image?.url || '' }),
      }).then((r) => r.json());
      if (d.success) setPublish({ url: d.url, id: d.id, title: d.title }); // opens the confirmation modal
      else { setPublish(null); setErr(d.error || 'Could not publish.'); }
    } catch { setPublish(null); setErr('Could not publish.'); }
  };

  // Ask for confirmation first — finishing a task is irreversible (it closes).
  const requestFinish = () => {
    if (finishing) return;
    // Evidence gate disabled while the evidence section is hidden.
    setConfirmFinish(true);
  };

  const finishDay = async () => {
    if (finishing) return;
    // Evidence gate disabled while the evidence section is hidden.
    if (false) {
      setConfirmFinish(false);
      setErr('Please add your evidence (a link or a note) before finishing.');
      return;
    }
    setConfirmFinish(false);
    setFinishing(true);
    const record = { links: evidence.link.trim() ? [evidence.link.trim()] : [], notes: evidence.notes.trim(), screenshots: [] };
    try {
      const res = await fetch(`/api/practice-os/day/${missionId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ action: 'complete', record }) });
      const d = await res.json().catch(() => ({}));
      // Hit the daily cap (7 tasks/day) — keep them on the task, show why.
      if (res.status === 429 || d.error === 'DailyCapReached') { setErr(d.message || 'You can finish up to 7 tasks a day. Come back tomorrow.'); setFinishing(false); return; }
      // Access ended (grace over) — view-only until they resubscribe.
      if (d.error === 'AccessEnded') { setErr(d.message || 'Your access has ended — resubscribe to continue.'); setFinishing(false); return; }
    } catch { /* non-blocking */ }
    router.push('/app/control-center');
  };

  if (loading) return <div className="min-h-screen grid place-items-center" style={{ background: 'var(--paper)' }}><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <div className="w-full px-4 sm:px-8 lg:px-12 pt-[64px] pb-12 max-w-[820px] mx-auto">
        <PosNav breadcrumb="Today’s task" />

        {mission?.category && <p className="pos-label mb-1.5" style={{ color: 'var(--orange)' }}>{mission.category}</p>}
        <h1 className="text-[24px] md:text-[30px] font-semibold text-[var(--ink)] leading-tight" style={{ letterSpacing: '-0.027em' }}>{mission?.title}</h1>
        {modules.length > 1 && (
          <div className="flex items-center gap-2 mt-3">
            {modules.map((_, i) => (
              <span key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === modIndex ? 28 : 16, background: i < modIndex ? 'var(--green)' : i === modIndex ? 'var(--orange)' : 'var(--rule)' }} />
            ))}
            <span className="text-[12px] text-[var(--muted)] ml-1">{modules[modIndex]?.title ? `${modules[modIndex].title} · ` : ''}Module {modIndex + 1} of {modules.length}</span>
          </div>
        )}
        <p className="text-[14px] text-[var(--muted)] mt-2">Your content is ready. Suggest changes below, edit it directly, then copy it or push it live.{modules.length > 1 ? ' Finish all modules to complete the day.' : ''}</p>

        {/* The AI response — the hero. Editable. */}
        <div className="pos-card mt-5 p-0 overflow-hidden relative" style={{ borderColor: 'var(--green)' }}>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'var(--green-soft, rgba(9,107,23,.08))', borderBottom: '1px solid var(--rule-soft)' }}>
            <span className="pos-label" style={{ color: 'var(--green)' }}>Generated content · editable</span>
            <button onClick={regenerate} disabled={generating} className="text-[12px] font-medium" style={{ color: 'var(--orange)', opacity: generating ? 0.5 : 1 }}>↻ Regenerate</button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={generating ? '' : 'Your content will appear here.'}
            rows={14}
            className="w-full p-4 text-[15px] outline-none bg-transparent"
            style={{ resize: 'vertical', lineHeight: 1.6, color: 'var(--ink)' }}
          />
          {/* Central "rewriting" overlay so it's obvious the AI is working. */}
          {generating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: 'rgba(247,249,245,.9)', backdropFilter: 'blur(2px)' }}>
              <span className="w-16 h-16 rounded-full border-[5px] border-[var(--green)] border-t-transparent animate-spin" />
              <p className="text-[17px] font-semibold text-[var(--ink)]">Rewriting your content…</p>
              <p className="text-[13px] text-[var(--muted)]">This takes a few seconds.</p>
            </div>
          )}
        </div>
        <p className="text-[12px] text-[var(--muted)] mt-2" style={{ lineHeight: 1.5 }}>AI can make mistakes. Check for accuracy and compliance before publishing.</p>

        {/* Suggest changes — the chat (above the image box: refine copy first). */}
        <div className="mt-6">
          <p className="pos-label mb-2">Suggest a change</p>
          {(() => {
            // Only the doctor's own short suggestions — never the internal authored
            // prompt (defensive against older leaked turns: system prompts are long
            // and carry these markers).
            const isSystemPrompt = (c) => {
              const s = String(c || '');
              return s.length > 400 || /GUARDRAILS:|MECHANISM:|STRUCTURE:|AFTER PUBLISHING|internal reference only/i.test(s);
            };
            const userTurns = thread.filter((m) => m.role === 'user' && !isSystemPrompt(m.content));
            if (!userTurns.length) return null;
            return (
              <div className="space-y-2 mb-3">
                {userTurns.map((m, i) => (
                  <div key={i} className="text-[13.5px] text-right">
                    <span className="inline-block px-3 py-2 rounded-xl" style={{ background: 'var(--green-soft, rgba(9,107,23,.08))', color: 'var(--ink)' }}>{m.content}</span>
                  </div>
                ))}
              </div>
            );
          })()}
          <div className="flex items-end gap-2 pos-card p-0 overflow-hidden">
            <textarea
              value={chatInput}
              onChange={(e) => { setChatInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`; }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="e.g. make it warmer, shorten it, add a line about recovery…"
              rows={1}
              className="flex-1 px-3.5 py-3 text-sm outline-none bg-transparent resize-none"
              style={{ maxHeight: 180, lineHeight: 1.5 }}
            />
            <button onClick={send} disabled={sending || !chatInput.trim()} className="pos-action m-1 px-4 shrink-0" style={{ opacity: chatInput.trim() ? 1 : 0.5 }}>{sending ? '…' : 'Send'}</button>
          </div>
        </div>

        {/* Image for the post — generate + download (mainly for GBP posts). */}
        <div className="pos-card mt-4 p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="pos-label" style={{ color: 'var(--green)' }}>Image for this post</p>
              <p className="text-[12.5px] text-[var(--muted)] mt-0.5">Leave the box empty and we&apos;ll auto-generate from your content, or describe the image you want. Then download it to post alongside your update.</p>
            </div>
            <button onClick={genImage} disabled={image === 'gen'} className="pos-card px-4 py-2.5 text-[14px] font-medium shrink-0" style={{ opacity: image === 'gen' ? 0.6 : 1 }}>
              {image === 'gen' ? 'Generating…' : (image?.url ? '↻ Regenerate image' : '✨ Generate image')}
            </button>
          </div>
          <input
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); genImage(); } }}
            placeholder="Optional: describe the image (e.g. a calm clinic reception, doctor with a patient)…"
            className="w-full mt-3 px-3.5 py-2.5 text-[14px] outline-none rounded-[11px]"
            style={{ border: '1px solid var(--rule)', background: 'var(--paper)' }} />
          {image?.url && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="Generated" className="rounded-xl w-full max-w-[420px]" style={{ border: '1px solid var(--rule)' }} />
              <button onClick={downloadImage} className="pos-action mt-3" style={{ background: 'var(--green)' }}>Download image ↓</button>
            </div>
          )}
        </div>

        {err && <p className="text-[13px] text-red-600 mt-2">{err}</p>}

        {/* Actions */}
        <div className="flex flex-wrap gap-2.5 mt-4 items-center">
          <button onClick={copy} disabled={!content.trim() || finishing} className="pos-card px-4 py-2.5 text-[14px] font-medium" style={{ opacity: content.trim() ? 1 : 0.5 }}>{copied ? 'Copied ✓' : 'Copy'}</button>
          {(!primaryAction || primaryAction.type === 'blog') ? (
            <button onClick={pushBlog} disabled={publish === 'saving' || !content.trim() || finishing} className="pos-action" style={{ background: 'var(--green)' }}>{publish === 'saving' ? 'Publishing…' : 'Push as blog page'}</button>
          ) : (
            <a
              href={primaryAction.url || undefined}
              target={primaryAction.url ? '_blank' : undefined}
              rel="noopener noreferrer"
              onClick={(e) => { if (!primaryAction.url) { e.preventDefault(); setErr(`Add your ${primaryAction.type === 'gemini' ? 'Gemini GBP chat' : 'Google Business Profile'} link in Profile, then reopen this task.`); } }}
              className="pos-action" style={{ background: 'var(--green)', opacity: primaryAction.url ? 1 : 0.6 }}>
              {primaryAction.label || (primaryAction.type === 'gbp' ? 'Open Google Business Profile' : primaryAction.type === 'gemini' ? 'Open Gemini GBP chat' : 'Open')} →
            </a>
          )}
          {isLastModule ? (
            <button onClick={requestFinish} disabled={finishing} className="pos-action inline-flex items-center gap-2" style={{ opacity: finishing ? 0.75 : 1 }}>
              {finishing && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />}
              {finishing ? 'Finishing…' : (modules.length > 1 ? 'Finish task →' : 'Finish task →')}
            </button>
          ) : (
            <button onClick={nextModule} className="pos-action">Next module →</button>
          )}
          {modIndex > 0 && <button onClick={prevModule} className="pos-link text-[13px]" style={{ color: 'var(--muted)' }}>← Previous module</button>}
        </div>

        {/* Relevant links — hidden for now (re-enable later). */}
        {false && (() => {
          const cat = mission?.category || '';
          const defaults = /gbp|google|service|product|photo/i.test(cat)
            ? [{ label: 'Open Google Business Profile', url: 'https://business.google.com/' }]
            : [];
          // Only show links with a REAL http(s) URL — drop unfilled {{token}} buttons.
          const isRealUrl = (u) => /^https?:\/\//i.test(String(u || '').trim());
          const allLinks = [...defaults, ...links].filter((b) => b && isRealUrl(b.url));
          if (!allLinks.length) return null;
          return (
            <div className="mt-8">
              <p className="pos-label mb-2">Relevant links</p>
              <div className="flex flex-wrap gap-2">
                {allLinks.map((b, i) => (
                  <a key={i} href={b.url} target="_blank" rel="noreferrer" className="pos-card px-4 py-2.5 text-[14px] font-medium inline-flex items-center gap-2" style={{ color: 'var(--green)' }}>
                    {b.label || b.url} <span aria-hidden>↗</span>
                  </a>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Evidence — hidden for now (re-enable later). */}
        {false && evidenceRequired && (
          <div className="mt-8 pos-card p-5" style={{ borderColor: 'var(--orange)' }}>
            <p className="pos-label" style={{ color: 'var(--orange)' }}>Evidence required</p>
            <p className="text-[13px] text-[var(--muted)] mt-0.5 mb-3">Add proof that you completed this task — a link to the live post, and/or a short note.</p>
            <input
              value={evidence.link}
              onChange={(e) => setEvidence((v) => ({ ...v, link: e.target.value }))}
              placeholder="Link to the published post / page (optional)"
              className="w-full pos-card p-2.5 text-sm mb-2"
            />
            <textarea
              value={evidence.notes}
              onChange={(e) => setEvidence((v) => ({ ...v, notes: e.target.value }))}
              placeholder="A short note about what you did (optional)"
              rows={2}
              className="w-full pos-card p-2.5 text-sm"
              style={{ resize: 'vertical' }}
            />
          </div>
        )}
      </div>

      {/* Push-as-blog confirmation — stays open until the doctor closes it. */}
      {publish && typeof publish === 'object' && publish.url && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-5" style={{ background: 'rgba(16,26,19,.45)' }}>
          <div className="pos-card w-full max-w-md p-6" style={{ background: 'var(--card)' }} onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full grid place-items-center mx-auto mb-3" style={{ background: 'var(--green-soft, rgba(9,107,23,.08))', color: 'var(--green)', fontSize: 22 }}>✓</div>
            <h2 className="text-[20px] font-semibold text-[var(--ink)] text-center" style={{ letterSpacing: '-0.02em' }}>Blog page published</h2>
            <p className="text-[13.5px] text-[var(--muted)] text-center mt-1">Your page is live. View it, or edit and republish.</p>
            {publish.title && <p className="text-[14px] font-medium text-[var(--ink)] text-center mt-3">{publish.title}</p>}
            <div className="flex items-center gap-2 mt-3 rounded-xl p-2.5" style={{ background: 'var(--paper)', border: '1px solid var(--rule)' }}>
              <span className="text-[12.5px] text-[var(--muted)] truncate flex-1">{publish.url}</span>
              <button onClick={() => { try { navigator.clipboard?.writeText(publish.url); } catch { /* ignore */ } }} className="text-[12px] font-semibold shrink-0" style={{ color: 'var(--green)' }}>Copy link</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5">
              <a href={publish.url} target="_blank" rel="noreferrer" className="pos-action text-center" style={{ background: 'var(--green)' }}>View live page →</a>
              {publish.id && (
                <button onClick={() => router.push(`/admin/dashboard/blog-articles/${publish.id}`)} className="rounded-[10px] px-4 py-3 text-[14px] font-semibold text-center" style={{ border: '1px solid var(--rule)', color: 'var(--ink)', background: 'var(--card)' }}>Edit</button>
              )}
            </div>
            <button onClick={() => setPublish(null)} className="pos-link text-[13px] mt-4 block mx-auto" style={{ color: 'var(--muted)' }}>Close</button>
          </div>
        </div>
      )}

      {/* Finish-task confirmation — finishing closes the task for good. */}
      {confirmFinish && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-5" style={{ background: 'rgba(16,26,19,.45)' }} onClick={() => setConfirmFinish(false)}>
          <div className="pos-card w-full max-w-md p-6" style={{ background: 'var(--card)' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[20px] font-semibold text-[var(--ink)] text-center" style={{ letterSpacing: '-0.02em' }}>Are you sure you&apos;ve done this task?</h2>
            <p className="text-[13.5px] text-[var(--muted)] text-center mt-2" style={{ lineHeight: 1.55 }}>Once you finish, this task is marked done and closed — you won&apos;t be able to come back to it.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5">
              <button onClick={finishDay} className="pos-action text-center">Confirm — finish task</button>
              <button onClick={() => setConfirmFinish(false)} className="rounded-[10px] px-4 py-3 text-[14px] font-semibold text-center" style={{ border: '1px solid var(--rule)', color: 'var(--ink)', background: 'var(--card)' }}>Not yet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>}>
      <DayInner />
    </Suspense>
  );
}
