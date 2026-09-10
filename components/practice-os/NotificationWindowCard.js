'use client';

import { useState, useEffect } from 'react';

// §14 — let the doctor pick when they want reminders/nudges. Compact inline card.
const WINDOWS = [
  { id: 'morning', label: 'Morning', hint: '6–12' },
  { id: 'afternoon', label: 'Afternoon', hint: '12–5' },
  { id: 'evening', label: 'Evening', hint: '5–9' },
  { id: 'night', label: 'Night', hint: '9–12' },
];

export default function NotificationWindowCard() {
  const [current, setCurrent] = useState(null);
  const [saving, setSaving] = useState('');

  useEffect(() => {
    let on = true;
    fetch('/api/practice-os/notification-prefs', { credentials: 'include' })
      .then((r) => r.json()).then((d) => { if (on) setCurrent(d.notificationWindow || 'evening'); })
      .catch(() => { if (on) setCurrent('evening'); });
    return () => { on = false; };
  }, []);

  const choose = async (id) => {
    if (id === current) return;
    setSaving(id);
    try {
      const res = await fetch('/api/practice-os/notification-prefs', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ notificationWindow: id }),
      });
      if ((await res.json()).success) setCurrent(id);
    } catch { /* ignore */ } finally { setSaving(''); }
  };

  if (current === null) return null;

  return (
    <div className="pos-card p-4">
      <p className="pos-label mb-1">When should we remind you?</p>
      <p className="text-[13px] text-[var(--muted)] mb-3">We&apos;ll send your one daily nudge in this window.</p>
      <div className="grid grid-cols-4 gap-2">
        {WINDOWS.map((w) => {
          const active = w.id === current;
          return (
            <button key={w.id} onClick={() => choose(w.id)} disabled={!!saving}
              className="rounded-lg py-2 text-center transition-colors"
              style={{ border: `1.5px solid ${active ? 'var(--green)' : 'var(--rule)'}`, background: active ? 'var(--green-soft)' : 'transparent', opacity: saving === w.id ? 0.6 : 1 }}>
              <span className="block text-[13px] font-medium text-[var(--ink)]">{w.label}</span>
              <span className="block text-[11px] text-[var(--muted)]">{w.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
