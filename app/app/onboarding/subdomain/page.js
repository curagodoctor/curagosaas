"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SubdomainOnboarding() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/app';

  const [subdomain, setSubdomain] = useState('');
  const [status, setStatus] = useState(null); // checking | available | taken | invalid
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Debounced availability check — same endpoint the signup form uses.
  const check = useCallback(async (value) => {
    if (!value || value.length < 3) { setStatus(null); setMessage(''); return; }
    setStatus('checking');
    setMessage('Checking availability…');
    try {
      const res = await fetch(`/api/auth/check-subdomain?subdomain=${encodeURIComponent(value)}`);
      const data = await res.json();
      if (data.available) {
        setStatus('available');
        setMessage(`${value}.curago.in is available`);
      } else {
        setStatus('taken');
        setMessage(data.reason || 'This subdomain is not available');
      }
    } catch {
      setStatus('invalid');
      setMessage('Could not check availability');
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (subdomain) check(subdomain); }, 400);
    return () => clearTimeout(t);
  }, [subdomain, check]);

  const onChange = (e) => {
    const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomain(v);
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status !== 'available') { setError('Please choose an available subdomain first.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/doctor/subdomain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Could not set your address. Please try again.');
        setSubmitting(false);
        return;
      }
      router.replace(next);
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const statusColor =
    status === 'available' ? 'var(--green, #096B17)'
    : status === 'taken' || status === 'invalid' ? '#B42318'
    : 'var(--muted, #5E6B5F)';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper, #F7F9F5)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 480, background: 'var(--card, #fff)', border: '1px solid var(--rule, #DDE4D9)', borderRadius: 14, padding: '36px 32px' }}>
        <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, letterSpacing: '0.11em', textTransform: 'uppercase', color: 'var(--muted, #5E6B5F)', margin: '0 0 14px' }}>
          One last step
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ink, #101A13)', margin: '0 0 8px' }}>
          Choose your website address
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--muted, #5E6B5F)', margin: '0 0 24px' }}>
          This is where patients will find your clinic online. You can point a custom domain at it later.
        </p>

        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid var(--rule, #DDE4D9)', borderRadius: 9, overflow: 'hidden' }}>
            <input
              autoFocus
              value={subdomain}
              onChange={onChange}
              placeholder="yourclinic"
              maxLength={30}
              style={{ flex: 1, border: 'none', outline: 'none', padding: '13px 14px', fontSize: 15, color: 'var(--ink, #101A13)', background: 'transparent' }}
            />
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 14, color: 'var(--muted, #5E6B5F)', background: 'var(--rule-soft, #EDF1EB)', borderLeft: '1px solid var(--rule, #DDE4D9)' }}>
              .curago.in
            </span>
          </div>

          {message && (
            <p style={{ fontSize: 13.5, color: statusColor, margin: '10px 2px 0' }}>{message}</p>
          )}
          {error && (
            <p style={{ fontSize: 13.5, color: '#B42318', margin: '10px 2px 0' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || status !== 'available'}
            style={{
              width: '100%',
              marginTop: 22,
              padding: '13px 16px',
              fontSize: 15,
              fontWeight: 600,
              color: '#fff',
              background: submitting || status !== 'available' ? '#C9B8AE' : 'var(--orange, #F26A1B)',
              border: 'none',
              borderRadius: 9,
              cursor: submitting || status !== 'available' ? 'not-allowed' : 'pointer',
              transition: 'background .15s',
            }}
          >
            {submitting ? 'Setting up your site…' : 'Create my website'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SubdomainOnboarding />
    </Suspense>
  );
}
