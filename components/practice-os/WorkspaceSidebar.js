'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { openUpgrade } from './UpgradePopup';

// Is the current route this nav item's page (exact, or a sub-route of it)?
function isActive(pathname, href) {
  if (!pathname || !href) return false;
  const p = pathname.replace(/\/+$/, '');
  const h = href.replace(/\/+$/, '');
  return p === h || p.startsWith(h + '/');
}

// Every workspace tool, grouped into the six blocks. Items the current plan
// doesn't include show a lock + "Upgrade" and open the subscribe popup. Nothing
// is hidden — the doctor always sees what a subscription unlocks.
const BLOCKS = [
  { title: 'Website Builder', accent: 'var(--green)', items: [
    { label: 'AI Generate', href: '/admin/dashboard/ai-generate', f: 'aiGenerate' },
    { label: 'Website Builder', href: '/admin/dashboard/pages', f: 'websiteBuilder' },
    { label: 'Blog Builder', href: '/admin/dashboard/blog-articles', f: 'blogBuilder' },
  ] },
  { title: 'Bookings & Contacts', accent: 'var(--orange)', items: [
    { label: 'Website enquiries', href: '/app/control-center/leads', f: 'websiteEnquiries' },
    { label: 'Bookings', href: '/admin/dashboard/bookings', f: 'bookingSystem' },
    { label: 'Slot manager', href: '/admin/dashboard/slots', f: 'bookingSystem' },
    { label: 'Clinic manager', href: '/admin/dashboard/modes', f: 'bookingSystem' },
    { label: 'Contacts', href: '/admin/dashboard/contacts', f: 'contacts' },
    { label: 'Workflows', href: '/admin/dashboard/workflows', f: 'workflows' },
    { label: 'Templates', href: '/admin/dashboard/templates', f: 'templates' },
  ] },
  { title: 'Utilities & Settings', accent: 'var(--green)', items: [
    { label: 'Content planner', href: '/app/control-center/planner', f: 'contentPlanner' },
    { label: 'Workspace', href: '/app/control-center/workspace', f: 'workspace' },
    { label: 'Schedule', href: '/app/control-center/schedule', f: 'schedule' },
    { label: 'Analytics', href: '/admin/dashboard/analytics', f: 'analytics' },
    { label: 'Settings', href: '/admin/dashboard/settings', f: 'settings' },
  ] },
  { title: 'Google Business Profile', accent: 'var(--green)', items: [
    { label: 'Manage your profile', href: '/app/control-center/gbp', f: 'gbp' },
  ] },
  { title: 'Customisation', accent: 'var(--green)', items: [
    { label: 'Diseases & treatments', href: '/app/control-center/clusters', f: 'customisation' },
    { label: 'Content instructions', href: '/app/control-center/profile', f: 'customisation' },
  ] },
  { title: 'My Profile & Links', accent: 'var(--green)', items: [
    { label: 'My profile', href: '/app/control-center/profile', f: 'profile' },
    { label: 'Links', href: '/app/control-center/links', f: 'links' },
  ] },
];

const ChevronRight = () => (
  <svg className="w-3.5 h-3.5 shrink-0 text-[var(--muted)] opacity-60" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
);
const LockChip = () => (
  <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wide shrink-0" style={{ color: 'var(--green)' }}>
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
    Upgrade
  </span>
);

// The nav list — shared by the desktop rail and the mobile drawer.
function Nav({ access, onNavigate }) {
  const pathname = usePathname();
  const can = (f) => !access || !f || access.features?.[f] !== false;
  const rowCls = 'flex items-center justify-between gap-2 py-[7px] px-2.5 -mx-1 rounded-lg transition-colors';
  return (
    <nav className="flex flex-col gap-4">
      {BLOCKS.map((b) => (
        <div key={b.title}>
          <div className="flex items-center gap-2 mb-1 px-1.5">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: b.accent }} />
            <h3 className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--muted)]">{b.title}</h3>
          </div>
          <div className="flex flex-col">
            {b.items.map((it) => {
              const unlocked = can(it.f);
              const active = unlocked && isActive(pathname, it.href);
              const inner = (
                <>
                  <span className="text-[13.5px] truncate" style={{ color: active ? 'var(--green)' : unlocked ? 'var(--ink)' : 'var(--muted)', fontWeight: active ? 600 : 400 }}>{it.label}</span>
                  {unlocked ? <ChevronRight /> : <LockChip />}
                </>
              );
              const activeCls = active ? ' bg-[rgba(9,107,23,.08)] font-medium' : '';
              return unlocked ? (
                <Link key={it.label} href={it.href} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={rowCls + activeCls + (active ? '' : ' hover:bg-[var(--rule-soft)]')}>{inner}</Link>
              ) : (
                <button key={it.label} type="button" onClick={() => { openUpgrade(); onNavigate?.(); }} className={rowCls + ' w-full text-left hover:bg-[rgba(9,107,23,.06)]'}>{inner}</button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

// Responsive workspace sidebar for the control-center shell:
//  - lg+ : a fixed rail pinned below the top nav on the left (the shell offsets
//          page content with lg:pl-[240px]).
//  - < lg: a floating button (bottom-left) opens a slim slide-in drawer.
export default function WorkspaceSidebar({ access }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop rail — fixed under the 56px nav, scrolls independently. */}
      <aside className="hidden lg:flex flex-col fixed top-[56px] left-0 bottom-0 w-[240px] overflow-y-auto px-4 py-5 z-30" style={{ background: 'var(--card)', borderRight: '1px solid var(--rule-soft)' }}>
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-3 px-1.5">Your workspace</h2>
        <Nav access={access} />
      </aside>

      {/* Mobile floating trigger — mirrors the assistant FAB on the opposite side. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed bottom-5 left-5 z-30 inline-flex items-center gap-2 rounded-full pl-3.5 pr-4 py-3 text-[13px] font-semibold shadow-lg"
        style={{ background: 'var(--green)', color: '#fff' }}
        aria-label="Open workspace tools"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
        Workspace
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0" style={{ background: 'rgba(16,26,19,.5)' }} onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[250px] max-w-[82%] overflow-y-auto p-4 shadow-xl" style={{ background: 'var(--paper)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Your workspace</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="w-8 h-8 grid place-items-center rounded-lg hover:bg-[var(--rule-soft)]">
                <svg className="w-4 h-4 text-[var(--ink)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <Nav access={access} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
