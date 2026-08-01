'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Spine, ContextRail, WEEK_THEMES } from './_components';

// The Day view — the core screen. One task, one reason, one orange button.
export default function DayView() {
  const router = useRouter();
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/practice-os/state');
      if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
      if (res.status === 402) { router.push('/app/practice-os/unlock'); return; }
      const data = await res.json();
      if (!data.success) return;
      if (!data.enrollment.setupComplete) { router.push('/app/practice-os/setup'); return; }
      setState(data);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);
  // tick for the locked-day countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;
  }
  if (!state) return null;

  const { today, days, enrollment, score, performance, aiCredits, upcomingAchievement, allComplete, daysAway } = state;

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-6">
      <TopBar name={enrollment} />

      {/* Coming back — lead with what exists, never "missed" (CLAUDE.md §4.3) */}
      {daysAway >= 4 && !allComplete && (
        <div className="pos-card p-5 mb-6 border-l-4" style={{ borderLeftColor: 'var(--green)' }}>
          <p className="pos-label mb-1">Welcome back</p>
          <p className="text-[var(--ink)] font-medium">
            You&apos;ve finished <span className="pos-num">{enrollment.daysCompleted}</span> {enrollment.daysCompleted === 1 ? 'day' : 'days'}. Everything you built is still working while you were away.
          </p>
          <p className="text-sm text-[var(--muted)] mt-1">Day {today?.missionNumber} is simply still next. Pick up where you left off.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] lg:grid-cols-[220px_minmax(0,1fr)_280px] gap-5 lg:gap-6">
        {/* Left — the 30-day spine (desktop only) */}
        <div className="hidden lg:block">
          <Spine days={days} />
        </div>

        {/* Main — the task */}
        <div className="min-w-0">
          {allComplete ? (
            <AllComplete daysCompleted={enrollment.daysCompleted} />
          ) : today?.status === 'locked' ? (
            <LockedDay day={today} nextUnlockAt={enrollment.nextUnlockAt} now={now} devBypass={state.devBypass} onUnlocked={load} />
          ) : today ? (
            <TaskCard day={today} />
          ) : (
            <div className="pos-card p-8 text-center text-[var(--muted)]">No days available yet.</div>
          )}
        </div>

        {/* Right — passive context rail */}
        <div className="min-w-0">
          <ContextRail score={score} performance={performance} aiCredits={aiCredits} upcomingAchievement={upcomingAchievement} enrollment={enrollment} days={days} />
        </div>
      </div>
    </div>
  );
}

function TopBar() {
  const router = useRouter();
  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    router.push('/login');
  };
  return (
    <div className="flex items-center justify-between gap-3 mb-8">
      <Link href="/app" className="flex items-center shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/Logo.svg" alt="CuraGo" className="h-7 sm:h-8 w-auto" />
      </Link>
      <div className="flex items-center gap-x-4 gap-y-1 text-[13px] flex-wrap justify-end">
        <Link href="/app/practice-os/score" className="pos-link">Your progress</Link>
        <Link href="/app/practice-os/journey" className="pos-link">Journey</Link>
        <Link href="/app/practice-os/report" className="pos-link">Report</Link>
        <Link href="/app/practice-os/record" className="pos-link">Your record</Link>
        <button onClick={logout} className="pos-link" style={{ color: 'var(--muted)' }}>Sign out</button>
      </div>
    </div>
  );
}

function TaskCard({ day }) {
  const theme = WEEK_THEMES[day.weekNumber] || 'Practice building';
  return (
    <div className="pos-card p-7">
      <p className="pos-label">Week {day.weekNumber} · {theme}</p>
      <h1 className="text-[26px] md:text-[30px] font-semibold text-[var(--ink)] mt-2 leading-tight" style={{ letterSpacing: '-0.027em', maxWidth: '22ch' }}>
        {day.title}
      </h1>
      {day.purpose && <p className="text-[16.5px] text-[var(--muted)] mt-4 leading-relaxed" style={{ maxWidth: '52ch' }}>{day.purpose}</p>}

      <div className="flex flex-wrap items-center gap-2 mt-5">
        <Chip>{day.estimatedMinutes || 35} min</Chip>
        {day.points > 0 && day.scoreComponent !== 'none' && <Chip>+{day.points} {componentLabel(day.scoreComponent)}</Chip>}
        <Chip>Day {day.missionNumber} of 30</Chip>
      </div>

      <div className="mt-7 flex items-center gap-5">
        <Link href={`/app/practice-os/focus/${day._id}`} className="pos-action pos-focusable inline-flex items-center gap-2">
          Start focus session
        </Link>
        <Link href={`/app/practice-os/focus/${day._id}?quick=1`} className="pos-link text-sm">Just do step one</Link>
      </div>
    </div>
  );
}

function LockedDay({ day, nextUnlockAt, now, devBypass, onUnlocked }) {
  const remaining = nextUnlockAt ? Math.max(0, new Date(nextUnlockAt).getTime() - now) : 0;
  const h = Math.floor(remaining / 3.6e6);
  const m = Math.floor((remaining % 3.6e6) / 6e4);
  const s = Math.floor((remaining % 6e4) / 1000);
  const theme = WEEK_THEMES[day.weekNumber] || 'Practice building';
  return (
    <div className="pos-card p-7">
      <p className="pos-label">Week {day.weekNumber} · {theme} · Opens soon</p>
      <h1 className="text-[26px] md:text-[30px] font-semibold text-[var(--ink)] mt-2 leading-tight" style={{ letterSpacing: '-0.027em', maxWidth: '22ch' }}>
        {day.title}
      </h1>
      {day.purpose && <p className="text-[16.5px] text-[var(--muted)] mt-4 leading-relaxed" style={{ maxWidth: '52ch' }}>{day.purpose}</p>}
      <div className="flex flex-wrap items-center gap-2 mt-5">
        <Chip>{day.estimatedMinutes || 35} min</Chip>
        {day.points > 0 && day.scoreComponent !== 'none' && <Chip>+{day.points} {componentLabel(day.scoreComponent)}</Chip>}
      </div>

      <div className="mt-7 rounded-xl p-5" style={{ background: 'var(--rule-soft)' }}>
        <div className="flex items-baseline gap-2">
          <span className="pos-num text-3xl text-[var(--ink)]">{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</span>
          <span className="pos-label">until it opens</span>
        </div>
        <p className="text-sm text-[var(--muted)] mt-3" style={{ maxWidth: '52ch' }}>
          Tasks build on each other, and some need real time to work — Google verification takes days, review requests take days to come back. Doing five in one evening builds a checklist, not a practice.
        </p>
      </div>

      {devBypass && (
        <button
          onClick={async () => {
            await fetch(`/api/practice-os/day/${day._id}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'dev-unlock' }),
            });
            onUnlocked?.();
          }}
          className="mt-4 text-sm font-medium text-[var(--muted)] underline underline-offset-4 hover:text-[var(--ink)]"
        >
          Dev: open this task now →
        </button>
      )}
    </div>
  );
}

function AllComplete({ daysCompleted }) {
  return (
    <div className="pos-card p-8">
      <p className="pos-label">The programme</p>
      <h1 className="text-[30px] font-semibold text-[var(--ink)] mt-2">You&apos;ve finished all <span className="pos-num">{daysCompleted}</span> days.</h1>
      <p className="text-[var(--muted)] mt-3">Everything you built is yours and keeps running. See the full record of your work.</p>
      <Link href="/app/practice-os/record" className="pos-action inline-block mt-6">See your record</Link>
    </div>
  );
}

function Chip({ children }) {
  return <span className="pos-label" style={{ background: 'var(--rule-soft)', padding: '5px 9px', borderRadius: '7px', color: 'var(--muted)' }}>{children}</span>;
}

function componentLabel(c) {
  return ({ gbp: 'Google Business Profile', reviews: 'Reviews', website: 'Website', systems: 'Systems', social: 'Social' })[c] || '';
}
