'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PosNav from '@/components/practice-os/PosNav';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { SCORE_WEIGHTS, SCORE_LABELS } from '../_score';

// Visibility Score — a diagnostic, not a trophy (CLAUDE.md §5).
function ScoreInner() {
  const router = useRouter();
  const params = useSearchParams();
  const packId = params.get('pack');
  const [state, setState] = useState(null);
  const [kpiSeries, setKpiSeries] = useState([]);
  useEffect(() => {
    if (!packId) { router.replace('/app/practice-os'); return; }
    fetch(`/api/practice-os/state?pack=${packId}`).then((r) => r.json()).then(setState);
    fetch(`/api/practice-os/kpis?pack=${packId}`).then((r) => r.json()).then((d) => setKpiSeries(d.success ? d.series : []));
  }, [packId, router]);
  if (!state) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;

  const { score, days, performance } = state;

  const rows = Object.keys(SCORE_WEIGHTS).map((key) => {
    const val = score?.components?.[key] || 0;
    const weight = SCORE_WEIGHTS[key];
    const gap = weight - val;
    // The earliest not-yet-done day that builds this component closes the gap.
    const nextDay = days.find((d) => d.scoreComponent === key && d.status !== 'completed');
    return { key, val, weight, gap, nextDay };
  });

  return (
    <div className="max-w-xl mx-auto px-5 pt-[64px] pb-10">
      <PosNav breadcrumb={state.pack?.title} />

      <Link href={`/app/practice-os/track?pack=${packId}`} className="pos-link text-sm inline-block mt-6">← Back to today</Link>

      <div className="text-center mt-6 mb-8">
        <p className="pos-label mb-1">Visibility Score</p>
        <div><span className="pos-num text-6xl text-[var(--green)]">{score?.total || 0}</span><span className="text-[var(--muted)]"> / 100</span></div>
        <p className="text-sm text-[var(--muted)] mt-2" style={{ maxWidth: '40ch', margin: '8px auto 0' }}>How findable and credible your practice is. Every point is something a patient can see.</p>
      </div>

      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.key} className="pos-card p-5">
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-medium text-[var(--ink)]">{SCORE_LABELS[r.key]}</span>
              <span className="pos-num text-sm text-[var(--muted)]">{r.val}/{r.weight}</span>
            </div>
            <div className="pos-meter mb-2"><span style={{ width: `${Math.round((r.val / r.weight) * 100)}%` }} /></div>
            {r.gap > 0 ? (
              <p className="text-[13px] text-[var(--muted)]">
                {r.gap} points to go.{' '}
                {r.nextDay ? <span>Day {r.nextDay.missionNumber} closes part of this.</span> : <span>More days build this later.</span>}
              </p>
            ) : (
              <p className="text-[13px] text-[var(--green)]">Complete.</p>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-[var(--muted)] mt-8" style={{ maxWidth: '44ch', margin: '32px auto 0' }}>
        You don&apos;t need to plan — following the programme closes these in order.
      </p>

      {/* Performance Score (§10) */}
      {performance && (
        <div className="mt-12">
          <p className="pos-label mb-3">Performance</p>
          <div className="pos-card p-5">
            <div className="flex items-baseline gap-3">
              <span className="pos-num text-4xl text-[var(--ink)]">{performance.overall}</span>
              <span className="text-sm text-[var(--muted)]">overall</span>
              {performance.currentStreak > 0 && <span className="text-sm text-[var(--muted)] ml-auto">🔥 {performance.currentStreak} in a row · best {performance.longestStreak}</span>}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
              {[['Execution', performance.execution], ['Consistency', performance.consistency], ['Learning', performance.learning]].map(([label, val]) => (
                <div key={label} className="rounded-lg py-3" style={{ background: 'var(--rule-soft)' }}>
                  <p className="pos-num text-2xl text-[var(--ink)]">{val}</p>
                  <p className="text-[11px] text-[var(--muted)] mt-1">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-[var(--muted)] mt-3">
              Execution rewards finishing on time; consistency rewards showing up; learning rewards evidence, reflection and using the assistant.
            </p>
          </div>
        </div>
      )}

      {/* KPI graphs (§11) */}
      {kpiSeries.length > 0 && (
        <div className="mt-12">
          <p className="pos-label mb-3">Your numbers over time</p>
          <div className="space-y-4">
            {kpiSeries.map((s) => (
              <div key={s.key} className="pos-card p-5">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="font-medium text-[var(--ink)]">{s.label}{s.unit ? ` (${s.unit})` : ''}</span>
                  <span className="pos-num text-sm text-[var(--muted)]">{s.points[s.points.length - 1]?.value}</span>
                </div>
                <div style={{ width: '100%', height: 160 }}>
                  <ResponsiveContainer>
                    <LineChart data={s.points.map((p) => ({ date: new Date(p.recordedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), value: p.value }))}>
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--rule)' }} />
                      <Line type="monotone" dataKey="value" stroke="var(--green)" strokeWidth={2} dot={{ r: 3, fill: 'var(--green)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>}>
      <ScoreInner />
    </Suspense>
  );
}
