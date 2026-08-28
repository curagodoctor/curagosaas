'use client';

import { Suspense, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// The ONE shared top-nav for every Practice OS screen. Fixed to the top; screens
// pad their content with pt-[64px]. On desktop the links sit inline on the right;
// on mobile they collapse behind a hamburger.
//
// Pack-aware: it reads ?pack= from the URL and carries it across every internal
// link, so once you're inside a pack the whole nav (incl. the Progress dropdown)
// stays scoped to it. The Progress menu now lives here, so it shows on EVERY
// screen — not just the pack home. (#23)
function PosNavInner({ breadcrumb }) {
  const router = useRouter();
  const params = useSearchParams();
  const packId = params.get('pack');
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Keep the active pack in the querystring across nav links.
  const withPack = (path) => (packId ? `${path}${path.includes('?') ? '&' : '?'}pack=${packId}` : path);

  const logout = async () => {
    close();
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    router.push('/login');
  };

  const links = (
    <>
      <Link href="/app/zero-to-practice-builder" onClick={close} className="pos-link">All packs</Link>
      <ProgressMenu packId={packId} withPack={withPack} onNavigate={close} />
      <Link href={withPack('/app/zero-to-practice-builder/schedule')} onClick={close} className="pos-link">Schedule</Link>
      <Link href={withPack('/app/zero-to-practice-builder/workspace')} onClick={close} className="pos-link">Workspace</Link>
      <Link href={withPack('/app/zero-to-practice-builder/planner')} onClick={close} className="pos-link">Content Planner</Link>
      <Link href={withPack('/app/zero-to-practice-builder/leaderboard')} onClick={close} className="pos-link">Leaderboard</Link>
      <Link href={withPack('/app/zero-to-practice-builder/profile')} onClick={close} className="pos-link">My profile</Link>
    </>
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 lg:px-12 py-1.5" style={{ background: 'var(--paper)', borderBottom: '1px solid var(--rule)' }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/app/zero-to-practice-builder" onClick={close} className="flex items-center shrink-0">
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
          {links}
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
          {links}
          <Link href="/admin/dashboard" onClick={close} className="text-white px-3.5 py-1.5 rounded-[7px] font-semibold text-[13px]" style={{ backgroundColor: 'var(--green)' }}>Website Builder</Link>
          <button onClick={logout} className="pos-link" style={{ color: 'var(--muted)' }}>Sign out</button>
        </div>
      )}
    </div>
  );
}

export default function PosNav(props) {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense fallback={<div className="fixed top-0 left-0 right-0 z-40 h-[52px]" style={{ background: 'var(--paper)', borderBottom: '1px solid var(--rule)' }} />}>
      <PosNavInner {...props} />
    </Suspense>
  );
}

// Groups the analytics views (Progress / Journey & record / Report) under one
// "Progress" button. Pack-scoped; if no pack is active it points at the pack list
// so the doctor picks one first.
function ProgressMenu({ packId, withPack, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null); // computed from the button so the menu sits right under it
  const btnRef = useRef(null);

  if (!packId) {
    // No pack in context — send them to pick one; progress is per-pack.
    return <Link href="/app/zero-to-practice-builder" onClick={onNavigate} className="pos-link">Progress</Link>;
  }

  const items = [
    ['Your progress', withPack('/app/zero-to-practice-builder/score')],
    ['Journey & record', withPack('/app/zero-to-practice-builder/journey')],
    ['Report', withPack('/app/zero-to-practice-builder/report')],
  ];
  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      // Fixed position anchored to the button so overflow can't clip it.
      setPos({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) });
    }
    setOpen((o) => !o);
  };
  const go = () => { setOpen(false); onNavigate?.(); };
  return (
    <div className="relative">
      <button ref={btnRef} onClick={toggle} className="pos-link inline-flex items-center gap-1">
        Progress
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
      </button>
      {open && pos && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="fixed z-[70] pos-card p-1 min-w-[180px]" style={{ top: pos.top, right: pos.right, boxShadow: '0 12px 32px rgba(16,26,19,.14)' }}>
            {items.map(([label, href]) => (
              <Link key={label} href={href} onClick={go} className="block px-3 py-2 text-[13px] rounded-md hover:bg-[var(--rule-soft)]" style={{ color: 'var(--ink)' }}>
                {label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
