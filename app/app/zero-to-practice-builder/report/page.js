'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PosNav from '@/components/practice-os/PosNav';

// The Month / Progress report (PRD §20, §23) — a ledger of real work done, never
// promised results, ending with the doctor's own day-0 goal quoted back.
function ReportInner() {
  const router = useRouter();
  const params = useSearchParams();
  const packId = params.get('pack');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!packId) { router.replace('/app/zero-to-practice-builder'); return; }
    try {
      const res = await fetch(`/api/practice-os/report?pack=${packId}`);
      if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
      if (res.status === 402) { router.push('/app/zero-to-practice-builder/unlock'); return; }
      const data = await res.json();
      if (!data.success) return;
      setReport(data.report);
    } finally {
      setLoading(false);
    }
  }, [router, packId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;
  }
  if (!report) return null;

  const {
    daysCompleted, totalDays, timeInvestedMinutes,
    performance, visibilityScore, kpis, achievements, intentSixMonths, generatedAt,
  } = report;

  const hours = Math.floor((timeInvestedMinutes || 0) / 60);
  const mins = (timeInvestedMinutes || 0) % 60;
  const generatedLabel = generatedAt
    ? new Date(generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="max-w-2xl mx-auto px-5 pt-[64px] pb-10">
      {/* Shared nav — hidden when printed */}
      <div className="print:hidden"><PosNav /></div>

      {/* Controls — hidden when printed */}
      <div className="flex items-center justify-between pt-6 print:hidden">
        <Link href={`/app/zero-to-practice-builder/track?pack=${packId}`} className="pos-link text-sm">← Back to today</Link>
        <button onClick={() => window.print()} className="pos-link text-sm pos-focusable">
          Print / Save as PDF
        </button>
      </div>

      {/* Header */}
      <div className="my-8">
        <p className="pos-label mb-1">Your progress so far</p>
        <h1 className="text-[var(--ink)] font-semibold" style={{ fontSize: 'clamp(26px,3vw,38px)', letterSpacing: '-0.027em' }}>
          The work you&apos;ve done
        </h1>
        {generatedLabel && <p className="text-sm text-[var(--muted)] mt-1">As of {generatedLabel}</p>}
      </div>

      {/* Summary — days, time, streak */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="pos-card p-5 text-center">
          <div><span className="pos-num text-4xl text-[var(--green)]">{daysCompleted}</span><span className="text-[var(--muted)] text-sm"> / {totalDays}</span></div>
          <p className="pos-label mt-2">Days completed</p>
        </div>
        <div className="pos-card p-5 text-center">
          <div>
            <span className="pos-num text-4xl text-[var(--ink)]">{hours}</span><span className="text-[var(--muted)] text-sm">h </span>
            <span className="pos-num text-2xl text-[var(--ink)]">{mins}</span><span className="text-[var(--muted)] text-sm">m</span>
          </div>
          <p className="pos-label mt-2">Time invested</p>
        </div>
        <div className="pos-card p-5 text-center">
          <div><span className="pos-num text-4xl text-[var(--ink)]">{performance.longestStreak}</span></div>
          <p className="pos-label mt-2">Longest streak</p>
        </div>
      </div>

      {/* Visibility Score */}
      <section className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[var(--ink)] font-semibold text-lg">Visibility Score</h2>
          <div><span className="pos-num text-2xl text-[var(--green)]">{visibilityScore.total}</span><span className="text-[var(--muted)] text-sm"> / 100</span></div>
        </div>
        <div className="pos-card p-5 space-y-4">
          {visibilityScore.components.map((c) => (
            <div key={c.key}>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-sm text-[var(--ink)]">{c.label}</span>
                <span className="pos-num text-sm text-[var(--muted)]">{c.value}/{c.weight}</span>
              </div>
              <div className="pos-meter"><span style={{ width: `${Math.round((c.value / c.weight) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      {/* Performance breakdown */}
      <section className="mb-8">
        <h2 className="text-[var(--ink)] font-semibold text-lg mb-3">How you&apos;ve worked</h2>
        <div className="pos-card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Execution', value: performance.execution },
            { label: 'Consistency', value: performance.consistency },
            { label: 'Learning', value: performance.learning },
            { label: 'Overall', value: performance.overall },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <div><span className="pos-num text-3xl text-[var(--ink)]">{m.value}</span></div>
              <p className="pos-label mt-1">{m.label}</p>
            </div>
          ))}
        </div>
        <p className="text-[13px] text-[var(--muted)] mt-2">Current streak: <span className="pos-num">{performance.currentStreak}</span>.</p>
      </section>

      {/* KPI deltas — what actually moved in the world */}
      {kpis.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[var(--ink)] font-semibold text-lg mb-3">What moved</h2>
          <div className="pos-card divide-y" style={{ borderColor: 'var(--rule)' }}>
            {kpis.map((k) => {
              const up = k.delta > 0;
              const flat = k.delta === 0;
              return (
                <div key={k.key} className="flex items-center justify-between p-4" style={{ borderColor: 'var(--rule-soft)' }}>
                  <span className="text-sm text-[var(--ink)]">{k.label}{k.unit ? ` (${k.unit})` : ''}</span>
                  <span className="pos-num text-sm">
                    <span className="text-[var(--muted)]">{k.first}</span>
                    <span className="text-[var(--muted)]"> → </span>
                    <span className="text-[var(--ink)]">{k.latest}</span>
                    {!flat && (
                      <span className={up ? 'text-[var(--green)]' : 'text-[var(--muted)]'}> ({up ? '+' : ''}{k.delta})</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Achievements */}
      {achievements.count > 0 && (
        <section className="mb-8">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[var(--ink)] font-semibold text-lg">Milestones reached</h2>
            <span className="pos-num text-2xl text-[var(--green)]">{achievements.count}</span>
          </div>
          <div className="pos-card p-5 space-y-2">
            {achievements.recent.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-[var(--ink)]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} />
                {a.title}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* The day-0 goal, quoted back with the real numbers */}
      {intentSixMonths ? (
        <section className="pos-card p-6 mb-8" style={{ borderLeftWidth: 4, borderLeftColor: 'var(--green)' }}>
          <p className="pos-label mb-2">When you started, you said you wanted</p>
          <p className="text-[var(--ink)]" style={{ fontSize: '18px', lineHeight: 1.5 }}>&ldquo;{intentSixMonths}&rdquo;</p>
          <p className="text-sm text-[var(--muted)] mt-4">
            So far you&apos;ve finished <span className="pos-num text-[var(--ink)]">{daysCompleted}</span> of <span className="pos-num text-[var(--ink)]">{totalDays}</span> days
            and put in <span className="pos-num text-[var(--ink)]">{hours}h {mins}m</span>. Patients find you over months, not days — this is the work that gets you there.
          </p>
        </section>
      ) : (
        <p className="text-sm text-[var(--muted)] mb-8">Everything above is yours and keeps running whether you continue or not.</p>
      )}
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>}>
      <ReportInner />
    </Suspense>
  );
}
