'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// §11 — on-screen engagement nudges. Gives the doctor one small thing to do on
// the platform. Rotates daily so it doesn't feel static; dismissible for the visit.
const NUDGES = [
  { label: 'Check your NAP', body: 'Make sure your clinic name, address and phone match exactly on Google, your website and directories.', cta: 'Check now', href: '/admin/dashboard/gmb' },
  { label: 'Send review requests', body: 'A few fresh Google reviews go a long way. Send requests to recent patients today.', cta: 'Send requests', href: '/admin/dashboard/gmb/requests' },
  { label: 'Try the AI builder', body: 'Generate a new education page or sharpen your website copy in a few minutes.', cta: 'Open builder', href: '/admin/dashboard/ai-generate' },
  { label: 'Your week in numbers', body: 'See how your website did this week — visits, requests and article views.', cta: 'See stats', href: '/admin/dashboard' },
];

export default function EngagementNudges() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  // Deterministic daily rotation (no randomness that changes every render).
  const n = NUDGES[new Date().getDate() % NUDGES.length];

  return (
    <div className="pos-card p-4 flex items-start gap-3" style={{ borderColor: 'var(--green)' }}>
      <div className="flex-1 min-w-0">
        <p className="pos-label" style={{ color: 'var(--green)' }}>Today&apos;s nudge · {n.label}</p>
        <p className="text-[14px] text-[var(--ink)] mt-1" style={{ lineHeight: 1.55 }}>{n.body}</p>
        <button onClick={() => router.push(n.href)} className="pos-action mt-3" style={{ padding: '8px 15px' }}>{n.cta}</button>
      </div>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="shrink-0 text-[var(--muted)] hover:text-[var(--ink)] p-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}
