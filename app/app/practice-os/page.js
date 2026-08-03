'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// The pack catalog — the entry to Practice OS. A doctor browses the available
// Builder Packs, sees what each is (summary, counts, outcomes) and, for packs
// they own, their progress / XP / streak / next-up. Each pack is bought separately.
export default function PackCatalog() {
  const router = useRouter();
  const [packs, setPacks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/practice-os/packs');
        if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
        const data = await res.json();
        if (data.success) setPacks(data.packs);
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

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-10">
        <Link href="/app" className="flex items-center shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Logo.svg" alt="CuraGo" className="h-7 sm:h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-x-4 gap-y-1 text-[13px] flex-wrap justify-end">
          <Link href="/app/practice-os/profile" className="pos-link">My profile</Link>
          <Link href="/admin/dashboard" className="pos-link" style={{ color: 'var(--green)' }}>Website builder →</Link>
          <button onClick={logout} className="pos-link" style={{ color: 'var(--muted)' }}>Sign out</button>
        </div>
      </div>

      <p className="pos-label mb-2">Practice OS · Builder packs</p>
      <h1 className="text-[30px] md:text-[38px] font-semibold text-[var(--ink)] leading-tight" style={{ letterSpacing: '-0.027em', maxWidth: '18ch' }}>
        Choose a pack to build next.
      </h1>
      <p className="text-[16.5px] text-[var(--muted)] mt-4 leading-relaxed" style={{ maxWidth: '54ch' }}>
        Each pack is a guided programme — one mission at a time — that produces a real asset, not a certificate. Own as many as you like; each keeps its own progress.
      </p>

      {(!packs || packs.length === 0) ? (
        <div className="pos-card p-10 text-center text-[var(--muted)] mt-10">No packs are available yet. Check back soon.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-9">
          {packs.map((p) => <PackCard key={p.id} pack={p} />)}
        </div>
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

      {/* Counts */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5">
        <Stat n={counts.modules} label={counts.modules === 1 ? 'module' : 'modules'} />
        <Stat n={counts.missions} label={counts.missions === 1 ? 'mission' : 'missions'} />
        <Stat n={counts.days} label={counts.days === 1 ? 'day' : 'days'} />
      </div>

      {/* Outcomes */}
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

      {/* Progress (owned + started) */}
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

      {/* CTA */}
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
