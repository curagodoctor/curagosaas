'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import PosNav from '@/components/practice-os/PosNav';
import WorkspaceSidebar from '@/components/practice-os/WorkspaceSidebar';
import UpgradePopup from '@/components/practice-os/UpgradePopup';

// Routes that own the full viewport (wizards / distraction-free task views) —
// the shell (nav + sidebar) is hidden on these. Everything else renders inside
// the shell.
const FULL_SCREEN = ['/onboard', '/setup', '/record', '/unlock', '/focus'];

// Breadcrumb shown next to the logo, derived from the route.
const BREADCRUMB = {
  content: 'Your content',
  gbp: 'Google Business Profile',
  profile: 'My profile',
  links: 'Links',
  leads: 'Website enquiries',
  clusters: 'Diseases & treatments',
  planner: 'Content planner',
  workspace: 'Workspace',
  schedule: 'Schedule',
  score: 'Your progress',
  journey: 'Journey & record',
  report: 'Report',
  day: 'Today’s task',
  leaderboard: 'Leaderboard',
  track: 'Your pack',
  start: 'Get started',
  'get-access': 'Get access',
};

function breadcrumbFor(pathname) {
  // last non-id segment, e.g. /app/control-center/gbp -> 'gbp'
  const parts = (pathname || '').split('/').filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    if (BREADCRUMB[parts[i]]) return BREADCRUMB[parts[i]];
  }
  return null;
}

export default function ControlCenterLayout({ children }) {
  const pathname = usePathname();
  const [access, setAccess] = useState(null);

  const fullScreen = FULL_SCREEN.some((p) => (pathname || '').includes(`/control-center${p}`));

  useEffect(() => {
    if (fullScreen) return;
    let alive = true;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d) setAccess(d.access || null); })
      .catch(() => {});
    return () => { alive = false; };
  }, [fullScreen]);

  if (fullScreen) return children;

  return (
    <>
      <PosNav breadcrumb={breadcrumbFor(pathname)} />
      <WorkspaceSidebar access={access} />
      {/* Offset page content past the fixed desktop rail. */}
      <div className="lg:pl-[240px]">{children}</div>
      {/* One global subscribe popup, opened from the sidebar / banners / locked tools. */}
      <UpgradePopup />
    </>
  );
}
