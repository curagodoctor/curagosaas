'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

// The ONE shared top-nav for every Practice OS screen. Fixed to the top; screens
// pad their content with pt-[64px] so nothing hides under it. Right-side links
// scroll horizontally on small screens. The optional `children` slot is rendered
// among the right-side links and is used only on the track page to inject the
// pack-scoped Progress dropdown (which is fixed-positioned so this bar's
// overflow-x-auto can't clip it).
export default function PosNav({ breadcrumb, children }) {
  const router = useRouter();
  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    router.push('/login');
  };
  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-3 px-4 sm:px-8 lg:px-12 py-1.5" style={{ background: 'var(--paper)', borderBottom: '1px solid var(--rule)' }}>
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/app/practice-os" className="flex items-center shrink-0">
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
      <div className="flex items-center gap-x-4 text-[13px] flex-nowrap overflow-x-auto whitespace-nowrap justify-end">
        <Link href="/app/practice-os" className="pos-link">All packs</Link>
        {children}
        <Link href="/app/practice-os/schedule" className="pos-link">Schedule</Link>
        <Link href="/app/practice-os/workspace" className="pos-link">Workspace</Link>
        <Link href="/app/practice-os/leaderboard" className="pos-link">Leaderboard</Link>
        <Link href="/app/practice-os/profile" className="pos-link">My profile</Link>
        <Link href="/admin/dashboard" className="text-white px-3 py-1 rounded-[7px] font-semibold text-[12.5px] shrink-0" style={{ backgroundColor: 'var(--green)' }}>Website Builder</Link>
        <button onClick={logout} className="pos-link" style={{ color: 'var(--muted)' }}>Sign out</button>
      </div>
    </div>
  );
}
