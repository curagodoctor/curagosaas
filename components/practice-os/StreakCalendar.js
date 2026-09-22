'use client';

import { useState, useEffect } from 'react';

// §12 — Anki-style streak calendar. A month grid and a year heatmap of the days
// the doctor completed work, plus current/longest streak. Activity comes from
// /api/practice-os/activity (mission completions, bucketed in IST).
const IST = { timeZone: 'Asia/Kolkata' };
const keyOf = (d) => d.toLocaleDateString('en-CA', IST);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Green intensity by how much was done that day.
function shade(count) {
  if (!count) return 'var(--rule-soft)';
  if (count >= 3) return 'var(--green)';
  if (count === 2) return 'rgba(9,107,23,0.55)';
  return 'rgba(9,107,23,0.30)';
}

export default function StreakCalendar() {
  const [data, setData] = useState(null); // { days, current, longest, total }
  const [view, setView] = useState('year');
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month

  useEffect(() => {
    let on = true;
    fetch('/api/practice-os/activity', { credentials: 'include' })
      .then((r) => r.json()).then((d) => { if (on) setData(d.success ? d : { days: {}, current: 0, longest: 0, total: 0 }); })
      .catch(() => { if (on) setData({ days: {}, current: 0, longest: 0, total: 0 }); });
    return () => { on = false; };
  }, []);

  if (!data) return <div className="pos-card p-4"><p className="text-sm text-[var(--muted)]">Loading your streak…</p></div>;

  const days = data.days || {};
  const todayKey = keyOf(new Date());

  return (
    <div className="pos-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-4">
          <div>
            <span className="pos-num text-[22px] text-[var(--ink)]">{data.current}</span>
            <span className="text-[12px] text-[var(--muted)] ml-1">day streak</span>
          </div>
          <div className="text-[12px] text-[var(--muted)]">
            Best <span className="pos-num text-[var(--ink)]">{data.longest}</span> · <span className="pos-num text-[var(--ink)]">{data.total}</span> active days
          </div>
        </div>
        <div className="flex gap-1">
          {['month', 'year'].map((v) => (
            <button key={v} onClick={() => setView(v)}
              className="text-[12px] px-2.5 py-1 rounded-md capitalize"
              style={{ background: view === v ? 'var(--green)' : 'transparent', color: view === v ? '#fff' : 'var(--muted)' }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'month'
        ? <MonthGrid days={days} todayKey={todayKey} monthOffset={monthOffset} setMonthOffset={setMonthOffset} />
        : <YearHeatmap days={days} todayKey={todayKey} />}
    </div>
  );
}

function MonthGrid({ days, todayKey, monthOffset, setMonthOffset }) {
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + monthOffset);
  const year = base.getFullYear();
  const month = base.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = first.getDay(); // 0=Sun

  const cells = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="max-w-[320px]">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setMonthOffset(monthOffset - 1)} className="pos-link text-[13px]">←</button>
        <span className="text-[13px] font-medium text-[var(--ink)]">{MONTHS[month]} {year}</span>
        <button onClick={() => setMonthOffset(Math.min(0, monthOffset + 1))} disabled={monthOffset >= 0}
          className="pos-link text-[13px] disabled:opacity-30">→</button>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-[var(--muted)]">{d}</div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const k = keyOf(date);
          const count = days[k] || 0;
          const isToday = k === todayKey;
          return (
            <div key={i} className="aspect-square rounded-md flex items-center justify-center text-[11px]"
              style={{ background: shade(count), color: count >= 2 ? '#fff' : 'var(--muted)', outline: isToday ? '2px solid var(--orange)' : 'none', outlineOffset: '-2px' }}
              title={`${k}: ${count} completed`}>
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function YearHeatmap({ days, todayKey }) {
  // 53 week-columns ending with the current week; rows = Sun..Sat. Dates are
  // stepped with setDate (calendar-accurate — no millisecond drift) and keyed in
  // IST to match the activity API.
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay() - 52 * 7); // Sunday, 52 weeks back
  const weeks = [];
  const cursor = new Date(start);
  for (let w = 0; w < 53; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) { col.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1); }
    weeks.push(col);
  }
  // Month label above the column where a new month first appears.
  const monthLabels = weeks.map((col, ci) => {
    const first = col[0];
    const prevFirst = ci > 0 ? weeks[ci - 1][0] : null;
    return (!prevFirst || first.getMonth() !== prevFirst.getMonth()) && first.getDate() <= 7 ? MONTHS[first.getMonth()] : '';
  });
  // GitHub shows a weekday label on alternating rows (Mon / Wed / Fri).
  const WEEKDAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  const LABEL_W = 26;
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 'max-content' }}>
        {/* Month labels, offset by the weekday-label gutter. */}
        <div className="flex gap-[3px] mb-1" style={{ paddingLeft: LABEL_W }}>
          {monthLabels.map((lbl, ci) => (
            <div key={ci} style={{ width: 11 }} className="text-[8px] text-[var(--muted)] overflow-visible whitespace-nowrap">{lbl}</div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {/* Weekday labels down the left, like GitHub. */}
          <div className="flex flex-col gap-[3px]" style={{ width: LABEL_W }}>
            {WEEKDAYS.map((d, ri) => (
              <div key={ri} style={{ height: 11 }} className="text-[8px] leading-[11px] text-[var(--muted)]">{d}</div>
            ))}
          </div>
          {weeks.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              {col.map((date, ri) => {
                const k = keyOf(date);
                const count = days[k] || 0;
                const future = k > todayKey;
                const isToday = k === todayKey;
                return (
                  <div key={ri} className="rounded-[2px]"
                    style={{ width: 11, height: 11, background: future ? 'transparent' : shade(count), outline: isToday ? '1.5px solid var(--orange)' : (future ? 'none' : '1px solid rgba(16,26,19,0.04)'), outlineOffset: isToday ? '1px' : '-1px' }}
                    title={`${k}: ${count} completed${isToday ? ' · today' : ''}`} />
                );
              })}
            </div>
          ))}
        </div>
        {/* Less → More legend, like GitHub. */}
        <div className="flex items-center gap-1 justify-end mt-2" style={{ fontSize: 8, color: 'var(--muted)' }}>
          <span>Less</span>
          {['var(--rule-soft)', 'rgba(9,107,23,0.30)', 'rgba(9,107,23,0.55)', 'var(--green)'].map((bg, i) => (
            <span key={i} className="rounded-[2px]" style={{ width: 11, height: 11, background: bg, display: 'inline-block' }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
