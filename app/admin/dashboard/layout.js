'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import GlobalAssistant from '@/components/practice-os/GlobalAssistant';
import GoogleCalendarPrompt from '@/components/admin/GoogleCalendarPrompt';
import PosNav from '@/components/practice-os/PosNav';
import WorkspaceSidebar from '@/components/practice-os/WorkspaceSidebar';
import UpgradePopup from '@/components/practice-os/UpgradePopup';
// Same design tokens (--paper, pos-link, …) the Control Center uses, so these
// website-builder screens render inside the one unified shell instead of a
// separate sidebar app.
import '@/app/app/practiceos.css';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [access, setAccess] = useState(null);

  // The page builder (/pages/<id>, /pages/new) is a self-contained full-screen
  // app — it has its own top bar, back button and Save, and sizes itself with
  // h-screen. Rendering it inside the PosNav shell (pt-[64px] + padding) makes it
  // overflow the viewport, so on scroll its toolbar slides under the nav. Give it
  // the whole viewport instead.
  const isBuilder = /^\/admin\/dashboard\/pages\/[^/]+/.test(pathname || '');

  useEffect(() => {
    // Auth via httpOnly cookie — same gate as before, just without the sidebar.
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) { const data = await res.json().catch(() => ({})); setIsAuthenticated(true); setAccess(data.access || null); }
        else router.push('/login');
      } catch {
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper)' }}>
        <div className="text-center">
          <div className="animate-spin text-4xl text-[#096b17] mb-4">&#9696;</div>
          <p className="text-[var(--muted)]">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Full-screen builder — no PosNav/padding, it owns the viewport.
  if (isBuilder) return children;

  // The same shell as /app/control-center: fixed PosNav + the workspace sidebar
  // (with the current page highlighted) + warm paper background, so every
  // website-builder screen lives under one unified shell.
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <PosNav />
      <WorkspaceSidebar access={access} />
      {/* Offset content past the fixed desktop rail. */}
      <div className="lg:pl-[240px]">
        <GoogleCalendarPrompt />
        <main className="pt-[64px] min-h-screen">
          <div className="px-4 sm:px-6 lg:px-8 py-6">{children}</div>
        </main>
      </div>
      <UpgradePopup />
      <GlobalAssistant />
    </div>
  );
}
