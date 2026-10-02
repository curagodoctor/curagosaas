'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PosNav from '@/components/practice-os/PosNav';
import GoogleCalendarPrompt from '@/components/admin/GoogleCalendarPrompt';
import StreakCalendar from '@/components/practice-os/StreakCalendar';
import PendingWorkPrompt from '@/components/practice-os/PendingWorkPrompt';
import WebsiteStats from '@/components/practice-os/WebsiteStats';
import EngagementNudges from '@/components/practice-os/EngagementNudges';
import PublishedContent from '@/components/practice-os/PublishedContent';
import { UsernamePicker } from './_username';

// The Control Center — the logged-in landing. Left: welcome + the doctor's
// Builder Packs. Right: an aggregate progress rail (XP, streak, today's next
// mission) rolled up across the packs they own. Each pack is bought separately.
export default function ControlCenter() {
  const router = useRouter();
  const [packs, setPacks] = useState(null);
  const [accessStatus, setAccessStatus] = useState('none'); // Dominate Organic Search pack: none | pending | granted
  const [accessExpiry, setAccessExpiry] = useState(null);
  const [activeDays, setActiveDays] = useState(0);
  const [name, setName] = useState('');
  const [leaderboard, setLeaderboard] = useState(null);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(true);
  // Whether the doctor has approved their disease/treatment map yet. Until they
  // do, the daily content has nothing real to draft from — so we route them to
  // the disease review first.
  const [diseasesReviewed, setDiseasesReviewed] = useState(true);
  // §11 — the leaderboard join is compulsory, but placed at the OPTIMIZATION
  // boundary: only doctors who've been granted access must pick a name before
  // proceeding. Free/setup doctors aren't gated.
  const [needsUsername, setNeedsUsername] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, meRes, lbRes, uRes, aRes, profRes, actRes, crRes] = await Promise.all([
          fetch('/api/practice-os/packs'),
          fetch('/api/auth/me'),
          fetch('/api/practice-os/leaderboard'),
          fetch('/api/practice-os/username'),
          fetch('/api/practice-os/access-request'),
          fetch('/api/practice-os/profile'),
          fetch('/api/practice-os/activity'),
          fetch('/api/practice-os/credits'),
        ]);
        if (pRes.status === 401) { router.push('/login?entry=practice-os'); return; }
        // If the doctor started signup but never finished onboarding, send them
        // back into the wizard (it resumes at their saved step) rather than
        // dropping them on the control center half-set-up.
        if (profRes.ok) {
          const prof = await profRes.json();
          if (prof.success && !prof.onboardComplete) { router.replace('/app/control-center/onboard'); return; }
        }
        const pData = await pRes.json();
        if (pData.success) setPacks(pData.packs);
        if (meRes.ok) { const me = await meRes.json(); setName(me.doctor?.displayName || me.doctor?.name || ''); }
        if (lbRes.ok) { const lb = await lbRes.json(); if (lb.success) setLeaderboard(lb); }
        if (actRes.ok) { const act = await actRes.json(); if (act.success) setActiveDays(act.total || 0); }
        if (crRes.ok) { const cr = await crRes.json(); if (cr.success) setCredits(cr); }
        let granted = false;
        if (aRes.ok) { const a = await aRes.json(); granted = !!a.granted; setAccessStatus(a.status || 'none'); setAccessExpiry(a.access?.expiresAt || null); }
        // Leaderboard is hidden — don't force doctors to pick a leaderboard name.
        // (Re-enable when the leaderboard ships: setNeedsUsername(true) below.)
        if (uRes.ok) { await uRes.json().catch(() => {}); }
        // Granted doctors must map their diseases + treatments before any daily
        // content — check whether they've approved any cluster yet.
        if (granted) {
          try {
            const cl = await fetch('/api/practice-os/clusters', { credentials: 'include' }).then((r) => r.json());
            setDiseasesReviewed(cl.success && (cl.clusters || []).some((c) => c.approved));
          } catch { /* ignore */ }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;
  }

  if (needsUsername) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: 'var(--paper)' }}>
        <div className="w-full max-w-md pos-card p-6">
          <p className="pos-label" style={{ color: 'var(--green)' }}>One quick thing</p>
          <h1 className="text-[22px] font-semibold text-[var(--ink)] mt-1" style={{ letterSpacing: '-0.02em' }}>Pick your leaderboard name</h1>
          <p className="text-sm text-[var(--muted)] mt-2 mb-4">Everyone here is on a shared, anonymous leaderboard. Choose a name to continue — your real name is never shown.</p>
          <UsernamePicker onSaved={() => setNeedsUsername(false)} />
        </div>
      </div>
    );
  }

  const owned = (packs || []).filter((p) => p.owned);
  const started = owned.filter((p) => p.started);
  const totalXp = started.reduce((s, p) => s + (p.xp || 0), 0);
  const bestStreak = started.reduce((m, p) => Math.max(m, p.streak || 0), 0);
  // Today's mission = the next-up mission for EVERY started pack that has one,
  // so a doctor running multiple packs sees each pack's next mission, not just
  // the first. (#29)
  // The full pickable backlog across started packs — for calendar-paced packs
  // this is every unlocked-but-incomplete task; for sequence packs it's the one
  // next task. Each entry keeps its pack so we can link + label it.
  const pendingTasks = started.flatMap((p) =>
    ((p.pending && p.pending.length ? p.pending : (p.nextUp ? [p.nextUp] : [])).map((m) => ({ pack: p, m })))
  );
  // Upcoming scheduled missions across packs, soonest first.
  const scheduled = started
    .filter((p) => p.scheduledFor && p.nextUp)
    .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
  const firstName = (name || 'there').replace(/^Dr\.?\s*/i, 'Dr. ').split(' ').slice(0, 2).join(' ');
  // Granted doctors do the disease/treatment review FIRST; only then does the
  // daily content open in the /day interface.
  const reviewContentHref = !diseasesReviewed
    ? '/app/control-center/clusters'
    : pendingTasks[0]
      ? `/app/control-center/day/${pendingTasks[0].m.id}?pack=${pendingTasks[0].pack.id}`
      : '/app/control-center/content';

  const cycleDaysLeft = accessExpiry ? Math.max(0, Math.ceil((new Date(accessExpiry) - Date.now()) / 86400000)) : null;

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 pt-[64px] pb-6 max-w-[1240px] mx-auto">
      {/* Shared top nav */}
      <PosNav />

      {/* Nudge to connect Google Calendar (shown after onboarding, until connected). */}
      <GoogleCalendarPrompt />

      {/* Welcome */}
      <p className="pos-label mb-2">Control Center</p>
      <h1 className="text-[28px] sm:text-[32px] md:text-[38px] font-semibold text-[var(--ink)] leading-tight" style={{ letterSpacing: '-0.027em' }}>
        Welcome back, {firstName}.
      </h1>
      <p className="text-[15px] sm:text-[16px] text-[var(--muted)] mt-2.5 leading-relaxed" style={{ maxWidth: '54ch' }}>
        {activeDays > 0
          ? <>You&apos;ve worked on your practice <strong className="text-[var(--green)]">{activeDays}</strong> {activeDays === 1 ? 'day' : 'days'}. Keep the momentum — a little each day compounds.</>
          : <>Your control center. Finish your setup and start building your organic presence — a little each day.</>}
      </p>

      {/* 1 · Heat map — the first thing under the welcome. Today sits left-of-
          middle with future days visible to its right (see StreakCalendar). */}
      <div className="mt-6">
        <StreakCalendar />
      </div>

      {/* 2 · Dominate Organic Search — the prominent status band, given real
          weight in the dashboard. */}
      {(accessStatus === 'none' || accessStatus === 'denied') && (
        <div className="pos-card p-6 sm:p-7 mt-5" style={{ borderColor: 'var(--orange)', background: 'var(--orange-soft)' }}>
          <span className="pos-label" style={{ color: 'var(--orange)' }}>Dominate Organic Search · Early access</span>
          <p className="text-[19px] sm:text-[21px] font-semibold text-[var(--ink)] mt-1.5" style={{ letterSpacing: '-0.02em' }}>Unlock your daily organic-growth engine</p>
          <p className="text-[14px] text-[var(--muted)] mt-1.5" style={{ maxWidth: '62ch', lineHeight: 1.55 }}>
            Free for the first 4 weeks, then ₹5,000 / 4 weeks — founder price, locked in. We prepare your practice&apos;s content daily; you just review and publish. Cancel anytime; your website and content stay yours.
          </p>
          <button onClick={() => router.push('/app/control-center/get-access')} className="pos-action mt-4">{accessStatus === 'denied' ? 'Apply again →' : 'Get early access →'}</button>
        </div>
      )}
      {accessStatus === 'pending' && (
        <div className="pos-card p-6 sm:p-7 mt-5 flex items-start gap-3" style={{ borderColor: 'var(--orange)', background: 'var(--orange-soft)' }}>
          <span className="pos-label shrink-0" style={{ background: 'var(--orange)', color: '#fff', padding: '3px 8px', borderRadius: 6 }}>Under review</span>
          <div>
            <p className="text-[17px] font-semibold text-[var(--ink)]">Dominate Organic Search</p>
            <p className="text-[14px] text-[var(--muted)] mt-1" style={{ maxWidth: '58ch', lineHeight: 1.55 }}>Your application is in — we&apos;re reviewing your answers and will reach out within 24 hours if you&apos;re a fit for the founding cohort. Meanwhile, keep your website and Google profile polished.</p>
          </div>
        </div>
      )}
      {accessStatus === 'granted' && (
        <div className="pos-card p-6 sm:p-7 mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderColor: 'var(--green)', background: 'var(--green-soft)' }}>
          <div>
            <span className="pos-label" style={{ color: 'var(--green)' }}>Your pack · active</span>
            <p className="text-[19px] sm:text-[22px] font-semibold text-[var(--ink)] mt-1.5" style={{ letterSpacing: '-0.02em' }}>Dominate Organic Search{cycleDaysLeft != null ? ` — ${cycleDaysLeft} days left this cycle` : ''}</p>
            <p className="text-[13.5px] text-[var(--muted)] mt-1" style={{ maxWidth: '58ch', lineHeight: 1.55 }}>
              {diseasesReviewed
                ? 'We prepare your practice’s work; you review and approve it. 28-day cycle.'
                : 'First, review the diseases you treat and their treatments — everything we draft is built from these.'}
            </p>
          </div>
          <button onClick={() => router.push(reviewContentHref)} className="pos-action shrink-0 self-start sm:self-auto">{diseasesReviewed ? "Review today's content →" : 'Review my diseases & treatments →'}</button>
        </div>
      )}

      {/* Pending tasks — the pickable backlog across started packs. The first
          actionable thing right under the pack band. */}
      {pendingTasks.length > 0 && diseasesReviewed && (
        <div className="mt-6">
          <button onClick={() => setPendingOpen((v) => !v)} className="w-full flex items-center justify-between mb-3 group" aria-expanded={pendingOpen}>
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">Pending tasks <span className="text-[var(--orange)]">· {pendingTasks.length}</span></h2>
            <svg className="w-4 h-4 text-[var(--muted)] transition-transform" style={{ transform: pendingOpen ? 'rotate(180deg)' : 'none' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {pendingOpen && (<>
          <div className={`grid grid-cols-1 gap-3${pendingTasks.length > 1 ? ' sm:grid-cols-2' : ''}`}>
            {pendingTasks.slice(0, 12).map(({ pack, m }) => (
              <Link key={m.id} href={`/app/control-center/day/${m.id}?pack=${pack.id}`} className="pos-card p-4 flex items-start gap-3 hover:shadow-md transition-shadow group" style={{ borderColor: 'var(--orange)' }}>
                <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: 'var(--orange-soft)' }}>
                  <svg className="w-[18px] h-[18px]" style={{ color: 'var(--orange)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] text-[var(--muted)]">Day {m.dayNumber}{m.category ? ` · ${m.category}` : ''}</p>
                  <p className="font-semibold text-[14.5px] text-[var(--ink)] leading-snug mt-0.5">{m.title}</p>
                  <span className="text-[13px] font-medium mt-1 inline-block" style={{ color: 'var(--orange)' }}>See day {m.dayNumber} →</span>
                </div>
              </Link>
            ))}
          </div>
          {pendingTasks.length > 12 && <p className="text-[12px] text-[var(--muted)] mt-2">+{pendingTasks.length - 12} more — open the pack to see all.</p>}
          </>)}
        </div>
      )}

      {/* 3 · Today's nudge (smaller) + AI credits, side by side and equal height. */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_300px] gap-4 mt-6 items-stretch">
        <div className="min-w-0 [&>*]:h-full"><EngagementNudges /></div>
        {credits && (
          <div className="pos-card p-5 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                <p className="pos-label" style={{ color: 'var(--green)' }}>AI credits</p>
                <p className="text-[12px] text-[var(--muted)] mt-0.5">{credits.unlimited ? 'Unlimited access' : 'Resets daily'}</p>
              </div>
              <div className="text-right">
                <span className="pos-num text-[28px] leading-none text-[var(--ink)]">{credits.unlimited ? '∞' : credits.remaining}</span>
                {!credits.unlimited && credits.dailyLimit ? <span className="text-[13px] text-[var(--muted)]"> / {credits.dailyLimit}</span> : null}
              </div>
            </div>
            {!credits.unlimited && credits.dailyLimit ? (
              <div className="pos-meter mt-3"><span style={{ width: `${Math.min(100, Math.round((credits.remaining / credits.dailyLimit) * 100))}%` }} /></div>
            ) : null}
          </div>
        )}
      </div>

      {/* Work awaiting review + scheduled events (granted doctors only). */}
      {accessStatus === 'granted' && diseasesReviewed && <div className="mt-4"><PendingWorkPrompt /></div>}
      <ScheduledCard scheduled={scheduled} />

      {/* 4 · Published content */}
      <div className="mt-6"><PublishedContent /></div>

      {/* 5 · Your website status */}
      <div className="mt-4"><WebsiteStats /></div>

      {/* 6 · Leaderboard — hidden (deferred). Re-enable the LeaderboardCard here. */}
      {false && <div className="mt-4"><LeaderboardCard lb={leaderboard} /></div>}

      {/* Builder Packs — only real curriculum packs (the Dominate Organic Search
          daily engine is optimization-tier, surfaced above, not a pack). */}
      {owned.filter((p) => p.tier !== 'optimization').length > 0 && (
        <div className="mt-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">Your packs</h2>
          <div className="flex flex-col gap-5">
            {owned.filter((p) => p.tier !== 'optimization').map((p) => <PackCard key={p.id} pack={p} />)}
          </div>
        </div>
      )}

      {/* 7 · Your tools — 9 uniform tiles, a clean 3×3 on mobile and a single
          launcher row on desktop. Website Builder leads (green); Total XP & best
          streak closes the set as a stat tile. */}
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)] mt-8 mb-3">Your tools</h2>
      <div className="grid grid-cols-3 lg:grid-cols-9 gap-2.5 sm:gap-3">
        {[
          { label: 'Website Builder', href: '/admin/dashboard', primary: true, d: 'M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM3 9h18' },
          { label: 'Website enquiries', href: '/app/control-center/leads', accent: 'var(--orange)', soft: 'var(--orange-soft)', d: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
          { label: 'Content Planner', href: '/app/control-center/planner', accent: 'var(--orange)', soft: 'var(--orange-soft)', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { label: 'Google Business Profile', href: '/app/control-center/gbp', accent: 'var(--green)', soft: 'var(--green-soft)', d: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'Diseases & treatments', href: '/app/control-center/clusters', accent: 'var(--green)', soft: 'var(--green-soft)', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { label: 'Workspace', href: '/app/control-center/workspace', accent: 'var(--green)', soft: 'var(--green-soft)', d: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
          { label: 'Schedule', href: '/app/control-center/schedule', accent: 'var(--green)', soft: 'var(--green-soft)', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { label: 'My Profile', href: '/app/control-center/profile', accent: 'var(--green)', soft: 'var(--green-soft)', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
          { stat: true },
        ].map((t, i) => (
          t.stat ? (
            <div key="xp" className="rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-1 min-h-[112px]" style={{ background: 'linear-gradient(135deg, var(--green), #053d0b)', color: '#fff' }}>
              <span className="pos-label" style={{ color: 'rgba(255,255,255,.72)', fontSize: 9 }}>Total XP</span>
              <span className="pos-num text-[24px] leading-none">{totalXp.toLocaleString('en-IN')}</span>
              <span className="text-[10.5px] leading-tight" style={{ color: 'rgba(255,255,255,.85)' }}>{bestStreak > 0 ? `🔥 ${bestStreak} best streak` : 'Best streak —'}</span>
            </div>
          ) : (
            <Link key={t.href} href={t.href}
              className="rounded-2xl p-3 flex flex-col items-center justify-start text-center gap-2 min-h-[112px] hover:shadow-md transition-shadow group"
              style={t.primary ? { background: 'linear-gradient(135deg, var(--green), #053d0b)', color: '#fff' } : { background: 'var(--card)', border: '1px solid var(--rule-soft)' }}>
              <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.primary ? 'rgba(255,255,255,.15)' : t.soft }}>
                <svg className="w-5 h-5" style={{ color: t.primary ? '#fff' : t.accent }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={t.d} /></svg>
              </span>
              <span className="text-[11.5px] font-semibold leading-tight" style={{ color: t.primary ? '#fff' : 'var(--ink)' }}>{t.label}</span>
            </Link>
          )
        ))}
      </div>

      {/* Notes/workspace + assistant now mount globally in the app layout via the
          single floating FAB. */}
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
        <Link href="/app/control-center/schedule" className="pos-link text-[12px]">Manage</Link>
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
        <p className="text-[13px] text-[var(--muted)]">Pick a name in <Link href="/app/control-center/profile" className="pos-link">your profile</Link> to join the cohort leaderboard.</p>
      </div>
    );
  }
  return (
    <div className="pos-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="pos-label">Leaderboard</p>
        <Link href="/app/control-center/leaderboard" className="pos-link text-[12px]">See all</Link>
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
        {pack.mode === 'task' ? (
          <Stat n={counts.missions} label={counts.missions === 1 ? 'task' : 'tasks'} />
        ) : (
          <>
            <Stat n={counts.days} label={counts.days === 1 ? 'day' : 'days'} />
            <Stat n={counts.missions} label={counts.missions === 1 ? 'mission' : 'missions'} />
            <Stat n={counts.modules} label={counts.modules === 1 ? 'module' : 'modules'} />
          </>
        )}
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
          {pack.mode === 'task' ? (
            <>
              {/* Task packs are a flat list — count by tasks done, not module "steps". */}
              <div className="flex items-center justify-between mb-1.5">
                <p className="pos-label">Your progress</p>
                <p className="text-[12px] text-[var(--muted)]">
                  <span className="pos-num">{progress.done ?? 0}</span> / {progress.total} tasks
                  <span className="ml-1.5">· {progress.taskPercent ?? progress.percent}%</span>
                </p>
              </div>
              <div className="pos-meter"><span style={{ width: `${progress.taskPercent ?? progress.percent}%` }} /></div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1.5">
                <p className="pos-label">Your progress</p>
                <p className="text-[12px] text-[var(--muted)]">
                  <span className="pos-num">{progress.completedModules ?? 0}</span> / {progress.totalModules ?? progress.total} steps
                  <span className="ml-1.5">· {progress.percent}%</span>
                </p>
              </div>
              <div className="pos-meter"><span style={{ width: `${progress.percent}%` }} /></div>
              {progress.done > 0 && <p className="text-[10.5px] text-[var(--muted)] mt-1">{progress.done} of {progress.total} missions finished</p>}
            </>
          )}

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
            <Link href={`/app/control-center/track?pack=${pack.id}`} className="pos-action pos-focusable">
              {started ? 'Continue' : 'Start pack'}
            </Link>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="pos-num text-2xl text-[var(--ink)]">₹{Number(priceInInr).toLocaleString('en-IN')}</span>
              <span className="text-[12px] text-[var(--muted)]">+ GST · one-time</span>
            </div>
            <Link href={`/app/control-center/unlock?pack=${pack.id}`} className="pos-action pos-focusable">
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
