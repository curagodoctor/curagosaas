'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// The Control Center — the logged-in landing. Left: welcome + the doctor's
// Builder Packs. Right: an aggregate progress rail (XP, streak, today's next
// mission) rolled up across the packs they own. Each pack is bought separately.
export default function ControlCenter() {
  const router = useRouter();
  const [packs, setPacks] = useState(null);
  const [name, setName] = useState('');
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, meRes, lbRes] = await Promise.all([
          fetch('/api/practice-os/packs'),
          fetch('/api/auth/me'),
          fetch('/api/practice-os/leaderboard'),
        ]);
        if (pRes.status === 401) { router.push('/login?entry=practice-os'); return; }
        const pData = await pRes.json();
        if (pData.success) setPacks(pData.packs);
        if (meRes.ok) { const me = await meRes.json(); setName(me.doctor?.displayName || me.doctor?.name || ''); }
        if (lbRes.ok) { const lb = await lbRes.json(); if (lb.success) setLeaderboard(lb); }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    router.push('/login');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;
  }

  const owned = (packs || []).filter((p) => p.owned);
  const started = owned.filter((p) => p.started);
  const totalXp = started.reduce((s, p) => s + (p.xp || 0), 0);
  const bestStreak = started.reduce((m, p) => Math.max(m, p.streak || 0), 0);
  const overallPct = started.length
    ? Math.round(started.reduce((s, p) => s + (p.progress?.percent || 0), 0) / started.length)
    : 0;
  // Today's mission = the next-up from the first started pack that has one.
  const activePack = started.find((p) => p.nextUp) || null;
  // Upcoming scheduled missions across packs, soonest first.
  const scheduled = started
    .filter((p) => p.scheduledFor && p.nextUp)
    .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
  const firstName = (name || 'there').replace(/^Dr\.?\s*/i, 'Dr. ').split(' ').slice(0, 2).join(' ');

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 pt-[54px] pb-6 max-w-[1240px] mx-auto">
      {/* Fixed top nav with quick links */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-3 px-4 sm:px-8 lg:px-12 py-1.5" style={{ background: 'var(--paper)', borderBottom: '1px solid var(--rule)' }}>
        <Link href="/app/practice-os" className="flex items-center shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/curago-logo.png" alt="CuraGo" className="h-6 w-auto" />
        </Link>
        <div className="flex items-center gap-x-4 text-[13px] flex-nowrap overflow-x-auto whitespace-nowrap justify-end">
          <Link href="/app/practice-os/schedule" className="pos-link">Schedule</Link>
          <Link href="/app/practice-os/workspace" className="pos-link">Workspace</Link>
          <Link href="/app/practice-os/leaderboard" className="pos-link">Leaderboard</Link>
          <Link href="/app/practice-os/profile" className="pos-link">My profile</Link>
          <button onClick={logout} className="pos-link shrink-0" style={{ color: 'var(--muted)' }}>Sign out</button>
        </div>
      </div>

      {/* Welcome */}
      <p className="pos-label mb-2">Control Center</p>
      <h1 className="text-[30px] md:text-[38px] font-semibold text-[var(--ink)] leading-tight" style={{ letterSpacing: '-0.027em' }}>
        Welcome back, {firstName}.
      </h1>
      <p className="text-[16px] text-[var(--muted)] mt-3 leading-relaxed" style={{ maxWidth: '54ch' }}>
        {started.length
          ? <>Your practice is <strong className="text-[var(--green)]">{overallPct}%</strong> built across your packs. One mission a day gets you the rest.</>
          : <>Pick a builder pack below. Each is a guided programme that produces a real asset — not a certificate.</>}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 lg:gap-8 mt-9">
        {/* Main — the packs */}
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold text-[var(--ink)] mb-4" style={{ letterSpacing: '-0.01em' }}>Builder Packs</h2>
          {(!packs || packs.length === 0) ? (
            <div className="pos-card p-10 text-center text-[var(--muted)]">No packs are available yet. Check back soon.</div>
          ) : (
            <div className="flex flex-col gap-5">
              {packs.map((p) => <PackCard key={p.id} pack={p} />)}
            </div>
          )}
        </div>

        {/* Rail — aggregate progress */}
        <aside className="min-w-0">
          <div className="lg:sticky lg:top-6 space-y-4">
            {/* Website Builder — the other product, surfaced as an appealing card
                (replaces the old nav button). */}
            <Link
              href="/admin/dashboard"
              className="pos-card p-5 block hover:shadow-md transition-shadow group"
              style={{ background: 'linear-gradient(150deg, var(--green), #053d0b)', color: '#fff', border: 'none' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="pos-label" style={{ color: 'rgba(255,255,255,.72)' }}>Your website</p>
                  <p className="font-semibold text-[16px] mt-1 leading-snug">Open Website Builder</p>
                  <p className="text-[12.5px] mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,.85)' }}>
                    Build and edit your patient-facing site — pages, bookings and more.
                  </p>
                </div>
                <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5" style={{ background: 'rgba(255,255,255,.15)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </span>
              </div>
            </Link>

            <p className="pos-label">Your progress</p>

            {/* XP + streak */}
            <div className="pos-card p-5" style={{ background: 'var(--green)', color: '#fff', border: 'none' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="pos-label" style={{ color: 'rgba(255,255,255,.7)' }}>Total XP</span>
                <span className="pos-num text-lg">{totalXp.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="pos-label" style={{ color: 'rgba(255,255,255,.7)' }}>Best streak</span>
                <span className="text-[15px] font-medium">{bestStreak > 0 ? `🔥 ${bestStreak}` : '—'}</span>
              </div>
            </div>

            {/* Packs owned */}
            <div className="pos-card p-5">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div><p className="pos-num text-2xl text-[var(--ink)]">{owned.length}</p><p className="text-[10px] text-[var(--muted)] uppercase tracking-wide">packs owned</p></div>
                <div><p className="pos-num text-2xl text-[var(--ink)]">{started.length}</p><p className="text-[10px] text-[var(--muted)] uppercase tracking-wide">in progress</p></div>
              </div>
            </div>

            {/* Today's mission */}
            {activePack && activePack.nextUp && (
              <div className="pos-card p-5" style={{ background: 'linear-gradient(150deg, #fff, var(--green-soft))', borderColor: 'var(--green)' }}>
                <p className="pos-label mb-1" style={{ color: 'var(--orange)' }}>Today · Day {activePack.nextUp.dayNumber}</p>
                <p className="font-semibold text-[15px] text-[var(--ink)] leading-snug">{activePack.nextUp.title}</p>
                <p className="text-[12px] text-[var(--muted)] mt-1 mb-4">{activePack.title}</p>
                <Link href={`/app/practice-os/track?pack=${activePack.id}`} className="pos-action pos-focusable block text-center" style={{ background: 'var(--green)' }}>
                  Open today&apos;s mission
                </Link>
              </div>
            )}

            {/* Scheduled events */}
            <ScheduledCard scheduled={scheduled} />

            {/* Leaderboard */}
            <LeaderboardCard lb={leaderboard} />
          </div>
        </aside>
      </div>
    </div>
  );
}

// "Today, 6:30 PM" / "Tomorrow, 9:00 AM" / "12 Aug, 5:00 PM"
function formatSchedule(iso) {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const diff = Math.round((day - today) / 86400000);
  const dayLabel = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return `${dayLabel}, ${time}`;
}

// The scheduled-events section — upcoming sessions the doctor has booked, with a
// link to move them. Only shows when something is actually scheduled.
function ScheduledCard({ scheduled }) {
  if (!scheduled || scheduled.length === 0) return null;
  return (
    <div className="pos-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="pos-label">Scheduled</p>
        <Link href="/app/practice-os/schedule" className="pos-link text-[12px]">Manage</Link>
      </div>
      <div className="space-y-3">
        {scheduled.map((s) => (
          <div key={s.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-[var(--ink)] font-medium truncate">Mission {s.nextUp.dayNumber}: {s.nextUp.title}</p>
              <p className="text-[11px] text-[var(--muted)] truncate">{s.title}</p>
            </div>
            <span className="text-[12px] font-medium shrink-0 whitespace-nowrap" style={{ color: 'var(--orange)' }}>{formatSchedule(s.scheduledFor)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Compact cohort leaderboard for the Control Center rail (top 5 + your rank).
function LeaderboardCard({ lb }) {
  if (!lb) return null;
  const top = (lb.entries || []).slice(0, 5);
  if (!top.length) {
    return (
      <div className="pos-card p-5">
        <p className="pos-label mb-2">Leaderboard</p>
        <p className="text-[13px] text-[var(--muted)]">Pick a name in <Link href="/app/practice-os/profile" className="pos-link">your profile</Link> to join the cohort leaderboard.</p>
      </div>
    );
  }
  return (
    <div className="pos-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="pos-label">Leaderboard</p>
        <Link href="/app/practice-os/leaderboard" className="pos-link text-[12px]">See all</Link>
      </div>
      <div className="space-y-2">
        {top.map((e) => (
          <div key={e.rank} className="flex items-center justify-between text-[13px]" style={{ fontWeight: e.isMe ? 600 : 400 }}>
            <span className="flex items-center gap-2 min-w-0">
              <span className="pos-num w-5 shrink-0" style={{ color: 'var(--muted)' }}>{e.rank}</span>
              <span className="truncate" style={{ color: e.isMe ? 'var(--green)' : 'var(--ink)' }}>{e.username}{e.isMe ? ' (you)' : ''}</span>
            </span>
            <span className="pos-num shrink-0" style={{ color: 'var(--muted)' }}>{e.points}</span>
          </div>
        ))}
      </div>
      {lb.me?.hasUsername && lb.me.rank > 5 && (
        <p className="text-[11px] text-[var(--muted)] mt-3 pt-2 border-t" style={{ borderColor: 'var(--rule-soft)' }}>You&apos;re #{lb.me.rank} of {lb.total}</p>
      )}
    </div>
  );
}

function PackCard({ pack }) {
  const { counts, owned, started, progress, xp, streak, visibility, nextUp, priceInInr } = pack;
  const summary = pack.summary || '';
  const outcomes = (pack.outcomes || []).slice(0, 5);

  return (
    <div className="pos-card p-7 flex flex-col">
      {pack.category && <p className="pos-label" style={{ color: 'var(--green)' }}>{pack.category}</p>}
      <h2 className="text-[22px] md:text-[24px] font-semibold text-[var(--ink)] mt-1.5 leading-tight" style={{ letterSpacing: '-0.02em' }}>
        {pack.title}
      </h2>
      {pack.tagline && <p className="text-[14.5px] text-[var(--muted)] mt-1">{pack.tagline}</p>}
      {summary && <p className="text-[15px] text-[var(--muted)] mt-3 leading-relaxed" style={{ maxWidth: '48ch' }}>{summary}</p>}

      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5">
        <Stat n={counts.modules} label={counts.modules === 1 ? 'module' : 'modules'} />
        <Stat n={counts.missions} label={counts.missions === 1 ? 'mission' : 'missions'} />
        <Stat n={counts.days} label={counts.days === 1 ? 'day' : 'days'} />
      </div>

      {outcomes.length > 0 && (
        <div className="mt-5">
          <p className="pos-label mb-2">What you walk away with</p>
          <ul className="space-y-1.5">
            {outcomes.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-[14px] text-[var(--ink)]">
                <span className="text-[var(--green)] mt-0.5 shrink-0">✓</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {owned && started && progress && (
        <div className="mt-6 rounded-xl p-4" style={{ background: 'var(--rule-soft)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="pos-label">Your progress</p>
            <p className="text-[12px] text-[var(--muted)]"><span className="pos-num">{progress.done}</span> / {progress.total}</p>
          </div>
          <div className="pos-meter"><span style={{ width: `${progress.percent}%` }} /></div>

          <div className="grid grid-cols-3 gap-2 text-center mt-4">
            <MiniStat n={xp} label="XP" />
            <MiniStat n={streak} label="streak" suffix={streak > 0 ? '🔥' : ''} />
            <MiniStat n={visibility} label="visibility" />
          </div>

          {nextUp && (
            <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--rule)' }}>
              <p className="pos-label mb-0.5">Up next</p>
              <p className="text-[13px] text-[var(--ink)] truncate">Mission {nextUp.dayNumber}: {nextUp.title}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 pt-5 border-t flex items-center justify-between gap-3" style={{ borderColor: 'var(--rule-soft)' }}>
        {owned ? (
          <>
            <span className="text-[13px] text-[var(--green)] font-medium inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--green)' }} />
              {started ? 'In progress' : 'Ready to start'}
            </span>
            <Link href={`/app/practice-os/track?pack=${pack.id}`} className="pos-action pos-focusable">
              {started ? 'Continue' : 'Start pack'}
            </Link>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="pos-num text-2xl text-[var(--ink)]">₹{Number(priceInInr).toLocaleString('en-IN')}</span>
              <span className="text-[12px] text-[var(--muted)]">one-time</span>
            </div>
            <Link href={`/app/practice-os/unlock?pack=${pack.id}`} className="pos-action pos-focusable">
              Get this pack
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ n, label }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="pos-num text-xl text-[var(--ink)]">{n}</span>
      <span className="text-[13px] text-[var(--muted)]">{label}</span>
    </div>
  );
}

function MiniStat({ n, label, suffix = '' }) {
  return (
    <div>
      <p className="pos-num text-lg text-[var(--ink)]">{n}{suffix && <span className="text-[13px]"> {suffix}</span>}</p>
      <p className="text-[10px] text-[var(--muted)] uppercase tracking-wide">{label}</p>
    </div>
  );
}
