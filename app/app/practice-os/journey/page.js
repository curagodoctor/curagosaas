'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Your practice-building history (§18) — milestones, evidence, achievements, KPIs.
const ICONS = {
  mission_completed: '✓',
  kpi: '↗',
  evidence: '📷',
  achievement: '★',
  milestone: '🎯',
};
const COLORS = {
  mission_completed: 'var(--green)',
  kpi: 'var(--orange)',
  evidence: 'var(--muted)',
  achievement: 'var(--green)',
  milestone: 'var(--orange)',
};

function JourneyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const packId = params.get('pack');
  const [entries, setEntries] = useState(null);

  useEffect(() => {
    if (!packId) { router.replace('/app/practice-os'); return; }
    (async () => {
      const res = await fetch(`/api/practice-os/journey?pack=${packId}`);
      if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
      if (res.status === 402) { router.push('/app/practice-os/unlock'); return; }
      const data = await res.json();
      setEntries(data.success ? data.entries : []);
    })();
  }, [packId, router]);

  if (!entries) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="max-w-xl mx-auto px-5 py-10">
      <Link href={`/app/practice-os/track?pack=${packId}`} className="pos-link text-sm">← Back to today</Link>

      <div className="my-8">
        <p className="pos-label mb-1">Your journey</p>
        <h1 className="text-[26px] font-semibold text-[var(--ink)]" style={{ letterSpacing: '-0.02em' }}>Everything you&apos;ve built</h1>
        <p className="text-sm text-[var(--muted)] mt-2" style={{ maxWidth: '44ch' }}>
          A running history of your practice-building — the missions, the numbers that moved, the milestones. This is yours to keep.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="pos-card p-8 text-center text-[var(--muted)]">Your timeline starts with your first completed mission.</div>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-1 bottom-1 w-px" style={{ background: 'var(--rule)' }} />
          <div className="space-y-5">
            {entries.map((e) => (
              <div key={e._id} className="relative">
                <span
                  className="absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white"
                  style={{ background: COLORS[e.type] || 'var(--muted)' }}
                >
                  {ICONS[e.type] || '•'}
                </span>
                <p className="text-[var(--ink)] text-[15px] font-medium leading-snug">{e.title}</p>
                {e.description && <p className="text-[13px] text-[var(--muted)]">{e.description}</p>}
                {e.imageUrl && (
                  <a href={e.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={e.imageUrl} alt="" className="rounded-lg max-h-32 border" style={{ borderColor: 'var(--rule)' }} />
                  </a>
                )}
                <p className="text-[11px] text-[var(--muted)] mt-1">{new Date(e.occurredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JourneyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>}>
      <JourneyInner />
    </Suspense>
  );
}
