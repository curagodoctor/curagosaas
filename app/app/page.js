'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// The shared workspace shell. Both products are always visible; the one the
// doctor owns is active, the other is present-but-locked (a quiet upsell).
export default function WorkspaceShell() {
  const router = useRouter();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) { router.push('/login'); return; }
        const data = await res.json();
        setDoctor(data.doctor);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;
  }
  if (!doctor) return null;

  const practiceOsActive = !!doctor.practiceOsActive;

  return (
    <div className="w-full px-5 sm:px-8 lg:px-12 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Logo.svg" alt="CuraGo" className="h-7 sm:h-8 w-auto" />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--muted)]">{doctor.displayName || doctor.name}</span>
          <button
            onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}
            className="pos-link text-sm"
          >
            Sign out
          </button>
        </div>
      </div>

      <p className="pos-label mb-1">Your workspace</p>
      <h1 className="text-2xl font-semibold text-[var(--ink)] mb-8" style={{ letterSpacing: '-0.02em' }}>
        Welcome back, {doctor.displayName || doctor.name}.
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Practice OS */}
        {practiceOsActive ? (
          <Link href="/app/practice-os" className="pos-card p-6 block hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-[var(--green-soft)] text-[var(--green)] flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h2 className="font-semibold text-[var(--ink)]">Practice OS</h2>
            <p className="text-sm text-[var(--muted)] mt-1">Your 30-day programme. Continue today&apos;s task.</p>
            <span className="inline-block mt-4 text-[var(--orange)] font-semibold text-sm">Continue →</span>
          </Link>
        ) : (
          <div className="pos-card p-6 relative">
            <div className="absolute top-4 right-4 text-[var(--muted)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--green-soft)] text-[var(--green)] flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h2 className="font-semibold text-[var(--ink)]">Practice OS</h2>
            <p className="text-sm text-[var(--muted)] mt-1">A 30-day guided programme that makes you build your digital presence — one task a day.</p>
            <Link href="/app/practice-os/unlock" className="inline-block mt-4 text-[var(--green)] font-semibold text-sm">Unlock Practice OS →</Link>
          </div>
        )}

        {/* Website Builder — free */}
        <Link href="/admin/dashboard" className="pos-card p-6 block hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-[var(--green-soft)] text-[var(--green)] flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h6" /></svg>
          </div>
          <h2 className="font-semibold text-[var(--ink)]">Website Builder</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            {doctor.subdomain ? 'Your clinic website, bookings and patients.' : 'Build your free clinic website and booking page.'}
          </p>
          <span className="inline-block mt-4 text-[var(--orange)] font-semibold text-sm">Open →</span>
        </Link>
      </div>
    </div>
  );
}
