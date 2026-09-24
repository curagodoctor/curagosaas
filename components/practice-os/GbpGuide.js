'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// §8 — the guided Google Business Profile flow. The doctor makes the changes in
// their OWN Google account; we do NOT connect via OAuth. We just guide them, tag
// which fields are dangerous BEFORE they touch them (NAP consistency, suspension
// / re-verification risk), and gate on a mandatory "suspension risk" block.
//
// Backed by /api/practice-os/gbp-guide (blocks + per-task progress + the risk
// acknowledgement). Used both inside the onboarding wizard and on the standalone
// /app/control-center/gbp page — one source of truth.

// Field-type tag colours.
const KIND_STYLE = {
  'DO NOT TOUCH': { bg: '#FDECEC', ink: '#96231F' },
  'ONE-TIME': { bg: 'var(--orange-soft)', ink: '#B04E00' },
  'EDITABLE': { bg: 'var(--green-soft)', ink: 'var(--green)' },
  'LEARN': { bg: 'var(--rule-soft)', ink: 'var(--muted)' },
};

// renderFooter(mandatoryComplete) lets the caller supply its own CTA (the wizard
// shows a gated "Continue"; the standalone page shows a "back to setup" link).
export default function GbpGuide({ renderFooter, onDone }) {
  const [blocks, setBlocks] = useState(null);
  const [progress, setProgress] = useState({});
  const [active, setActive] = useState(0);
  const [unlocked, setUnlocked] = useState(0); // highest block reached — go in order
  const [aiResponses, setAiResponses] = useState({}); // { [blockKey]: text }
  const [aiBusy, setAiBusy] = useState('');           // blockKey currently generating
  const [aiInput, setAiInput] = useState('');
  const fired = useRef(new Set());                     // blocks whose prompt auto-ran

  useEffect(() => {
    (async () => {
      try {
        const d = await fetch('/api/practice-os/gbp-guide', { credentials: 'include' }).then((r) => r.json());
        if (d.success) { setBlocks(d.blocks || []); setProgress(d.progress || {}); setAiResponses(d.aiResponses || {}); }
        else setBlocks([]);
      } catch { setBlocks([]); }
    })();
  }, []);

  // Run a block's AI prompt (or a refine message), grounded in the profile.
  const runBlockAi = useCallback(async (blockKey, message) => {
    setAiBusy(blockKey);
    try {
      const d = await fetch('/api/practice-os/gbp-guide/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ blockKey, message: message || '' }),
      }).then((r) => r.json());
      if (d.success && d.reply) setAiResponses((r) => ({ ...r, [blockKey]: d.reply }));
      else setAiResponses((r) => ({ ...r, [blockKey]: (message ? r[blockKey] : '') || (d.message || d.error || 'Could not generate.') }));
    } catch { /* ignore */ } finally { setAiBusy(''); }
  }, []);

  // When a block with an AI prompt becomes active and has no cached response yet,
  // run it once automatically.
  useEffect(() => {
    if (!blocks || !blocks[active]) return;
    const b = blocks[active];
    if (b.aiPrompt && !aiResponses[b.key] && !fired.current.has(b.key)) {
      fired.current.add(b.key);
      runBlockAi(b.key);
    }
  }, [blocks, active, aiResponses, runBlockAi]);

  const mandatoryComplete = useCallback((prog = progress) => {
    const m = (blocks || []).find((b) => b.mandatory);
    if (!m) return true;
    return m.tasks.every((_, i) => prog[`${m.key}:${i}`]);
  }, [blocks, progress]);

  const toggle = (blockKey, i) => {
    const key = `${blockKey}:${i}`;
    const nextProg = { ...progress, [key]: !progress[key] };
    setProgress(nextProg);
    fetch('/api/practice-os/gbp-guide', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ progress: nextProg, riskAcknowledged: mandatoryComplete(nextProg) }),
    }).catch(() => {});
  };

  if (blocks === null) return <p className="text-sm text-[var(--muted)]">Loading…</p>;

  return (
    <>
      {/* Block tabs — sequential: future blocks are locked until you reach them */}
      <div className="flex gap-2 flex-wrap mb-4">
        {blocks.map((b, i) => {
          const done = b.tasks.every((_, j) => progress[`${b.key}:${j}`]);
          const locked = i > unlocked;
          return (
            <button key={b.key} onClick={() => { if (!locked) setActive(i); }} disabled={locked}
              className="text-[13px] px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              style={{ background: i === active ? 'var(--green)' : 'transparent', color: i === active ? '#fff' : locked ? 'var(--rule)' : 'var(--muted)', border: `1px solid ${i === active ? 'var(--green)' : 'var(--rule)'}`, cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.55 : 1 }}>
              {locked ? <span aria-hidden>🔒</span> : done && <span style={{ color: i === active ? '#fff' : 'var(--green)' }}>✓</span>}
              {b.label}
              {b.mandatory && <span className="pos-label" style={{ background: 'var(--orange)', color: '#fff', padding: '1px 5px', borderRadius: 4, fontSize: 9 }}>MUST</span>}
            </button>
          );
        })}
      </div>

      {/* Active block */}
      {blocks[active] && (
        <div className="pos-card p-0 overflow-hidden">
          <div className="p-4" style={{ background: 'var(--paper)', borderBottom: '1px solid var(--rule)' }}>
            <p className="text-[16px] font-semibold text-[var(--ink)]">{blocks[active].title}</p>
            <p className="text-[13px] text-[var(--muted)] mt-0.5">{blocks[active].desc}</p>
          </div>
          <div className="p-3 space-y-2">
            {blocks[active].tasks.map((t, i) => {
              const on = !!progress[`${blocks[active].key}:${i}`];
              const ks = KIND_STYLE[t.kind] || KIND_STYLE.EDITABLE;
              return (
                <button key={i} onClick={() => toggle(blocks[active].key, i)}
                  className="w-full text-left flex items-start gap-3 p-3 rounded-lg"
                  style={{ background: on ? 'var(--green-soft)' : 'var(--card)', border: `1px solid ${on ? 'var(--green)' : 'var(--rule)'}` }}>
                  <span className="shrink-0 grid place-items-center rounded-md mt-0.5" style={{ width: 20, height: 20, background: on ? 'var(--green)' : 'transparent', border: `1.5px solid ${on ? 'var(--green)' : 'var(--rule)'}`, color: '#fff', fontSize: 12 }}>{on ? '✓' : ''}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14.5px] font-medium text-[var(--ink)]" style={{ textDecoration: on ? 'line-through' : 'none' }}>{t.label}</span>
                    <span className="block text-[12.5px] text-[var(--muted)] mt-0.5">{t.hint}</span>
                  </span>
                  <span className="pos-label shrink-0" style={{ background: ks.bg, color: ks.ink, padding: '3px 6px', borderRadius: 5, whiteSpace: 'nowrap' }}>{t.kind}</span>
                </button>
              );
            })}
          </div>

          {/* AI response — only for blocks that have an admin-set AI prompt. Runs
              once when the block loads; the doctor can read, edit and refine it. */}
          {blocks[active].aiPrompt && (
            <div className="p-3 border-t" style={{ borderColor: 'var(--rule)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="pos-label" style={{ color: 'var(--green)' }}>AI briefing for this step</p>
                {aiBusy === blocks[active].key
                  ? <span className="text-[12px] text-[var(--muted)] flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin inline-block" />Thinking…</span>
                  : aiResponses[blocks[active].key] && <button onClick={() => runBlockAi(blocks[active].key)} className="text-[12px] font-medium" style={{ color: 'var(--orange)' }}>↻ Regenerate</button>}
              </div>
              {aiBusy === blocks[active].key && !aiResponses[blocks[active].key] ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8">
                  <span className="w-12 h-12 rounded-full border-[4px] border-[var(--green)] border-t-transparent animate-spin" />
                  <p className="text-[13.5px] font-medium text-[var(--ink)]">Generating a briefing from your practice profile…</p>
                </div>
              ) : (
                <textarea
                  value={aiResponses[blocks[active].key] || ''}
                  onChange={(e) => setAiResponses((r) => ({ ...r, [blocks[active].key]: e.target.value }))}
                  rows={7}
                  className="w-full p-3 text-[13.5px] rounded-lg"
                  style={{ border: '1px solid var(--rule)', background: 'var(--paper)', resize: 'vertical', lineHeight: 1.55, color: 'var(--ink)' }}
                  placeholder="The AI briefing will appear here."
                />
              )}
              <p className="text-[11.5px] text-[var(--muted)] mt-1.5" style={{ lineHeight: 1.5 }}>AI can make mistakes. Check for accuracy and compliance before publishing.</p>
              {/* Small refine chat */}
              <div className="flex items-end gap-2 mt-2">
                <textarea
                  value={aiInput}
                  onChange={(e) => { setAiInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`; }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && aiInput.trim()) { e.preventDefault(); const k = blocks[active].key; runBlockAi(k, aiInput.trim()); setAiInput(''); } }}
                  placeholder="Ask to change it — e.g. add more categories, make it shorter…"
                  rows={1}
                  className="flex-1 rounded-lg px-3 py-2 text-[13px] resize-none" style={{ border: '1px solid var(--rule)', background: 'var(--card)', outline: 'none', maxHeight: 160, lineHeight: 1.5 }}
                />
                <button onClick={() => { const k = blocks[active].key; if (aiInput.trim()) { runBlockAi(k, aiInput.trim()); setAiInput(''); } }} disabled={aiBusy === blocks[active].key || !aiInput.trim()} className="pos-action px-4 shrink-0" style={{ opacity: aiInput.trim() ? 1 : 0.5 }}>Send</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* One nav row: Back · Next/Skip through blocks · Finish on the last one.
          You go in order; a mandatory block must be done to move past it. */}
      {blocks[active] && (() => {
        const b = blocks[active];
        // Every task must be ticked to FINISH a block via Next. Skipping is the
        // only way to advance without completing (non-mandatory blocks only).
        const blockDone = (b.tasks || []).length === 0 || b.tasks.every((_, j) => progress[`${b.key}:${j}`]);
        const isLast = active === blocks.length - 1;
        const mustDone = mandatoryComplete();
        const goNext = () => { const n = active + 1; setActive(n); setUnlocked((u) => Math.max(u, n)); };
        const goBack = () => setActive((a) => Math.max(0, a - 1));
        const skip = () => { if (isLast) { if (mustDone) onDone?.(); } else goNext(); };
        return (
          <div className="flex items-center flex-wrap gap-3 mt-4">
            {active > 0 && <button onClick={goBack} className="pos-link text-sm" style={{ color: 'var(--muted)' }}>← Back</button>}
            {isLast ? (
              <button onClick={() => { if (blockDone && mustDone) onDone?.(); }} disabled={!blockDone || !mustDone} className="pos-action" style={{ opacity: blockDone && mustDone ? 1 : 0.5 }}>Finish &amp; continue →</button>
            ) : (
              <button onClick={goNext} disabled={!blockDone} className="pos-action" style={{ opacity: blockDone ? 1 : 0.5 }}>Next →</button>
            )}
            {/* Skip is only for non-mandatory blocks — advance without completing. */}
            {!b.mandatory && !blockDone && <button onClick={skip} className="pos-link text-sm" style={{ color: 'var(--muted)' }}>Skip this block →</button>}
            {!blockDone && (
              <span className="text-[13px]" style={{ color: 'var(--orange)' }}>
                {b.mandatory ? 'Complete every task to continue.' : 'Complete every task to finish, or skip this block.'}
              </span>
            )}
          </div>
        );
      })()}

      {renderFooter && renderFooter(mandatoryComplete())}
    </>
  );
}
