'use client';

import { useState, useEffect, useCallback } from 'react';

// §8 — the guided Google Business Profile flow. The doctor makes the changes in
// their OWN Google account; we do NOT connect via OAuth. We just guide them, tag
// which fields are dangerous BEFORE they touch them (NAP consistency, suspension
// / re-verification risk), and gate on a mandatory "suspension risk" block.
//
// Backed by /api/practice-os/gbp-guide (blocks + per-task progress + the risk
// acknowledgement). Used both inside the onboarding wizard and on the standalone
// /app/zero-to-practice-builder/gbp page — one source of truth.

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

  useEffect(() => {
    (async () => {
      try {
        const d = await fetch('/api/practice-os/gbp-guide', { credentials: 'include' }).then((r) => r.json());
        if (d.success) { setBlocks(d.blocks || []); setProgress(d.progress || {}); }
        else setBlocks([]);
      } catch { setBlocks([]); }
    })();
  }, []);

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
        </div>
      )}

      {/* One nav row: Back · Next/Skip through blocks · Finish on the last one.
          You go in order; a mandatory block must be done to move past it. */}
      {blocks[active] && (() => {
        const b = blocks[active];
        const blockDone = b.tasks.every((_, j) => progress[`${b.key}:${j}`]);
        const isLast = active === blocks.length - 1;
        const goNext = () => { const n = active + 1; setActive(n); setUnlocked((u) => Math.max(u, n)); };
        const goBack = () => setActive((a) => Math.max(0, a - 1));
        const mustDone = mandatoryComplete();
        return (
          <div className="flex items-center flex-wrap gap-3 mt-4">
            {active > 0 && <button onClick={goBack} className="pos-link text-sm" style={{ color: 'var(--muted)' }}>← Back</button>}
            {isLast ? (
              <button onClick={() => { if (mustDone) onDone?.(); }} disabled={!mustDone} className="pos-action" style={{ opacity: mustDone ? 1 : 0.5 }}>Finish &amp; continue →</button>
            ) : (
              <button onClick={goNext} disabled={b.mandatory && !blockDone} className="pos-action" style={{ opacity: b.mandatory && !blockDone ? 0.5 : 1 }}>
                {blockDone ? 'Continue →' : 'Next →'}
              </button>
            )}
            {!isLast && !b.mandatory && !blockDone && <button onClick={goNext} className="pos-link text-sm" style={{ color: 'var(--muted)' }}>Skip this block →</button>}
            {b.mandatory && !blockDone && <span className="text-[13px]" style={{ color: 'var(--orange)' }}>Complete this mandatory block to continue.</span>}
            {isLast && !mustDone && <span className="text-[13px]" style={{ color: 'var(--orange)' }}>Finish the mandatory block to continue.</span>}
          </div>
        );
      })()}

      {renderFooter && renderFooter(mandatoryComplete())}
    </>
  );
}
