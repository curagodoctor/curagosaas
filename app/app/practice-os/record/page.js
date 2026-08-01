'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Your record — the doctor's logbook, not a submission (CLAUDE.md §4/§6).
// No approval, no grading. Skipped days show as gaps with no penalty.
export default function RecordPage() {
  const [state, setState] = useState(null);
  useEffect(() => { fetch('/api/practice-os/state').then((r) => r.json()).then(setState); }, []);
  if (!state) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;

  const done = state.days.filter((d) => d.status === 'completed');

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <Link href="/app/practice-os" className="pos-link text-sm">← Back to today</Link>
      <div className="my-8">
        <p className="pos-label mb-1">Your record</p>
        <h1 className="text-2xl font-semibold text-[var(--ink)]" style={{ letterSpacing: '-0.02em' }}>
          <span className="pos-num">{done.length}</span> {done.length === 1 ? 'day' : 'days'} of work you built.
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">Everything here is yours. At Day 30 this is your completion record.</p>
      </div>

      {done.length === 0 ? (
        <div className="pos-card p-8 text-center text-[var(--muted)]">Nothing recorded yet. Finish today&apos;s task and it appears here.</div>
      ) : (
        <div className="space-y-3">
          {state.days.map((d) => {
            if (d.status === 'skipped') {
              return (
                <div key={d._id} className="rounded-xl p-4 border border-dashed" style={{ borderColor: 'var(--rule)' }}>
                  <p className="text-sm text-[var(--muted)]">Day {d.missionNumber} · skipped — that&apos;s fine.</p>
                </div>
              );
            }
            if (d.status !== 'completed') return null;
            const rec = d.record || {};
            return (
              <div key={d._id} className="pos-card p-5">
                <div className="flex justify-between items-baseline">
                  <p className="font-medium text-[var(--ink)]">Day {d.missionNumber} · {d.title}</p>
                  {d.completedAt && <span className="pos-label">{new Date(d.completedAt).toLocaleDateString()}</span>}
                </div>
                {rec.notes && <p className="text-sm text-[var(--muted)] mt-2">{rec.notes}</p>}
                {rec.links?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {rec.links.map((l, i) => <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-[13px] text-[var(--green)] truncate">{l}</a>)}
                  </div>
                )}
                {rec.screenshots?.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {rec.screenshots.map((s, i) => <img key={i} src={s} alt="" className="w-16 h-16 rounded-lg object-cover border" style={{ borderColor: 'var(--rule)' }} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
