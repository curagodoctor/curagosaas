'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// §9 control-center nav. Primary items sit inline on desktop; the rest live under
// a "More" menu so the bar never overflows. Mobile lists everything. Leaderboard
// is a section (not a nav button) and there's no "scheduled tasks" item — the
// ready-now teaser covers it.
const PRIMARY = (withPack) => [
  ['Your content', '/app/control-center/content'],
  ['AI Website Builder', '/admin/dashboard/ai-generate'],
  ['Appointments', '/admin/dashboard/bookings'],
  ['Profile', withPack('/app/control-center/profile')],
];
const MORE = (withPack) => [
  ['Contacts', '/admin/dashboard/contacts'],
  ['Workspace', withPack('/app/control-center/workspace')],
  ['Content Planner', withPack('/app/control-center/planner')],
  ['Settings', '/admin/dashboard/settings'],
];

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

  // AI-credits badge — shown on every screen that renders PosNav. Refetches on
  // mount and when the window regains focus (so it reflects spends elsewhere).
  const [credits, setCredits] = useState(null);
  useEffect(() => {
    const load = () => fetch('/api/practice-os/credits', { credentials: 'include' })
      .then((r) => r.json()).then((d) => { if (d?.success) setCredits(d); }).catch(() => {});
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);
  const creditsLabel = credits ? (credits.unlimited ? '∞' : credits.remaining) : null;

  // Keep the active pack in the querystring across nav links.
  const withPack = (path) => (packId ? `${path}${path.includes('?') ? '&' : '?'}pack=${packId}` : path);

  const logout = async () => {
    close();
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    router.push('/login');
  };

  const links = (
    <>
      {/* Mobile shows every item; desktop splits into primary + "More". */}
      {[...PRIMARY(withPack), ...MORE(withPack)].map(([label, href]) => (
        <Link key={label} href={href} onClick={close} className="pos-link">{label}</Link>
      ))}
      <ProgressMenu packId={packId} withPack={withPack} onNavigate={close} />
    </>
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 lg:px-12 py-1.5" style={{ background: 'var(--paper)', borderBottom: '1px solid var(--rule)' }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/app/control-center" onClick={close} className="flex items-center shrink-0">
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

        {/* Desktop links — primary inline, the rest under "More" so it never overflows */}
        <div className="hidden md:flex items-center gap-x-4 text-[13px] justify-end">
          {PRIMARY(withPack).map(([label, href]) => (
            <Link key={label} href={href} onClick={close} className="pos-link">{label}</Link>
          ))}
          <MoreMenu items={MORE(withPack)} onNavigate={close} />
          <ProgressMenu packId={packId} withPack={withPack} onNavigate={close} />
          {creditsLabel != null && (
            <Link href="/app/control-center" className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold" style={{ background: 'rgba(242,106,27,.08)', color: 'var(--orange)', border: '1px solid rgba(242,106,27,.25)' }} title="AI credits remaining">
              ⚡ {creditsLabel} credits
            </Link>
          )}
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
          {creditsLabel != null && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[13px] font-semibold" style={{ background: 'rgba(242,106,27,.08)', color: 'var(--orange)', border: '1px solid rgba(242,106,27,.25)' }}>⚡ {creditsLabel} AI credits</span>
          )}
          {links}
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
    return <Link href="/app/control-center" onClick={onNavigate} className="pos-link">Progress</Link>;
  }

  const items = [
    ['Your progress', withPack('/app/control-center/score')],
    ['Journey & record', withPack('/app/control-center/journey')],
    ['Report', withPack('/app/control-center/report')],
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

// Secondary nav items under one "More" button (keeps the desktop bar from
// overflowing). Same anchored-dropdown pattern as ProgressMenu.
function MoreMenu({ items, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) });
    }
    setOpen((o) => !o);
  };
  const go = () => { setOpen(false); onNavigate?.(); };
  return (
    <div className="relative">
      <button ref={btnRef} onClick={toggle} className="pos-link inline-flex items-center gap-1">
        More
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
