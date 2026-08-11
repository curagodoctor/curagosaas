'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PosNav from '@/components/practice-os/PosNav';

// The Schedule screen — one card per owned+started pack that has a next task.
// The doctor sees when their next task is scheduled and can move it, constrained
// to same day up to two days out (§8: schedule tomorrow at completion).
const WINDOWS = [
  { key: 'morning', label: 'Morning', hint: '6–12' },
  { key: 'afternoon', label: 'Afternoon', hint: '12–5' },
  { key: 'evening', label: 'Evening', hint: '5–9' },
  { key: 'night', label: 'Night', hint: '9–12' },
];

const OFFSETS = [
  { value: 0, label: 'Today' },
  { value: 1, label: 'Tomorrow' },
  { value: 2, label: 'In 2 days' },
];

// Calendar-day difference from today (ignores time-of-day).
function dayDiff(iso) {
  const then = new Date(iso);
  const a = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const now = new Date();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / 86400000);
}

function relativeDayLabel(iso) {
  const d = dayDiff(iso);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d > 1) return `In ${d} days`;
  if (d === -1) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Two-digit HH:MM for seeding the <input type="time"> from an ISO date.
function isoToTimeValue(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function SchedulePage() {
  const router = useRouter();
  const [packs, setPacks] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/practice-os/packs');
      if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
      const data = await res.json();
      if (data.success) setPacks(data.packs);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;
  }

  const schedulable = (packs || []).filter((p) => p.owned && p.started && p.nextUp);

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 pt-[64px] pb-6 max-w-[900px] mx-auto">
      <PosNav breadcrumb="Schedule" />

      {/* Title */}
      <p className="pos-label mb-2">Your schedule</p>
      <h1 className="text-[30px] md:text-[38px] font-semibold text-[var(--ink)] leading-tight" style={{ letterSpacing: '-0.027em' }}>
        Your schedule
      </h1>
      <p className="text-[16px] text-[var(--muted)] mt-3 leading-relaxed" style={{ maxWidth: '54ch' }}>
        Pick when your next mission lands. You can move it to today, tomorrow, or the day after — one mission at a time.
      </p>

      <div className="mt-9 flex flex-col gap-5">
        {schedulable.length === 0 ? (
          <div className="pos-card p-10 text-center text-[var(--muted)]">
            Nothing scheduled — finish a mission to schedule your next one.
          </div>
        ) : (
          schedulable.map((pack) => (
            <PackScheduleCard key={pack.id} pack={pack} onSaved={load} />
          ))
        )}
      </div>
    </div>
  );
}

function PackScheduleCard({ pack, onSaved }) {
  const { nextUp, scheduledFor, scheduleWindow } = pack;

  // Seed the controls from the current schedule when present.
  const seedOffset = scheduledFor ? Math.min(2, Math.max(0, dayDiff(scheduledFor))) : 1;
  const [offset, setOffset] = useState(seedOffset);
  const [window, setWindow] = useState(scheduleWindow || 'evening');
  const [exactTime, setExactTime] = useState(scheduledFor ? isoToTimeValue(scheduledFor) : '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/practice-os/day/${nextUp.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set-schedule',
          dayOffset: offset,
          window,
          ...(exactTime ? { exactTime } : {}),
        }),
      });
      if (res.ok) await onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pos-card p-7">
      {pack.category && <p className="pos-label" style={{ color: 'var(--green)' }}>{pack.category}</p>}
      <h2 className="text-[20px] md:text-[22px] font-semibold text-[var(--ink)] mt-1 leading-tight" style={{ letterSpacing: '-0.02em' }}>
        {pack.title}
      </h2>

      {/* The next task */}
      <p className="text-[15px] text-[var(--ink)] mt-4 font-medium">Day {nextUp.dayNumber}: {nextUp.title}</p>

      {/* Current schedule */}
      <p className="text-[13px] text-[var(--muted)] mt-1">
        {scheduledFor
          ? <>Currently scheduled: <span className="text-[var(--ink)]">{relativeDayLabel(scheduledFor)}, {formatTime(scheduledFor)}</span></>
          : 'Not scheduled yet'}
      </p>

      {/* Controls */}
      <div className="mt-6 rounded-xl p-5" style={{ background: 'var(--rule-soft)' }}>
        {/* Which day */}
        <p className="pos-label mb-2">Which day</p>
        <div className="flex flex-wrap gap-2">
          {OFFSETS.map((o) => (
            <SelectPill key={o.value} active={offset === o.value} onClick={() => setOffset(o.value)}>{o.label}</SelectPill>
          ))}
        </div>

        {/* Which window */}
        <p className="pos-label mb-2 mt-5">Time of day</p>
        <div className="flex flex-wrap gap-2">
          {WINDOWS.map((w) => (
            <SelectPill key={w.key} active={window === w.key} onClick={() => setWindow(w.key)}>
              {w.label} <span className="opacity-60">{w.hint}</span>
            </SelectPill>
          ))}
        </div>

        {/* Exact time (optional) */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <p className="pos-label">Exact time (optional)</p>
          <input
            type="time"
            value={exactTime}
            onChange={(e) => setExactTime(e.target.value)}
            className="text-[14px] text-[var(--ink)] bg-[var(--card)] border rounded-lg px-3 py-1.5"
            style={{ borderColor: 'var(--rule)' }}
          />
          {exactTime && (
            <button onClick={() => setExactTime('')} className="pos-link text-[12px]">Clear</button>
          )}
        </div>

        <div className="mt-6">
          <button onClick={save} disabled={saving} className="pos-action pos-focusable disabled:opacity-60">
            {saving ? 'Saving…' : 'Save schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="pos-focusable text-[14px] px-4 py-2 rounded-lg border transition-colors"
      style={{
        borderColor: active ? 'var(--green)' : 'var(--rule)',
        background: active ? 'var(--green)' : 'var(--card)',
        color: active ? '#fff' : 'var(--ink)',
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  );
}
