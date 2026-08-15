'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import WorkspaceDrawer from '@/components/practice-os/WorkspaceDrawer';
import PosNav from '@/components/practice-os/PosNav';
import { Spine, ContextRail, WEEK_THEMES } from '../_components';

// The Day view for ONE pack — read via ?pack=<frameworkId>. One task, one reason.
function TrackView() {
  const router = useRouter();
  const params = useSearchParams();
  const packId = params.get('pack');
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [missionData, setMissionData] = useState(null); // { modules, day, progress } for the current available mission (used by the inline intro + assistant)

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

  // Fetch the current available mission's modules once — shared by the inline
  // mission intro (module list) and the assistant in the rail.
  const todayId = state?.today?.status === 'available' && !state?.allComplete ? state.today._id : null;
  useEffect(() => {
    if (!todayId) { setMissionData(null); return; }
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/practice-os/day/${todayId}`);
        if (res.ok) { const d = await res.json(); if (alive && d.success) setMissionData({ modules: d.modules || [], day: d.day || null, progress: d.progress || null }); }
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, [todayId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;
  }
  if (!state) return null;

  const { pack, today, days, enrollment, score, performance, aiCredits, upcomingAchievement, summary, allComplete, daysAway } = state;
  const totalDays = enrollment.totalDays || days.length;

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 pt-[64px] pb-6">
      <PosNav breadcrumb={pack?.title} />

      {daysAway >= 4 && !allComplete && (
        <div className="pos-card p-5 mb-6 border-l-4" style={{ borderLeftColor: 'var(--green)' }}>
          <p className="pos-label mb-1">Welcome back</p>
          <p className="text-[var(--ink)] font-medium">
            You&apos;ve finished <span className="pos-num">{enrollment.daysCompleted}</span> {enrollment.daysCompleted === 1 ? 'mission' : 'missions'}. Everything you built is still working while you were away.
          </p>
          <p className="text-sm text-[var(--muted)] mt-1">Mission {today?.missionNumber} is simply still next. Pick up where you left off.</p>
        </div>
      )}

      {/* For the CURRENT available mission the whole mission intro lives on this
          page (no second "Begin mission" click). The assistant lives at the
          MODULE level (inside the focus session), not here. The right rail keeps
          the context — "How CuraGo sees you", score, progress and this-week. */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] lg:grid-cols-[200px_minmax(0,1fr)_280px] gap-5 lg:gap-6">
        <div className="hidden lg:block">
          <Spine days={days} totalDays={totalDays} withPack={withPack} />
        </div>

        <div className="min-w-0">
          {allComplete ? (
            <AllComplete daysCompleted={enrollment.daysCompleted} withPack={withPack} />
          ) : today?.status === 'available' ? (
            <MissionIntro day={today} full={missionData?.day} modules={missionData?.modules} progress={missionData?.progress} loaded={missionData !== null} totalDays={totalDays} withPack={withPack} />
          ) : today?.status === 'locked' ? (
            <LockedDay day={today} nextUnlockAt={enrollment.nextUnlockAt} now={now} devBypass={state.devBypass} onUnlocked={load} canAdvance={state.canAdvance} />
          ) : (
            <div className="pos-card p-8 text-center text-[var(--muted)]">No missions available yet.</div>
          )}
        </div>

        <div className="min-w-0">
          <ContextRail score={score} performance={performance} aiCredits={aiCredits} upcomingAchievement={upcomingAchievement} summary={summary} enrollment={enrollment} days={days} withPack={withPack} />
        </div>
      </div>

      {/* Notes/workspace, available on every screen */}
      <WorkspaceDrawer />
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

// The full mission intro, inline on the Day view — no more "Begin → Start" two-step.
// Just the mission content (objective card, why, module list, chips + Start mission);
// the assistant + context rail live in the right column of the track page.
// "Start mission" opens the guided modules directly (?start=1 skips the focus intro).
function MissionIntro({ day, full, modules = [], progress, loaded, totalDays, withPack }) {
  const d = { ...day, ...(full || {}) };   // prefer the fuller day object where present
  const theme = WEEK_THEMES[d.weekNumber] || d.category || 'Practice building';
  const mods = modules || [];
  const missionXp = mods.reduce((s, m) => s + (m.xp || 0), 0) || d.reward?.points || d.points || 0;
  // Already worked some modules but not finished → resuming, not starting fresh. (#15)
  const doneCount = progress?.completedModuleIds?.length || 0;
  const resuming = doneCount > 0 && (mods.length === 0 || doneCount < mods.length);

  return (
        <div className="pos-card p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="pos-label" style={{ background: 'var(--green)', color: '#fff', padding: '4px 11px', borderRadius: 99 }}>Mission {d.missionNumber}</span>
            <span className="pos-label" style={{ background: 'var(--green-soft)', color: 'var(--green)', padding: '4px 11px', borderRadius: 99 }}>Today&apos;s mission</span>
            {resuming && <span className="pos-label" style={{ background: 'var(--orange-soft, rgba(242,106,27,.08))', color: 'var(--orange)', padding: '4px 11px', borderRadius: 99 }}>In progress · {doneCount}/{mods.length}</span>}
          </div>

          <p className="pos-label">Week {d.weekNumber} · {theme}</p>
          <h1 className="text-[18px] md:text-[21px] font-semibold text-[var(--ink)] mt-1.5 leading-tight" style={{ letterSpacing: '-0.02em' }}>
            {d.title}
          </h1>

          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <Chip>⏱ {d.estimatedMinutes || 35} min</Chip>
            {d.difficulty && <Chip>◆ {d.difficulty}</Chip>}
            {missionXp > 0 && <Chip>+{missionXp} XP</Chip>}
            {d.points > 0 && d.scoreComponent && d.scoreComponent !== 'none' && <Chip>+{d.points} {componentLabel(d.scoreComponent)}</Chip>}
            <Chip>Mission {d.missionNumber} of {totalDays}</Chip>
            {modules.length > 0 && <Chip>{modules.length} {modules.length === 1 ? 'module' : 'modules'}</Chip>}
          </div>

          {/* The objective */}
          {(d.missionText || d.objective) && (
            <div className="rounded-xl p-4 mt-4" style={{ background: 'linear-gradient(150deg, var(--green), #05300f)', color: '#fff' }}>
              <p className="pos-label mb-1" style={{ color: 'rgba(255,255,255,.65)' }}>The objective</p>
              <p className="text-[15px] md:text-[16.5px] leading-snug" style={{ fontFamily: 'var(--font-serif, Georgia), serif', fontStyle: 'italic' }}>{d.missionText || d.objective}</p>
            </div>
          )}

          {/* Why this matters */}
          {(d.purpose || d.briefDescription) && (
            <div className="mt-3">
              <p className="pos-label mb-1">Why this matters</p>
              <p className="text-[13.5px] text-[var(--muted)] leading-relaxed" style={{ maxWidth: '52ch' }}>{d.purpose || d.briefDescription}</p>
            </div>
          )}

          {/* What you'll do — module list */}
          {loaded && modules.length > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--rule-soft)' }}>
              <p className="pos-label mb-1.5">What you&apos;ll do — {modules.length} {modules.length === 1 ? 'module' : 'modules'}</p>
              <div>
                {modules.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-2.5 py-1">
                    <span className="pos-num text-[13px] w-5 text-[var(--muted)]">{i + 1}</span>
                    <span className="text-[13.5px] text-[var(--ink)] flex-1">{m.title}</span>
                    {m.xp > 0 && <span className="text-[11.5px] text-[var(--muted)]">+{m.xp} XP</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {!loaded && <div className="mt-3 text-[13px] text-[var(--muted)]">Loading the modules…</div>}

          <div className="mt-4">
            <Link href={withPack(`/app/practice-os/focus/${d._id}?start=1`)} className="pos-action pos-focusable inline-flex items-center gap-2" style={{ background: 'var(--orange)' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M7 5l12 7-12 7V5Z" fill="#fff" /></svg>
              {resuming ? 'Continue mission' : 'Start mission'}
            </Link>
            <p className="text-[12px] text-[var(--muted)] mt-2">{resuming ? 'Pick up where you left off — your progress is saved.' : 'Starting opens the guided modules and your timer.'}</p>
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
          Missions build on each other, and some need real time to work — Google verification takes days, review requests take days to come back. Doing five in one evening builds a checklist, not a practice.
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
              Do tomorrow&apos;s mission today
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
