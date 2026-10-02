'use client';

import { useState, useEffect } from 'react';

// Lets a doctor connect their OWN Google account so bookings create a Google Meet
// on their calendar (doctor organiser + patient attendee). One-time consent; after
// that it's automatic for every online booking.
export default function GoogleCalendarConnect() {
  const [status, setStatus] = useState(null); // { connected, email, configured }
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/doctor/google-calendar', { credentials: 'include' });
      const d = await res.json();
      if (d.success) setStatus({ connected: d.connected, email: d.email, configured: d.configured });
    } catch { /* ignore */ }
  };

  useEffect(() => {
    load();
    // Surface the callback result (?gcal=connected|denied|session|...).
    const p = new URLSearchParams(window.location.search).get('gcal');
    if (p === 'connected') setNote('✓ Google Calendar connected. Online bookings now create a Meet on your calendar.');
    else if (p === 'noToken') setNote('Google didn’t return access. Please try again and tap “Allow”.');
    else if (p === 'denied') setNote('Connection cancelled.');
    else if (p === 'session') setNote('Your session expired — please log in and try again.');
    else if (p && p !== 'connected') setNote('Something went wrong connecting Google. Please try again.');
  }, []);

  const connect = async () => {
    setBusy(true); setNote('');
    try {
      const res = await fetch('/api/doctor/google-calendar?connect=1', { credentials: 'include' });
      const d = await res.json();
      if (d.success && d.url) window.location.href = d.url;
      else { setNote(d.error || 'Could not start connection.'); setBusy(false); }
    } catch { setNote('Could not start connection.'); setBusy(false); }
  };

  const disconnect = async () => {
    setBusy(true); setNote('');
    try {
      await fetch('/api/doctor/google-calendar', { method: 'DELETE', credentials: 'include' });
      await load();
      setNote('Disconnected. Bookings will use the default CuraGo calendar.');
    } catch { setNote('Could not disconnect.'); } finally { setBusy(false); }
  };

  if (status && status.configured === false) return null; // not set up on the server

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mt-6">
      <div className="flex items-start gap-3">
        <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V9h14v11z"/></svg>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900">Google Calendar &amp; Meet</h3>
          <p className="text-sm text-gray-600 mt-1">
            Connect your Google account so every online booking creates a Google Meet on <strong>your</strong> calendar, with you and the patient invited by email. One-time setup.
          </p>

          {status?.connected ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 text-sm text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-600" /> Connected{status.email ? ` as ${status.email}` : ''}
              </span>
              <button onClick={disconnect} disabled={busy} className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50">Disconnect</button>
            </div>
          ) : (
            <button onClick={connect} disabled={busy} className="mt-3 inline-flex items-center gap-2 bg-[#096b17] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {busy ? 'Starting…' : 'Connect Google Calendar'}
            </button>
          )}

          {note && <p className="text-sm text-gray-600 mt-3">{note}</p>}
          <p className="text-xs text-gray-400 mt-2">If you don’t connect, bookings still work — the Meet link is just created on CuraGo’s default calendar instead.</p>
        </div>
      </div>
    </div>
  );
}
