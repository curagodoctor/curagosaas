'use client';

import Link from 'next/link';
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
export function Spine({ days, totalDays, withPack, mode = 'mission' }) {
  const isTask = mode === 'task';
  const noun = isTask ? 'tasks' : 'missions';
  const byWeek = {};
  for (const d of days) (byWeek[d.weekNumber || 1] ??= []).push(d);
  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b);
  // Upcoming (locked) missions fade out gradually: the next one is lightly faded,
  // the one after fainter, the rest just faded — so focus lands on today.
  const currentFlatIndex = days.findIndex((d) => d.isCurrent) >= 0
    ? days.findIndex((d) => d.isCurrent)
    : days.findIndex((d) => d.status === 'available');
  const lockedOpacity = (flatIndex) => {
    const ahead = currentFlatIndex >= 0 ? flatIndex - currentFlatIndex : 99;
    return ahead <= 1 ? 0.68 : ahead === 2 ? 0.48 : ahead === 3 ? 0.38 : 0.3;
  };
  // Clicking a mission in the spine opens it in the focus session:
  //  - completed/skipped → review/redo mode (answers prefilled)
  //  - available (current) → start it
  //  - locked → the record view (nothing to open yet)
  const focusHref = (d) => (withPack ? withPack(`/app/zero-to-practice-builder/focus/${d._id}`) : `/app/zero-to-practice-builder/focus/${d._id}`);
  const recordHref = (d) => {
    if (d.status === 'completed' || d.status === 'skipped') return `${focusHref(d)}&review=1`;
    if (d.status === 'available') return focusHref(d);
    return withPack ? `${withPack('/app/zero-to-practice-builder/journey')}&view=record` : `/app/zero-to-practice-builder/journey?view=record`;
  };

  return (
    <div className="sticky top-6">
      <style>{`
        @keyframes pos-fade-down { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .pos-fade-down { animation: pos-fade-down .4s ease both; }
        @media (prefers-reduced-motion: reduce) { .pos-fade-down { animation: none; } }
      `}</style>
      <p className="pos-label mb-3">Your {totalDays || days.length} {noun}</p>
      <div className="space-y-4">
        {weeks.map((w, wi) => {
          const base = weeks.slice(0, wi).reduce((n, ww) => n + byWeek[ww].length, 0);
          return (
          <div key={w}>
            {!isTask && <p className="pos-label mb-1.5" style={{ fontSize: '9.5px' }}>Week {w} · {WEEK_THEMES[w] || ''}</p>}
            <div className="space-y-0.5">
              {byWeek[w].map((d, di) => {
                const flatIndex = base + di;
                const staggerDelay = `${flatIndex * 35}ms`;
                const done = d.status === 'completed';
                // The current mission is highlighted even if it's locked (waiting
                // for the midnight reset), so it never disappears from the sidebar.
                const current = d.isCurrent || d.status === 'available';
                const skipped = d.status === 'skipped';
                const clickable = done || skipped;
                const rowOpacity = (d.status === 'locked' && !current) ? lockedOpacity(flatIndex) : 1;
                const inner = (
                  <>
                    <span
                      className="w-1.5 rounded-full shrink-0 mt-1"
                      style={{
                        height: current ? 20 : done ? 13 : 7,
                        background: done ? 'var(--green)' : current ? 'var(--orange)' : 'var(--rule)',
                      }}
                    />
                    <span
                      className="text-[12px] leading-snug"
                      style={{
                        color: current || done ? 'var(--ink)' : 'var(--muted)',
                        fontWeight: current ? 600 : 400,
                        textDecoration: skipped ? 'line-through' : 'none',
                      }}
                    >
                      <span className="pos-num mr-1" style={{ color: 'var(--muted)' }}>{d.missionNumber}.</span>{d.title}
                    </span>
                  </>
                );
                const cls = `pos-fade-down flex items-start gap-2 py-1 px-1 -mx-1 rounded-md ${clickable ? 'hover:bg-[var(--rule-soft)] transition-colors' : ''}`;
                return clickable ? (
                  <Link key={d._id} href={recordHref(d)} title={d.title} className={cls} style={{ animationDelay: staggerDelay, opacity: rowOpacity }}>{inner}</Link>
                ) : (
                  <div key={d._id} title={d.title} className={cls} style={{ animationDelay: staggerDelay, opacity: rowOpacity }}>{inner}</div>
                );
              })}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

/** Right column — passive information only, never actionable. */
export function ContextRail({ score, performance, aiCredits, upcomingAchievement, summary, enrollment, days }) {
  const total = score?.total || 0;
  const completed = enrollment?.daysCompleted || 0;
  const totalDays = enrollment?.totalDays || days.length || 0;

  // This week's dots
  const currentWeek = days.find((d) => d.status === 'available')?.weekNumber || 1;
  const weekDays = days.filter((d) => d.weekNumber === currentWeek);
  const weekDone = weekDays.filter((d) => d.status === 'completed').length;

  return (
    <div className="space-y-4 sticky top-6">
      {/* How CuraGo sees you — AI summary from the profile */}
      {summary && (
        <div className="pos-card p-5">
          <p className="pos-label mb-2">How CuraGo sees you</p>
          <p className="text-[13px] text-[var(--ink)] leading-relaxed">{summary}</p>
          <Link href="/app/zero-to-practice-builder/profile" className="pos-link text-[12px] inline-block mt-2">Edit profile →</Link>
        </div>
      )}

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

      {/* Completed — with progress bar */}
      <div className="pos-card p-5">
        <p className="pos-label mb-1">Completed</p>
        <p className="text-[var(--ink)] mb-2"><span className="pos-num text-xl">{completed}</span> of {totalDays} missions finished</p>
        <div className="pos-meter"><span style={{ width: `${totalDays ? Math.round((completed / totalDays) * 100) : 0}%` }} /></div>
        <p className="text-[11px] text-[var(--muted)] mt-1.5">{totalDays ? Math.round((completed / totalDays) * 100) : 0}% complete</p>
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
