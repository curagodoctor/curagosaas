'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// The ONE shared top-nav for every Practice OS screen. Fixed to the top; screens
// pad their content with pt-[64px]. On desktop the links sit inline on the right;
// on mobile they collapse behind a hamburger. The optional `children` slot holds
// the pack-scoped Progress dropdown (track page only).
export default function PosNav({ breadcrumb, children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const logout = async () => {
    close();
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    router.push('/login');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 lg:px-12 py-1.5" style={{ background: 'var(--paper)', borderBottom: '1px solid var(--rule)' }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/app/practice-os" onClick={close} className="flex items-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/curago-logo.png" alt="CuraGo" className="h-9 sm:h-10 w-auto" />
          </Link>
          {breadcrumb && (
            <>
              <span className="text-[var(--rule)]">/</span>
              <span className="text-[13px] text-[var(--muted)] truncate hidden sm:inline">{breadcrumb}</span>
            </>
          )}
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-x-4 text-[13px] justify-end">
          <Link href="/app/practice-os" className="pos-link">All packs</Link>
          {children}
          <Link href="/app/practice-os/schedule" className="pos-link">Schedule</Link>
          <Link href="/app/practice-os/workspace" className="pos-link">Workspace</Link>
          <Link href="/app/practice-os/leaderboard" className="pos-link">Leaderboard</Link>
          <Link href="/app/practice-os/profile" className="pos-link">My profile</Link>
          <Link href="/admin/dashboard" className="text-white px-3 py-1 rounded-[7px] font-semibold text-[12.5px] shrink-0" style={{ backgroundColor: 'var(--green)' }}>Website Builder</Link>
          <button onClick={logout} className="pos-link" style={{ color: 'var(--muted)' }}>Sign out</button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen((o) => !o)} className="md:hidden p-2 -mr-2" aria-label="Menu" aria-expanded={open}>
          <svg className="w-6 h-6" style={{ color: 'var(--ink)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile collapsible menu */}
      {open && (
        <div className="md:hidden flex flex-col items-start gap-3 pt-3 pb-1 text-[15px]">
          <Link href="/app/practice-os" onClick={close} className="pos-link">All packs</Link>
          {children}
          <Link href="/app/practice-os/schedule" onClick={close} className="pos-link">Schedule</Link>
          <Link href="/app/practice-os/workspace" onClick={close} className="pos-link">Workspace</Link>
          <Link href="/app/practice-os/leaderboard" onClick={close} className="pos-link">Leaderboard</Link>
          <Link href="/app/practice-os/profile" onClick={close} className="pos-link">My profile</Link>
          <Link href="/admin/dashboard" onClick={close} className="text-white px-3.5 py-1.5 rounded-[7px] font-semibold text-[13px]" style={{ backgroundColor: 'var(--green)' }}>Website Builder</Link>
          <button onClick={logout} className="pos-link" style={{ color: 'var(--muted)' }}>Sign out</button>
        </div>
      )}
    </div>
  );
}
