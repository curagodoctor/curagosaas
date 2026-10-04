'use client';

import { useState } from 'react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Post-payment schedule chooser: Daily (notify every day) or Weekly (notify only
// on a chosen "CuraGo day"). Saves to /api/practice-os/schedule.
export function ScheduleChooser({ onSaved }) {
  const [type, setType] = useState('daily');
  const [day, setDay] = useState(1); // default Monday
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const body = type === 'weekly' ? { scheduleType: 'weekly', curagoDay: day } : { scheduleType: 'daily' };
      const d = await fetch('/api/practice-os/schedule', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(body),
      }).then((r) => r.json());
      if (d.success) onSaved?.();
      else setErr(d.error || 'Could not save. Try again.');
    } catch { setErr('Something went wrong.'); }
    finally { setBusy(false); }
  };

  const optStyle = (on) => ({
    border: `1px solid ${on ? 'var(--green)' : 'var(--rule)'}`,
    background: on ? 'var(--green-soft, rgba(9,107,23,.06))' : 'var(--card)',
  });

  return (
    <div>
      <div className="flex flex-col gap-2.5">
        <button onClick={() => setType('daily')} className="text-left p-3.5 rounded-xl" style={optStyle(type === 'daily')}>
          <p className="text-[15px] font-semibold text-[var(--ink)]">Daily</p>
          <p className="text-[13px] text-[var(--muted)] mt-0.5">A notification every day to review and publish your content.</p>
        </button>
        <button onClick={() => setType('weekly')} className="text-left p-3.5 rounded-xl" style={optStyle(type === 'weekly')}>
          <p className="text-[15px] font-semibold text-[var(--ink)]">Weekly — your CuraGo day</p>
          <p className="text-[13px] text-[var(--muted)] mt-0.5">One notification a week, only on the day you choose.</p>
        </button>
      </div>

      {type === 'weekly' && (
        <div className="mt-3">
          <p className="pos-label mb-1.5" style={{ color: 'var(--muted)' }}>Your CuraGo day</p>
          <select value={day} onChange={(e) => setDay(Number(e.target.value))}
            className="w-full rounded-[11px] px-3.5 py-3 text-[15px] outline-none" style={{ border: '1px solid var(--rule)', background: 'var(--paper)' }}>
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
      )}

      {err && <p className="text-[13px] text-red-600 mt-3">{err}</p>}
      <button onClick={save} disabled={busy} className="pos-action w-full mt-4">
        {busy ? 'Saving…' : 'Save & continue'}
      </button>
    </div>
  );
}
