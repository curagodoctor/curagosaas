'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WorkspaceDrawer from '@/components/practice-os/WorkspaceDrawer';
import PosNav from '@/components/practice-os/PosNav';
import StreakCalendar from '@/components/practice-os/StreakCalendar';
import PendingWorkPrompt from '@/components/practice-os/PendingWorkPrompt';
import WebsiteStats from '@/components/practice-os/WebsiteStats';
import EngagementNudges from '@/components/practice-os/EngagementNudges';
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
  const [loading, setLoading] = useState(true);
  // §11 — the leaderboard join is compulsory, but placed at the OPTIMIZATION
  // boundary: only doctors who've been granted access must pick a name before
  // proceeding. Free/setup doctors aren't gated.
  const [needsUsername, setNeedsUsername] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, meRes, lbRes, uRes, aRes, profRes, actRes] = await Promise.all([
          fetch('/api/practice-os/packs'),
          fetch('/api/auth/me'),
          fetch('/api/practice-os/leaderboard'),
          fetch('/api/practice-os/username'),
          fetch('/api/practice-os/access-request'),
          fetch('/api/practice-os/profile'),
          fetch('/api/practice-os/activity'),
        ]);
        if (pRes.status === 401) { router.push('/login?entry=practice-os'); return; }
        // If the doctor started signup but never finished onboarding, send them
        // back into the wizard (it resumes at their saved step) rather than
        // dropping them on the control center half-set-up.
        if (profRes.ok) {
          const prof = await profRes.json();
          if (prof.success && !prof.onboardComplete) { router.replace('/app/zero-to-practice-builder/onboard'); return; }
        }
        const pData = await pRes.json();
        if (pData.success) setPacks(pData.packs);
        if (meRes.ok) { const me = await meRes.json(); setName(me.doctor?.displayName || me.doctor?.name || ''); }
        if (lbRes.ok) { const lb = await lbRes.json(); if (lb.success) setLeaderboard(lb); }
        if (actRes.ok) { const act = await actRes.json(); if (act.success) setActiveDays(act.total || 0); }
        let granted = false;
        if (aRes.ok) { const a = await aRes.json(); granted = !!a.granted; setAccessStatus(a.status || 'none'); setAccessExpiry(a.access?.expiresAt || null); }
        if (uRes.ok) { const u = await uRes.json(); if (u.success && !u.username && granted) setNeedsUsername(true); }
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
  const todaysMissions = started.filter((p) => p.nextUp);
  // Upcoming scheduled missions across packs, soonest first.
  const scheduled = started
    .filter((p) => p.scheduledFor && p.nextUp)
    .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
  const firstName = (name || 'there').replace(/^Dr\.?\s*/i, 'Dr. ').split(' ').slice(0, 2).join(' ');

  const cycleDaysLeft = accessExpiry ? Math.max(0, Math.ceil((new Date(accessExpiry) - Date.now()) / 86400000)) : null;

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 pt-[64px] pb-6 max-w-[1240px] mx-auto">
      {/* Shared top nav */}
      <PosNav />

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

      {/* Primary status band — the Dominate Organic Search pack */}
      {accessStatus === 'pending' && (
        <div className="pos-card p-5 mt-6 flex items-start gap-3" style={{ borderColor: 'var(--orange)', background: 'var(--orange-soft)' }}>
          <span className="pos-label shrink-0" style={{ background: 'var(--orange)', color: '#fff', padding: '3px 8px', borderRadius: 6 }}>Under review</span>
          <div>
            <p className="text-[15px] font-semibold text-[var(--ink)]">Dominate Organic Search</p>
            <p className="text-[13.5px] text-[var(--muted)] mt-0.5" style={{ maxWidth: '58ch' }}>Your application is in — we&apos;re reviewing your answers and will reach out within 24 hours if you&apos;re a fit for the founding cohort. Meanwhile, keep your website and Google profile polished.</p>
          </div>
        </div>
      )}
      {accessStatus === 'granted' && (
        <div className="pos-card p-5 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: 'var(--green)', background: 'var(--green-soft)' }}>
          <div>
            <span className="pos-label" style={{ color: 'var(--green)' }}>Your pack · active</span>
            <p className="text-[15px] font-semibold text-[var(--ink)] mt-1">Dominate Organic Search{cycleDaysLeft != null ? ` — ${cycleDaysLeft} days left this cycle` : ''}</p>
            <p className="text-[13px] text-[var(--muted)] mt-0.5">We prepare your practice&apos;s work; you review and approve it. 28-day cycle.</p>
          </div>
          <button onClick={() => router.push('/app/zero-to-practice-builder/content')} className="pos-action shrink-0 self-start sm:self-auto">Review my content →</button>
        </div>
      )}

      {/* Pending tasks — accumulated daily missions across started packs the
          doctor can pick up. Sits up top so it's the first actionable thing. */}
      {todaysMissions.length > 0 && (
        <div className="mt-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">Pending tasks <span className="text-[var(--muted)]">· {todaysMissions.length}</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {todaysMissions.map((p) => (
              <Link key={p.id} href={`/app/zero-to-practice-builder/track?pack=${p.id}`} className="pos-card p-4 flex items-start gap-3 hover:shadow-md transition-shadow group" style={{ borderColor: 'var(--orange)' }}>
                <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: 'var(--orange-soft)' }}>
                  <svg className="w-[18px] h-[18px]" style={{ color: 'var(--orange)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] text-[var(--muted)]">{p.title} · Day {p.nextUp.dayNumber}{p.nextUp.category ? ` · ${p.nextUp.category}` : ''}</p>
                  <p className="font-semibold text-[14.5px] text-[var(--ink)] leading-snug mt-0.5">{p.nextUp.title}</p>
                  <span className="text-[13px] font-medium mt-1 inline-block" style={{ color: 'var(--orange)' }}>Start task →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Work awaiting review + engagement nudges */}
      <div className="mt-4 space-y-4">
        <PendingWorkPrompt />
        <EngagementNudges />
      </div>

      {/* Your tools — the primary navigation, as a responsive card grid.
          Website Builder leads (green, full-width on desktop), the rest follow. */}
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)] mt-8 mb-3">Your tools</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Website Builder — the headline tool, spans full width. */}
        <Link
          href="/admin/dashboard"
          className="col-span-2 sm:col-span-3 rounded-2xl p-5 sm:p-6 block hover:shadow-lg transition-shadow group"
          style={{ background: 'linear-gradient(135deg, var(--green), #053d0b)', color: '#fff' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="pos-label" style={{ color: 'rgba(255,255,255,.72)' }}>Your website</p>
              <p className="font-semibold text-[18px] sm:text-[20px] mt-1 leading-snug">Open Website Builder</p>
              <p className="text-[12.5px] sm:text-[13.5px] mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,.85)', maxWidth: '46ch' }}>
                Build and edit your patient-facing site — pages, blog, bookings and the AI editor.
              </p>
            </div>
            <span className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5" style={{ background: 'rgba(255,255,255,.15)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </span>
          </div>
        </Link>

        {[
          { label: 'Content Planner', href: '/app/zero-to-practice-builder/planner', desc: 'Plan ideas → scripts → posts', accent: 'var(--orange)', soft: 'var(--orange-soft)', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { label: 'Google Business Profile', href: '/app/zero-to-practice-builder/gbp', desc: 'Get found on Google Maps', accent: 'var(--green)', soft: 'var(--green-soft)', d: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'Diseases & treatments', href: '/app/zero-to-practice-builder/clusters', desc: 'Review what you treat', accent: 'var(--green)', soft: 'var(--green-soft)', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { label: 'Workspace', href: '/app/zero-to-practice-builder/workspace', desc: 'Private notes as you build', accent: 'var(--green)', soft: 'var(--green-soft)', d: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
          { label: 'Schedule', href: '/app/zero-to-practice-builder/schedule', desc: 'When your next task lands', accent: 'var(--green)', soft: 'var(--green-soft)', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { label: 'My Profile', href: '/app/zero-to-practice-builder/profile', desc: 'Your source-of-truth details', accent: 'var(--green)', soft: 'var(--green-soft)', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
          { label: 'Leaderboard', href: '/app/zero-to-practice-builder/leaderboard', desc: 'Where your cohort stands', accent: 'var(--green)', soft: 'var(--green-soft)', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        ].map((t) => (
          <Link key={t.href} href={t.href} className="pos-card p-4 sm:p-5 flex flex-col hover:shadow-md transition-shadow group">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: t.soft }}>
              <svg className="w-[18px] h-[18px]" style={{ color: t.accent }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={t.d} /></svg>
            </span>
            <span className="text-[14.5px] font-semibold text-[var(--ink)] leading-snug">{t.label}</span>
            <span className="text-[12px] text-[var(--muted)] mt-0.5 leading-snug">{t.desc}</span>
          </Link>
        ))}
      </div>

      {/* Progress + status — two columns on desktop, stacked on mobile.
          Actionable items (today's mission) come first on mobile. */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:gap-8 mt-8">
        <div className="min-w-0 order-2 lg:order-1 space-y-4">
          <WebsiteStats />
          <StreakCalendar />
          {/* Builder Packs — heading + list shown ONLY when the doctor actually
              owns a pack; hidden entirely otherwise. */}
          {owned.length > 0 && (
            <div>
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-3 mt-2">Your packs</h2>
              <div className="flex flex-col gap-5">
                {owned.map((p) => <PackCard key={p.id} pack={p} />)}
              </div>
            </div>
          )}
        </div>

        <aside className="min-w-0 order-1 lg:order-2">
          <div className="lg:sticky lg:top-6 space-y-4">
            {/* Today's mission — one per started pack (most actionable, so first) */}
            {todaysMissions.length > 0 && (
              <div className="pos-card p-5" style={{ background: 'linear-gradient(150deg, #fff, var(--green-soft))', borderColor: 'var(--green)' }}>
                <p className="pos-label mb-3" style={{ color: 'var(--orange)' }}>{todaysMissions.length === 1 ? "Today's mission" : "Today's missions"}</p>
                <div className="space-y-4">
                  {todaysMissions.map((p, i) => (
                    <div key={p.id} className={i > 0 ? 'pt-4 border-t' : ''} style={i > 0 ? { borderColor: 'var(--rule-soft)' } : undefined}>
                      <p className="text-[11px] text-[var(--muted)] mb-0.5">{p.title} · Day {p.nextUp.dayNumber}</p>
                      <p className="font-semibold text-[15px] text-[var(--ink)] leading-snug mb-3">{p.nextUp.title}</p>
                      <Link href={`/app/zero-to-practice-builder/track?pack=${p.id}`} className="pos-action pos-focusable block text-center" style={{ background: 'var(--green)' }}>
                        Open mission
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {/* Scheduled events */}
            <ScheduledCard scheduled={scheduled} />

            {/* Leaderboard */}
            <LeaderboardCard lb={leaderboard} />
          </div>
        </aside>
      </div>

      {/* Notes/workspace, available on every screen */}
      <WorkspaceDrawer />
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
        <Link href="/app/zero-to-practice-builder/schedule" className="pos-link text-[12px]">Manage</Link>
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
        <p className="text-[13px] text-[var(--muted)]">Pick a name in <Link href="/app/zero-to-practice-builder/profile" className="pos-link">your profile</Link> to join the cohort leaderboard.</p>
      </div>
    );
  }
  return (
    <div className="pos-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="pos-label">Leaderboard</p>
        <Link href="/app/zero-to-practice-builder/leaderboard" className="pos-link text-[12px]">See all</Link>
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
            <Link href={`/app/zero-to-practice-builder/track?pack=${pack.id}`} className="pos-action pos-focusable">
              {started ? 'Continue' : 'Start pack'}
            </Link>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="pos-num text-2xl text-[var(--ink)]">₹{Number(priceInInr).toLocaleString('en-IN')}</span>
              <span className="text-[12px] text-[var(--muted)]">+ GST · one-time</span>
            </div>
            <Link href={`/app/zero-to-practice-builder/unlock?pack=${pack.id}`} className="pos-action pos-focusable">
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
