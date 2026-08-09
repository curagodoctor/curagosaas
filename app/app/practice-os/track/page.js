'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Spine, ContextRail, WEEK_THEMES } from '../_components';

// The Day view for ONE pack — read via ?pack=<frameworkId>. One task, one reason.
function TrackView() {
  const router = useRouter();
  const params = useSearchParams();
  const packId = params.get('pack');
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const withPack = useCallback((path) => `${path}${path.includes('?') ? '&' : '?'}pack=${packId}`, [packId]);

  const load = useCallback(async () => {
    if (!packId) { router.replace('/app/practice-os'); return; }
    try {
      const res = await fetch(`/api/practice-os/state?pack=${packId}`);
      if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
      if (res.status === 402) { router.push(`/app/practice-os/unlock?pack=${packId}`); return; }
      if (res.status === 404) { router.replace('/app/practice-os'); return; }
      const data = await res.json();
      if (!data.success) return;
      if (!data.enrollment.setupComplete) { router.push(`/app/practice-os/setup?pack=${packId}`); return; }
      setState(data);
    } finally {
      setLoading(false);
    }
  }, [router, packId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;
  }
  if (!state) return null;

  const { pack, today, days, enrollment, score, performance, aiCredits, upcomingAchievement, summary, allComplete, daysAway } = state;
  const totalDays = enrollment.totalDays || days.length;

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 pt-[64px] pb-6">
      <TopBar pack={pack} withPack={withPack} />

      {daysAway >= 4 && !allComplete && (
        <div className="pos-card p-5 mb-6 border-l-4" style={{ borderLeftColor: 'var(--green)' }}>
          <p className="pos-label mb-1">Welcome back</p>
          <p className="text-[var(--ink)] font-medium">
            You&apos;ve finished <span className="pos-num">{enrollment.daysCompleted}</span> {enrollment.daysCompleted === 1 ? 'mission' : 'missions'}. Everything you built is still working while you were away.
          </p>
          <p className="text-sm text-[var(--muted)] mt-1">Mission {today?.missionNumber} is simply still next. Pick up where you left off.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] lg:grid-cols-[220px_minmax(0,1fr)_280px] gap-5 lg:gap-6">
        <div className="hidden lg:block">
          <Spine days={days} totalDays={totalDays} />
        </div>

        <div className="min-w-0">
          {allComplete ? (
            <AllComplete daysCompleted={enrollment.daysCompleted} withPack={withPack} />
          ) : today?.status === 'locked' ? (
            <LockedDay day={today} nextUnlockAt={enrollment.nextUnlockAt} now={now} devBypass={state.devBypass} onUnlocked={load} canAdvance={state.canAdvance} />
          ) : today ? (
            <TaskCard day={today} totalDays={totalDays} withPack={withPack} />
          ) : (
            <div className="pos-card p-8 text-center text-[var(--muted)]">No missions available yet.</div>
          )}
        </div>

        <div className="min-w-0">
          <ContextRail score={score} performance={performance} aiCredits={aiCredits} upcomingAchievement={upcomingAchievement} summary={summary} enrollment={enrollment} days={days} withPack={withPack} />
        </div>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>}>
      <TrackView />
    </Suspense>
  );
}

function TopBar({ pack, withPack }) {
  const router = useRouter();
  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    router.push('/login');
  };
  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-3 px-4 sm:px-8 lg:px-12 py-1.5" style={{ background: 'var(--paper)', borderBottom: '1px solid var(--rule)' }}>
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/app/practice-os" className="flex items-center shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/curago-logo.png" alt="CuraGo" className="h-9 sm:h-10 w-auto" />
        </Link>
        {pack?.title && (
          <>
            <span className="text-[var(--rule)]">/</span>
            <Link href="/app/practice-os" className="text-[13px] text-[var(--muted)] hover:text-[var(--ink)] truncate hidden sm:inline">{pack.title}</Link>
          </>
        )}
      </div>
      <div className="flex items-center gap-x-4 text-[13px] flex-nowrap overflow-x-auto whitespace-nowrap justify-end">
        <Link href="/app/practice-os" className="pos-link">All packs</Link>
        <ProgressMenu withPack={withPack} />
        <Link href="/app/practice-os/schedule" className="pos-link">Schedule</Link>
        <Link href="/app/practice-os/workspace" className="pos-link">Workspace</Link>
        <Link href={withPack('/app/practice-os/leaderboard')} className="pos-link">Leaderboard</Link>
        <Link href="/app/practice-os/profile" className="pos-link">My profile</Link>
        <Link href="/admin/dashboard" className="text-white px-3 py-1 rounded-[7px] font-semibold text-[12.5px] shrink-0" style={{ backgroundColor: 'var(--green)' }}>Website Builder</Link>
        <button onClick={logout} className="pos-link" style={{ color: 'var(--muted)' }}>Sign out</button>
      </div>
    </div>
  );
}

// Groups the four analytics views (Progress / Journey / Report / Record) under a
// single "Progress" button so the header isn't cluttered with lookalike links.
function ProgressMenu({ withPack }) {
  const [open, setOpen] = useState(false);
  const items = [
    ['Your progress', withPack('/app/practice-os/score')],
    ['Journey & record', withPack('/app/practice-os/journey')],
    ['Report', withPack('/app/practice-os/report')],
  ];
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="pos-link inline-flex items-center gap-1">
        Progress
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 pos-card p-1 min-w-[180px]" style={{ boxShadow: '0 12px 32px rgba(16,26,19,.14)' }}>
            {items.map(([label, href]) => (
              <Link key={label} href={href} onClick={() => setOpen(false)} className="block px-3 py-2 text-[13px] rounded-md hover:bg-[var(--rule-soft)]" style={{ color: 'var(--ink)' }}>
                {label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TaskCard({ day, totalDays, withPack }) {
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
        <Chip>Mission {day.missionNumber} of {totalDays}</Chip>
      </div>

      {/* A mission can only be completed by opening it and stepping through its
          modules — no finish-without-opening. */}
      <div className="mt-7">
        <Link href={withPack(`/app/practice-os/focus/${day._id}`)} className="pos-action pos-focusable inline-flex items-center gap-2" style={{ background: 'var(--orange)' }}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M7 5l12 7-12 7V5Z" fill="#fff" /></svg>
          Begin task
        </Link>
      </div>
    </div>
  );
}

function LockedDay({ day, nextUnlockAt, now, onUnlocked, canAdvance }) {
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

      <div className="mt-5">
        {canAdvance ? (
          <>
            <button
              onClick={async () => {
                await fetch(`/api/practice-os/day/${day._id}`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'continue-now' }),
                });
                onUnlocked?.();
              }}
              className="pos-action pos-focusable"
            >
              Do tomorrow&apos;s task today
            </button>
            <p className="text-[12px] text-[var(--muted)] mt-2">You can work one day ahead. After this, the next mission opens on the timer above.</p>
          </>
        ) : (
          <p className="text-[13px] text-[var(--muted)]" style={{ maxWidth: '52ch' }}>
            You&apos;re already one mission ahead — this one opens on the timer above. Working one day at a time is what builds a real practice.
          </p>
        )}
      </div>
    </div>
  );
}

function AllComplete({ daysCompleted, withPack }) {
  return (
    <div className="pos-card p-8">
      <p className="pos-label">This pack</p>
      <h1 className="text-[30px] font-semibold text-[var(--ink)] mt-2">You&apos;ve finished all <span className="pos-num">{daysCompleted}</span> missions.</h1>
      <p className="text-[var(--muted)] mt-3">Everything you built is yours and keeps running. See the full record of your work.</p>
      <Link href={withPack('/app/practice-os/record')} className="pos-action inline-block mt-6">See your record</Link>
    </div>
  );
}

function Chip({ children }) {
  return <span className="pos-label" style={{ background: 'var(--rule-soft)', padding: '5px 9px', borderRadius: '7px', color: 'var(--muted)' }}>{children}</span>;
}

function componentLabel(c) {
  return ({ gbp: 'Google Business Profile', reviews: 'Reviews', website: 'Website', systems: 'Systems', social: 'Social' })[c] || '';
}
