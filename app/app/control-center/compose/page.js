'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const TYPE_LABEL = { blog: 'Blog page', service: 'Service page', gbp: 'GBP post', product: 'Product page' };
const isPageType = (t) => t !== 'gbp';

function ComposeInner() {
  const sp = useSearchParams();
  const idea = sp.get('idea') || '';
  const type = ['blog', 'service', 'gbp', 'product'].includes(sp.get('type')) ? sp.get('type') : 'blog';

  const [content, setContent] = useState('');
  const [state, setState] = useState('loading'); // loading | ready | error
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  // publish modal
  const [showPub, setShowPub] = useState(false);
  const [pubCta, setPubCta] = useState('none');
  const [pubWhen, setPubWhen] = useState('now');
  const [pubAt, setPubAt] = useState('');
  const [publish, setPublish] = useState(null); // 'saving' | { url, scheduled, scheduledAt }

  const generate = useCallback(async () => {
    setState('loading'); setErr('');
    try {
      const d = await (await fetch('/api/practice-os/actions/compose', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ idea, type }) })).json();
      if (d.success) { setContent(d.content || ''); setState('ready'); }
      else { setErr(d.message || d.error || 'Could not generate.'); setState('error'); }
    } catch { setErr('Could not generate.'); setState('error'); }
  }, [idea, type]);
  useEffect(() => { if (idea) generate(); else setState('error'); }, [idea, generate]);

  const copy = () => { try { navigator.clipboard?.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } };

  const suggestedImagePrompt = `Warm, professional editorial photograph for a patient-education article titled "${idea.slice(0, 90)}". A real, welcoming Indian clinic setting with natural light; calm and reassuring. No text, no logos, no graphic or surgical imagery.`;

  const pushBlog = async () => {
    if (publish === 'saving' || !content.trim()) return;
    setPublish('saving'); setErr('');
    try {
      const d = await (await fetch('/api/practice-os/actions/publish-blog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ text: content, cta: pubCta, scheduledAt: pubWhen === 'later' ? pubAt : null }) })).json();
      if (d.success) { setShowPub(false); setPublish({ url: d.url, scheduled: d.scheduled, scheduledAt: d.scheduledAt }); }
      else { setPublish(null); setErr(d.error || 'Could not publish.'); }
    } catch { setPublish(null); setErr('Could not publish.'); }
  };

  return (
    <div className="pos-root" style={{ background: 'var(--paper)', minHeight: '100%' }}>
      <div className="mx-auto max-w-[760px] px-5 md:px-8 py-6">
        <Link href="/app/control-center/search-trends" className="text-[13px] font-semibold inline-flex items-center gap-1 mb-3" style={{ color: 'var(--green)' }}>← Back to Research Agent</Link>
        <div className="text-[10.5px] font-mono uppercase tracking-[0.11em]" style={{ color: 'var(--muted)' }}>{TYPE_LABEL[type]}</div>
        <h1 className="text-[22px] md:text-[26px] font-semibold leading-tight mt-1 mb-4" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>{idea || 'Compose content'}</h1>

        {state === 'loading' && <div className="rounded-xl p-8 text-center text-[14px]" style={{ background: 'var(--card)', border: '1px solid var(--rule-soft)', color: 'var(--muted)' }}>Writing your {TYPE_LABEL[type].toLowerCase()}…</div>}
        {state === 'error' && <div className="rounded-xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--rule-soft)', color: 'var(--ink)' }}>{err || 'No idea provided.'} <button onClick={generate} className="ml-2 font-semibold" style={{ color: 'var(--green)' }}>Try again</button></div>}

        {state === 'ready' && (
          <>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={18} className="w-full px-4 py-3 text-[14.5px] leading-relaxed rounded-[12px]" style={{ border: '1px solid var(--rule)', background: 'var(--card)', color: 'var(--ink)' }} />
            {err && <p className="text-[13px] text-red-600 mt-2">{err}</p>}

            {/* Image prompt (copy for your own image tool) */}
            {isPageType(type) && (
              <div className="mt-3 rounded-lg p-3" style={{ background: 'var(--card)', border: '1px solid var(--rule-soft)' }}>
                <p className="text-[12px] mb-2" style={{ color: 'var(--muted)' }}>Image prompt — paste into your image tool, then add the result on publish.</p>
                <div className="text-[12.5px] rounded-md p-2.5 font-mono" style={{ background: 'var(--paper)', border: '1px solid var(--rule-soft)', color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{suggestedImagePrompt}</div>
                <button onClick={() => { try { navigator.clipboard?.writeText(suggestedImagePrompt); setPromptCopied(true); setTimeout(() => setPromptCopied(false), 1500); } catch { /* ignore */ } }} className="pos-card px-3 py-1.5 text-[13px] font-medium mt-2">{promptCopied ? 'Copied ✓' : 'Copy prompt'}</button>
              </div>
            )}

            <div className="flex flex-wrap gap-2.5 mt-4 items-center">
              <button onClick={copy} className="pos-card px-4 py-2.5 text-[14px] font-medium">{copied ? 'Copied ✓' : 'Copy'}</button>
              <button onClick={generate} className="pos-card px-4 py-2.5 text-[14px] font-medium">↻ Regenerate</button>
              {isPageType(type) && (
                <button onClick={() => { setPubCta('none'); setShowPub(true); }} className="pos-action" style={{ background: 'var(--green)' }}>Push as blog page</button>
              )}
            </div>
            {type === 'gbp' && <p className="text-[12.5px] mt-2" style={{ color: 'var(--muted)' }}>Copy this and paste it into your Google Business Profile post.</p>}
          </>
        )}
      </div>

      {/* Publish options modal */}
      {showPub && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4" style={{ background: 'rgba(16,26,19,.5)' }} onClick={() => setShowPub(false)}>
          <div className="pos-card w-full max-w-[440px] p-6 max-h-[88vh] overflow-y-auto" style={{ background: 'var(--card)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-semibold" style={{ color: 'var(--ink)' }}>Publish this page</h3>
            <p className="pos-label mb-2 mt-4" style={{ color: 'var(--green)' }}>Call to action</p>
            <div className="flex flex-col gap-2 mb-4">
              {[['none', 'No CTA'], ['contact', 'Get in touch'], ['articles', 'Read relevant articles'], ['booking', 'Book an appointment']].map(([v, l]) => (
                <label key={v} className="flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer text-[14px]" style={{ border: '1px solid ' + (pubCta === v ? 'var(--green)' : 'var(--rule-soft)'), background: pubCta === v ? 'rgba(9,107,23,.06)' : 'transparent', color: 'var(--ink)' }}>
                  <input type="radio" name="c-cta" checked={pubCta === v} onChange={() => setPubCta(v)} /> {l}
                </label>
              ))}
            </div>
            <p className="pos-label mb-2" style={{ color: 'var(--green)' }}>When</p>
            <div className="flex flex-col gap-2 mb-1">
              <label className="flex items-center gap-2.5 text-[14px] cursor-pointer" style={{ color: 'var(--ink)' }}><input type="radio" name="c-when" checked={pubWhen === 'now'} onChange={() => setPubWhen('now')} /> Publish now</label>
              <label className="flex items-center gap-2.5 text-[14px] cursor-pointer" style={{ color: 'var(--ink)' }}><input type="radio" name="c-when" checked={pubWhen === 'later'} onChange={() => setPubWhen('later')} /> Schedule for later</label>
              {pubWhen === 'later' && <input type="datetime-local" value={pubAt} onChange={(e) => setPubAt(e.target.value)} className="mt-1 px-3 py-2 text-[14px] rounded-[9px]" style={{ border: '1px solid var(--rule)', background: 'var(--paper)' }} />}
            </div>
            <div className="flex gap-2.5 mt-4 items-center">
              <button onClick={pushBlog} disabled={publish === 'saving' || (pubWhen === 'later' && !pubAt)} className="pos-action" style={{ background: 'var(--green)', opacity: (publish === 'saving' || (pubWhen === 'later' && !pubAt)) ? 0.6 : 1 }}>{publish === 'saving' ? 'Saving…' : pubWhen === 'later' ? 'Schedule page' : 'Publish page'}</button>
              <button onClick={() => setShowPub(false)} className="pos-link text-[13px]" style={{ color: 'var(--muted)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Published confirmation */}
      {publish && typeof publish === 'object' && publish.url && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-5" style={{ background: 'rgba(16,26,19,.45)' }}>
          <div className="pos-card w-full max-w-md p-6 text-center" style={{ background: 'var(--card)' }}>
            <div className="w-12 h-12 rounded-full grid place-items-center mx-auto mb-3" style={{ background: 'rgba(9,107,23,.08)', color: 'var(--green)', fontSize: 22 }}>✓</div>
            <h2 className="text-[20px] font-semibold" style={{ color: 'var(--ink)' }}>{publish.scheduled ? 'Page scheduled' : 'Page published'}</h2>
            <p className="text-[13.5px] mt-1" style={{ color: 'var(--muted)' }}>{publish.scheduled ? 'It will publish automatically on its date.' : 'Your page is live.'}</p>
            <a href={publish.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-[13px] font-semibold" style={{ color: 'var(--green)' }}>{publish.url}</a>
            <button onClick={() => setPublish(null)} className="pos-link text-[13px] mt-4 block mx-auto" style={{ color: 'var(--muted)' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComposePage() {
  return <Suspense fallback={null}><ComposeInner /></Suspense>;
}
