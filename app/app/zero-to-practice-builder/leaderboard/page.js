'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PosNav from '@/components/practice-os/PosNav';
import { UsernamePicker } from '../_username';

// Anonymous leaderboard — ranked by XP + streak + speed. Real names never shown.
export default function LeaderboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/practice-os/leaderboard');
    if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
    if (res.status === 402) { router.push('/app/zero-to-practice-builder/unlock'); return; }
    setData(await res.json());
  }, [router]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;
  }

  const { entries = [], me, total = 0 } = data;
  const onLeaderboard = me?.hasUsername;

  return (
    <div className="max-w-2xl mx-auto px-5 pt-[64px] pb-10">
      <PosNav breadcrumb="Leaderboard" />

      <div className="mt-8 mb-6">
        <p className="pos-label mb-1">Leaderboard</p>
        <h1 className="text-[26px] font-semibold text-[var(--ink)]" style={{ letterSpacing: '-0.02em' }}>Founding cohort</h1>
        <p className="text-sm text-[var(--muted)] mt-2" style={{ maxWidth: '52ch' }}>
          Ranked by <b>XP</b>, best <b>streak</b> and <b>speed</b>. Everyone is anonymous — only the name you chose is shown.
          {total > 0 && <> {total} {total === 1 ? 'doctor' : 'doctors'} competing.</>}
        </p>
      </div>

      {/* Join prompt if not on the board yet */}
      {!onLeaderboard && (
        <div className="pos-card p-5 mb-6" style={{ background: 'var(--green-soft)', borderColor: 'var(--green)' }}>
          <p className="pos-label mb-1" style={{ color: 'var(--green)' }}>Join the leaderboard</p>
          <p className="text-sm text-[var(--ink)] mb-3">Pick an anonymous name to compete. You can change it anytime.</p>
          <UsernamePicker onSaved={load} />
        </div>
      )}

      {/* My rank */}
      {onLeaderboard && me && (
        <div className="pos-card p-4 mb-5 flex items-center justify-between" style={{ borderLeft: '3px solid var(--green)' }}>
          <div>
            <p className="pos-label">Your rank</p>
            <p className="text-[var(--ink)]"><span className="pos-num text-2xl">#{me.rank}</span> <span className="text-sm text-[var(--muted)]">of {total}</span></p>
          </div>
          <div className="text-right text-[13px] text-[var(--muted)]">
            <p><span className="pos-num text-[var(--ink)]">{me.points}</span> points</p>
            <p><span className="pos-num">{me.xp}</span> XP · 🔥 {me.streak}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="pos-card overflow-hidden">
        <div className="grid grid-cols-[30px_1fr_40px_46px_52px] sm:grid-cols-[44px_1fr_60px_60px_70px] gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-[11px] uppercase tracking-wide" style={{ background: 'var(--rule-soft)', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
          <span>#</span><span>Name</span><span className="text-right">XP</span><span className="text-right">Streak</span><span className="text-right">Points</span>
        </div>
        {entries.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">No one on the board yet — be the first.</div>
        ) : (
          entries.map((e) => (
            <div key={e.rank} className="grid grid-cols-[30px_1fr_40px_46px_52px] sm:grid-cols-[44px_1fr_60px_60px_70px] gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 items-center border-t text-[14px]"
              style={{ borderColor: 'var(--rule-soft)', background: e.isMe ? 'var(--green-soft)' : 'transparent' }}>
              <span className="pos-num text-[var(--muted)]">{e.rank}</span>
              <span className="text-[var(--ink)] font-medium truncate">{e.username}{e.isMe && <span className="text-[11px] text-[var(--green)]"> · you</span>}</span>
              <span className="pos-num text-right text-[var(--ink)]">{e.xp}</span>
              <span className="pos-num text-right text-[var(--ink)]">{e.streak}</span>
              <span className="pos-num text-right text-[var(--green)] font-medium">{e.points}</span>
            </div>
          ))
        )}
      </div>

      {onLeaderboard && (
        <details className="mt-5">
          <summary className="pos-label cursor-pointer">Change my name</summary>
          <div className="mt-3"><UsernamePicker onSaved={load} /></div>
        </details>
      )}
    </div>
  );
}
