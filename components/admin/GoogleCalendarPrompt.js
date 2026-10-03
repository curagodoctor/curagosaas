'use client';

import { useState, useEffect } from 'react';

// A prompt to connect Google Calendar, shown when the doctor lands on the Control
// Center / Website Builder and hasn't connected yet. "Maybe later" snoozes it for a
// day so it nudges again until they connect — connecting lets online bookings
// create a Google Meet on their own calendar (doctor + patient both get the invite).
const SNOOZE_KEY = 'gcal_prompt_snoozed_until';
const SNOOZE_MS = 24 * 60 * 60 * 1000;

export default function GoogleCalendarPrompt() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let snoozed = 0;
    try { snoozed = Number(localStorage.getItem(SNOOZE_KEY) || 0); } catch { /* ignore */ }
    if (snoozed && Date.now() < snoozed) return; // still snoozed

    fetch('/api/doctor/google-calendar', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        // Only prompt when the feature is configured and they haven't connected.
        if (d?.success && d.configured && !d.connected) setOpen(true);
      })
      .catch(() => {});
  }, []);

  const later = () => {
    try { localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS)); } catch { /* ignore */ }
    setOpen(false);
  };

  const connect = async () => {
    setBusy(true);
    try {
      const d = await fetch('/api/doctor/google-calendar?connect=1', { credentials: 'include' }).then((r) => r.json());
      if (d.success && d.url) { window.location.href = d.url; return; }
    } catch { /* ignore */ }
    setBusy(false);
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(16,26,19,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={later}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, maxWidth: 480, width: '100%', padding: 28, boxShadow: '0 24px 60px rgba(0,0,0,.25)', fontFamily: 'inherit' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(37,99,235,.1)', display: 'grid', placeItems: 'center', marginBottom: 14 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#2563eb"><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V9h14v11z"/></svg>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#101A13', margin: '0 0 8px' }}>Connect your Google Calendar</h2>
        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#5E6B5F', margin: '0 0 18px' }}>
          Do this once, and every online booking on your site automatically creates a <strong>Google Meet on your own calendar</strong> — you and the patient both get the invite and the meeting link by email. It takes about 20 seconds.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={connect} disabled={busy} style={{ background: '#096b17', color: '#fff', border: 0, borderRadius: 10, padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}>
            {busy ? 'Starting…' : 'Connect Google Calendar'}
          </button>
          <button onClick={later} style={{ background: '#fff', color: '#5E6B5F', border: '1px solid #DDE4D9', borderRadius: 10, padding: '12px 22px', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
