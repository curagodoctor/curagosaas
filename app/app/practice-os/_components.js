'use client';

import { SCORE_WEIGHTS, SCORE_LABELS } from './_score';

// Week themes (CLAUDE.md §3 curriculum).
export const WEEK_THEMES = {
  1: 'Get found',
  2: 'Look credible',
  3: 'Be chosen',
  4: 'Run it without you',
};

/**
 * The 30-day spine. Treatment-chart grammar: green behind you, one orange mark
 * where you are, hairlines ahead. Locked day = paper, never orange.
 */
export function Spine({ days }) {
  const byWeek = {};
  for (const d of days) (byWeek[d.weekNumber || 1] ??= []).push(d);
  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b);

  return (
    <div className="sticky top-6">
      <p className="pos-label mb-3">Your 30 days</p>
      <div className="space-y-4">
        {weeks.map((w) => (
          <div key={w}>
            <p className="pos-label mb-1.5" style={{ fontSize: '9.5px' }}>Week {w} · {WEEK_THEMES[w] || ''}</p>
            <div className="space-y-0.5">
              {byWeek[w].map((d) => {
                const done = d.status === 'completed';
                const current = d.status === 'available';
                const skipped = d.status === 'skipped';
                return (
                  <div key={d._id} className="flex items-center gap-2 py-0.5">
                    <span
                      className="w-1.5 rounded-full shrink-0"
                      style={{
                        height: current ? 20 : done ? 13 : 7,
                        background: done ? 'var(--green)' : current ? 'var(--orange)' : 'var(--rule)',
                      }}
                    />
                    <span
                      className="text-[12px] truncate"
                      style={{
                        color: current ? 'var(--ink)' : done ? 'var(--ink)' : 'var(--muted)',
                        fontWeight: current ? 600 : 400,
                        textDecoration: skipped ? 'line-through' : 'none',
                        opacity: d.status === 'locked' ? 0.6 : 1,
                      }}
                    >
                      {d.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Right column — passive information only, never actionable. */
export function ContextRail({ score, performance, aiCredits, upcomingAchievement, enrollment, days }) {
  const total = score?.total || 0;
  const completed = enrollment?.daysCompleted || 0;
  const totalDays = enrollment?.totalDays || days.length || 30;

  // This week's dots
  const currentWeek = days.find((d) => d.status === 'available')?.weekNumber || 1;
  const weekDays = days.filter((d) => d.weekNumber === currentWeek);
  const weekDone = weekDays.filter((d) => d.status === 'completed').length;

  return (
    <div className="space-y-4 sticky top-6">
      {/* Visibility Score */}
      <div className="pos-card p-5">
        <p className="pos-label mb-2">Visibility Score</p>
        <div className="flex items-baseline gap-1">
          <span className="pos-num text-4xl text-[var(--green)]">{total}</span>
          <span className="text-[var(--muted)] text-sm">/ 100</span>
        </div>
        <div className="mt-3 space-y-2">
          {Object.keys(SCORE_WEIGHTS).map((key) => {
            const val = score?.components?.[key] || 0;
            const pct = Math.round((val / SCORE_WEIGHTS[key]) * 100);
            return (
              <div key={key}>
                <div className="flex justify-between text-[11px] text-[var(--muted)] mb-0.5">
                  <span>{SCORE_LABELS[key]}</span>
                  <span className="pos-num">{val}/{SCORE_WEIGHTS[key]}</span>
                </div>
                <div className="pos-meter"><span style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Score + streak (§6, §10) */}
      {performance && (
        <div className="pos-card p-5">
          <p className="pos-label mb-2">Performance</p>
          <div className="flex items-baseline gap-3">
            <span className="pos-num text-3xl text-[var(--ink)]">{performance.overall}</span>
            {performance.currentStreak > 0 && (
              <span className="text-[13px] text-[var(--muted)]">🔥 <span className="pos-num">{performance.currentStreak}</span> streak</span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[['Execution', performance.execution], ['Consistency', performance.consistency], ['Learning', performance.learning]].map(([label, val]) => (
              <div key={label}>
                <p className="pos-num text-[var(--ink)]">{val}</p>
                <p className="text-[10px] text-[var(--muted)]">{label}</p>
              </div>
            ))}
          </div>
          {performance.longestStreak > 0 && (
            <p className="text-[11px] text-[var(--muted)] mt-3">Best streak: <span className="pos-num">{performance.longestStreak}</span></p>
          )}
        </div>
      )}

      {/* Completed */}
      <div className="pos-card p-5">
        <p className="pos-label mb-1">Completed</p>
        <p className="text-[var(--ink)]"><span className="pos-num text-xl">{completed}</span> of {totalDays} days finished</p>
      </div>

      {/* This week */}
      <div className="pos-card p-5">
        <p className="pos-label mb-2">This week</p>
        <div className="flex gap-1.5">
          {weekDays.map((d, i) => (
            <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: d.status === 'completed' ? 'var(--green)' : 'var(--rule)' }} />
          ))}
        </div>
        <p className="text-[11px] text-[var(--muted)] mt-2">{weekDone} of {weekDays.length} done this week</p>
      </div>

      {/* Upcoming achievement + AI credits */}
      {(upcomingAchievement || aiCredits) && (
        <div className="pos-card p-5 space-y-3">
          {upcomingAchievement && (
            <div>
              <p className="pos-label mb-1">Next up</p>
              <p className="text-[13px] text-[var(--ink)]">{upcomingAchievement.title}</p>
              <p className="text-[11px] text-[var(--muted)]"><span className="pos-num">{upcomingAchievement.remaining}</span> mission{upcomingAchievement.remaining === 1 ? '' : 's'} to go</p>
            </div>
          )}
          {aiCredits && (
            <div>
              <p className="pos-label mb-1">AI credits today</p>
              <p className="text-[13px] text-[var(--ink)]"><span className="pos-num">{aiCredits.remaining}</span> of {aiCredits.dailyLimit} left</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
