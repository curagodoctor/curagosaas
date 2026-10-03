'use client';

import { useState, useEffect } from 'react';

// A mandatory prompt to connect Google Calendar, shown when the doctor lands on
// the Control Center / Website Builder and hasn't connected yet. It is NOT
// dismissible — every doctor connects so online bookings create a Google Meet on
// their own calendar (you and the patient both get the invite + link by email).
export default function GoogleCalendarPrompt() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/doctor/google-calendar', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        // Only prompt when the feature is configured and they haven't connected.
        if (d?.success && d.configured && !d.connected) setOpen(true);
      })
      .catch(() => {});
  }, []);

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
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(16,26,19,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, maxWidth: 480, width: '100%', padding: 28, boxShadow: '0 24px 60px rgba(0,0,0,.25)', fontFamily: 'inherit' }}>
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
        </div>
      </div>
    </div>
  );
}
