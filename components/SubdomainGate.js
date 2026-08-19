'use client';

import { useState, useEffect, useCallback } from 'react';

// Hard gate: a doctor without a website subdomain cannot use anything until they
// claim one. Mounted in the dashboard + app-shell layouts, so it overlays every
// screen (login, opening the site, starting a mission, opening a pack, etc.) and
// blocks all interaction behind it — there is no way to dismiss it.
export default function SubdomainGate() {
  const [gate, setGate] = useState('loading'); // 'loading' | 'ok' | 'need'
  const [subdomain, setSubdomain] = useState('');
  const [avail, setAvail] = useState(null);     // 'checking' | 'available' | 'taken' | 'invalid'
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Decide whether to block. Only doctors have a subdomain; sub-accounts / logged
  // out users get a 401 here → never blocked.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/doctor/settings', { credentials: 'include' });
        if (!alive) return;
        if (!res.ok) { setGate('ok'); return; }
        const data = await res.json();
        setGate(data.doctor && !data.doctor.subdomain ? 'need' : 'ok');
      } catch { if (alive) setGate('ok'); }
    })();
    return () => { alive = false; };
  }, []);

  const check = useCallback(async (value) => {
    const v = (value || '').trim().toLowerCase();
    if (!v) { setAvail(null); setMsg(''); return; }
    if (!/^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$/.test(v)) {
      setAvail('invalid'); setMsg('3–30 characters: lowercase letters, numbers and hyphens.'); return;
    }
    setAvail('checking'); setMsg('Checking…');
    try {
      const res = await fetch(`/api/auth/check-subdomain?subdomain=${encodeURIComponent(v)}`);
      const d = await res.json();
      if (d.available) { setAvail('available'); setMsg(`${v}.curago.in is available`); }
      else { setAvail('taken'); setMsg(d.message || d.reason || 'That address is already taken.'); }
    } catch { setAvail(null); setMsg(''); }
  }, []);

  useEffect(() => {
    if (gate !== 'need') return;
    const t = setTimeout(() => check(subdomain), 400);
    return () => clearTimeout(t);
  }, [subdomain, gate, check]);

  const claim = async () => {
    const v = subdomain.trim().toLowerCase();
    if (!v || avail === 'taken' || avail === 'invalid' || avail === 'checking') return;
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/doctor/subdomain', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ subdomain: v }),
      });
      const d = await res.json();
      if (d.success) { window.location.reload(); return; }
      setError(d.error || 'Could not set your website address. Please try another.');
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setSubmitting(false); }
  };

  if (gate !== 'need') return null;

  const canClaim = subdomain.trim() && avail === 'available' && !submitting;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(5,19,10,.78)', backdropFilter: 'blur(3px)' }}
      role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: '#096b1714' }}>
          <svg className="w-6 h-6" style={{ color: '#096b17' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1.5">One quick step to continue</h2>
        <p className="text-sm text-gray-600 mb-5">
          Claim your website address. This is your practice&apos;s home online and everything you build lives here — you&apos;ll need it before you can go on.
        </p>

        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Your website address</label>
        <div className="flex items-stretch">
          <input
            value={subdomain}
            onChange={(e) => { setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && canClaim) claim(); }}
            autoFocus
            placeholder="yourname"
            maxLength={30}
            className="flex-1 min-w-0 px-3.5 py-3 border border-gray-300 rounded-l-lg outline-none focus:ring-2 focus:ring-[#096b17] focus:border-transparent"
          />
          <span className="px-3 flex items-center bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-500 font-mono text-sm whitespace-nowrap">.curago.in</span>
        </div>
        {msg && (
          <p className={`mt-2 text-sm ${avail === 'available' ? 'text-green-600' : avail === 'taken' || avail === 'invalid' ? 'text-red-600' : 'text-gray-500'}`}>{msg}</p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <button
          onClick={claim}
          disabled={!canClaim}
          className="mt-5 w-full py-3 rounded-lg font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ background: '#F26A1B' }}
        >
          {submitting ? 'Setting up…' : 'Claim & continue →'}
        </button>
        <p className="mt-3 text-[12px] text-gray-400 text-center">Lowercase letters, numbers and hyphens only. You can change it later in Settings.</p>
      </div>
    </div>
  );
}
