'use client';

import { useState, useEffect } from 'react';
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

// Small section icons — one per group header.
const Icon = {
  website: <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm0 3h16M7 6.5h.01M9.5 6.5h.01" />,
  bookings: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />,
  utilities: <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
  gbp: <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />,
  custom: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />,
  profile: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
};

// Every workspace tool, grouped into collapsible blocks. Items the current plan
// doesn't include show a lock + "Upgrade" and open the subscribe popup. Nothing
// is hidden — the doctor always sees what a subscription unlocks.
const BLOCKS = [
  { title: 'Website Builder', accent: 'var(--green)', icon: Icon.website, items: [
    { label: 'AI Generate', href: '/admin/dashboard/ai-generate', f: 'aiGenerate' },
    { label: 'Website Builder', href: '/admin/dashboard/pages', f: 'websiteBuilder' },
    { label: 'Blog Builder', href: '/admin/dashboard/blog-articles', f: 'blogBuilder' },
  ] },
  { title: 'Bookings & Contacts', accent: 'var(--orange)', icon: Icon.bookings, items: [
    { label: 'Website enquiries', href: '/app/control-center/leads', f: 'websiteEnquiries' },
    { label: 'Bookings', href: '/admin/dashboard/bookings', f: 'bookingSystem' },
    { label: 'Slot manager', href: '/admin/dashboard/slots', f: 'bookingSystem' },
    { label: 'Clinic manager', href: '/admin/dashboard/modes', f: 'bookingSystem' },
    { label: 'Contacts', href: '/admin/dashboard/contacts', f: 'contacts' },
    { label: 'Workflows', href: '/admin/dashboard/workflows', f: 'workflows' },
    { label: 'Templates', href: '/admin/dashboard/templates', f: 'templates' },
  ] },
  { title: 'Utilities & Settings', accent: 'var(--green)', icon: Icon.utilities, items: [
    { label: 'Research Agent', href: '/app/control-center/search-trends', f: 'analytics' },
    { label: 'Content planner', href: '/app/control-center/planner', f: 'contentPlanner' },
    { label: 'Workspace', href: '/app/control-center/workspace', f: 'workspace' },
    { label: 'Schedule', href: '/app/control-center/schedule', f: 'schedule' },
    { label: 'Analytics', href: '/admin/dashboard/analytics', f: 'analytics' },
    { label: 'Settings', href: '/admin/dashboard/settings', f: 'settings' },
  ] },
  { title: 'Google Business Profile', accent: 'var(--green)', icon: Icon.gbp, items: [
    { label: 'Manage your profile', href: '/app/control-center/gbp', f: 'gbp' },
  ] },
  { title: 'Customisation', accent: 'var(--green)', icon: Icon.custom, items: [
    { label: 'Diseases & treatments', href: '/app/control-center/clusters', f: 'customisation' },
    { label: 'Content instructions', href: '/app/control-center/profile', f: 'customisation' },
  ] },
  { title: 'My Profile & Links', accent: 'var(--green)', icon: Icon.profile, items: [
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

// The collapsible nav — shared by the desktop rail and the mobile drawer. Each
// section is a tap-to-open group; the group holding the active route starts open.
function Nav({ access, onNavigate }) {
  const pathname = usePathname();
  const can = (f) => !access || !f || access.features?.[f] !== false;

  // Which block contains the active route (so we can keep it expanded)?
  const activeTitle = BLOCKS.find((b) => b.items.some((it) => can(it.f) && isActive(pathname, it.href)))?.title;
  const [open, setOpen] = useState(() => (activeTitle ? { [activeTitle]: true } : {}));
  // As the route changes, make sure the active section is open — never force others shut.
  useEffect(() => {
    if (activeTitle) setOpen((o) => (o[activeTitle] ? o : { ...o, [activeTitle]: true }));
  }, [activeTitle]);
  const toggle = (t) => setOpen((o) => ({ ...o, [t]: !o[t] }));

  const rowCls = 'flex items-center justify-between gap-2 py-[7px] px-2.5 -mx-1 rounded-lg transition-colors';

  return (
    <nav className="flex flex-col gap-1.5">
      {BLOCKS.map((b) => {
        const isOpen = !!open[b.title];
        const tint = b.accent === 'var(--orange)' ? 'rgba(242,106,27,.1)' : 'rgba(9,107,23,.09)';
        return (
          <div key={b.title}>
            {/* Section header — small icon + title; click to open the dropdown. */}
            <button
              type="button"
              onClick={() => toggle(b.title)}
              aria-expanded={isOpen}
              className="w-full flex items-center gap-2.5 py-2 px-2 -mx-1 rounded-lg hover:bg-[var(--rule-soft)] transition-colors"
            >
              <span className="grid place-items-center w-7 h-7 rounded-lg shrink-0" style={{ background: tint }}>
                <svg className="w-[17px] h-[17px]" fill="none" stroke={b.accent} strokeWidth={1.8} viewBox="0 0 24 24">{b.icon}</svg>
              </span>
              <span className="flex-1 text-left text-[13px] font-semibold text-[var(--ink)]">{b.title}</span>
              <svg
                className="w-4 h-4 shrink-0 text-[var(--muted)] transition-transform duration-200"
                style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }}
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              ><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>

            {/* Dropdown — the group's items. */}
            {isOpen && (
              <div className="flex flex-col mt-0.5 mb-1 ml-[26px] pl-2.5" style={{ borderLeft: '1px solid var(--rule-soft)' }}>
                {b.items.map((it) => {
                  const unlocked = can(it.f);
                  const active = unlocked && isActive(pathname, it.href);
                  const inner = (
                    <>
                      <span className="text-[13px] truncate" style={{ color: active ? 'var(--green)' : unlocked ? 'var(--ink)' : 'var(--muted)', fontWeight: active ? 600 : 400 }}>{it.label}</span>
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
            )}
          </div>
        );
      })}
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
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-3 px-1.5">Your tools</h2>
        <Nav access={access} />
      </aside>

      {/* Mobile floating trigger — mirrors the assistant FAB on the opposite side. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed bottom-5 left-5 z-30 inline-flex items-center gap-2 rounded-full pl-3.5 pr-4 py-3 text-[13px] font-semibold shadow-lg"
        style={{ background: 'var(--green)', color: '#fff' }}
        aria-label="Open your tools"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
        Tools
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0" style={{ background: 'rgba(16,26,19,.5)' }} onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[250px] max-w-[82%] overflow-y-auto p-4 shadow-xl" style={{ background: 'var(--paper)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Your tools</h2>
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
