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

  const load = useCallback(async () => {
    try {
      const day = await fetch(`/api/practice-os/day/${missionId}`, { credentials: 'include' }).then((r) => r.json());
      if (!day.success) { router.replace('/app/zero-to-practice-builder'); return; }
      const m = day.day || {};
      setMission({ title: m.missionText || m.objective || 'Today’s task', category: m.category || '' });
      const mod = (day.modules || [])[0] || null;
      const modId = mod?.id || null;
      const p = mod?.aiPrompt || (Array.isArray(mod?.aiPrompts) ? mod.aiPrompts[0] : '') || m.aiContext?.systemPrompt || '';
      setModuleId(modId); setPrompt(p);

      // Existing thread — if the AI already answered, show it; else generate now.
      const t = await fetch(`/api/practice-os/day/${missionId}/ai?moduleId=${modId || ''}`, { credentials: 'include' }).then((r) => r.json());
      const visible = (t.messages || []).filter((x) => !x.hidden);
      setThread(visible);
      const lastAssistant = [...visible].reverse().find((x) => x.role === 'assistant');
      if (lastAssistant) setContent(lastAssistant.content);
      else if (p && !started.current) { started.current = true; await fire(p, modId, true); }
    } catch { router.replace('/app/zero-to-practice-builder'); }
    finally { setLoading(false); }
  }, [missionId, router, fire]);
  useEffect(() => { load(); }, [load]);

  const regenerate = async () => {
    if (!prompt || generating) return;
    setThread([]); setContent(''); setGenerating(true); setErr('');
    try {
      const res = await fetch(`/api/practice-os/day/${missionId}/ai`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ prompt, moduleId, newSession: true }),
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

  const pushBlog = async () => {
    if (publish === 'saving' || !content.trim()) return;
    setPublish('saving'); setErr('');
    try {
      const d = await fetch('/api/practice-os/actions/publish-blog', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ text: content }),
      }).then((r) => r.json());
      if (d.success) setPublish({ url: d.url });
      else { setPublish(null); setErr(d.error || 'Could not publish.'); }
    } catch { setPublish(null); setErr('Could not publish.'); }
  };

  const finishDay = async () => {
    if (finishing) return;
    setFinishing(true);
    try { await fetch(`/api/practice-os/day/${missionId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ action: 'complete' }) }); } catch { /* non-blocking */ }
    router.push('/app/zero-to-practice-builder');
  };

  if (loading) return <div className="min-h-screen grid place-items-center" style={{ background: 'var(--paper)' }}><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <div className="w-full px-4 sm:px-8 lg:px-12 pt-[64px] pb-12 max-w-[820px] mx-auto">
        <PosNav breadcrumb="Today’s task" />

        {mission?.category && <p className="pos-label mb-1.5" style={{ color: 'var(--orange)' }}>{mission.category}</p>}
        <h1 className="text-[24px] md:text-[30px] font-semibold text-[var(--ink)] leading-tight" style={{ letterSpacing: '-0.027em' }}>{mission?.title}</h1>
        <p className="text-[14px] text-[var(--muted)] mt-2">Your content is ready. Suggest changes below, edit it directly, then copy it or push it live.</p>

        {/* The AI response — the hero. Editable. */}
        <div className="pos-card mt-5 p-0 overflow-hidden" style={{ borderColor: 'var(--green)' }}>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'var(--green-soft, rgba(9,107,23,.08))', borderBottom: '1px solid var(--rule-soft)' }}>
            <span className="pos-label" style={{ color: 'var(--green)' }}>Generated content · editable</span>
            {generating
              ? <span className="text-[12px] text-[var(--muted)] flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin inline-block" />Writing…</span>
              : <button onClick={regenerate} className="text-[12px] font-medium" style={{ color: 'var(--orange)' }}>↻ Regenerate</button>}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={generating ? 'Generating your content…' : 'Your content will appear here.'}
            rows={14}
            className="w-full p-4 text-[15px] outline-none bg-transparent"
            style={{ resize: 'vertical', lineHeight: 1.6, color: 'var(--ink)' }}
          />
        </div>

        {err && <p className="text-[13px] text-red-600 mt-2">{err}</p>}

        {/* Actions */}
        <div className="flex flex-wrap gap-2.5 mt-4">
          <button onClick={copy} disabled={!content.trim() || finishing} className="pos-card px-4 py-2.5 text-[14px] font-medium" style={{ opacity: content.trim() ? 1 : 0.5 }}>{copied ? 'Copied ✓' : 'Copy'}</button>
          <button onClick={pushBlog} disabled={publish === 'saving' || !content.trim() || finishing} className="pos-action" style={{ background: 'var(--green)' }}>{publish === 'saving' ? 'Publishing…' : 'Push as blog page'}</button>
          <button onClick={finishDay} disabled={finishing} className="pos-action inline-flex items-center gap-2" style={{ opacity: finishing ? 0.75 : 1 }}>
            {finishing && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />}
            {finishing ? 'Finishing…' : 'Finish task →'}
          </button>
        </div>
        {publish?.url && (
          <p className="text-[13px] mt-2" style={{ color: 'var(--green)' }}>Published live. <a href={publish.url} target="_blank" rel="noreferrer" className="pos-link underline">Preview →</a></p>
        )}

        {/* Suggest changes — the chat */}
        <div className="mt-8">
          <p className="pos-label mb-2">Suggest a change</p>
          {thread.filter((m) => m.role === 'user').length > 0 && (
            <div className="space-y-2 mb-3">
              {thread.map((m, i) => (
                <div key={i} className={`text-[13.5px] ${m.role === 'user' ? 'text-right' : 'hidden'}`}>
                  <span className="inline-block px-3 py-2 rounded-xl" style={{ background: 'var(--green-soft, rgba(9,107,23,.08))', color: 'var(--ink)' }}>{m.content}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-stretch gap-2 pos-card p-0 overflow-hidden">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="e.g. make it warmer, shorten it, add a line about recovery…"
              className="flex-1 px-3.5 py-3 text-sm outline-none bg-transparent"
            />
            <button onClick={send} disabled={sending || !chatInput.trim()} className="pos-action m-1 px-4" style={{ opacity: chatInput.trim() ? 1 : 0.5 }}>{sending ? '…' : 'Send'}</button>
          </div>
        </div>
      </div>
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
