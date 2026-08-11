'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PosNav from '@/components/practice-os/PosNav';

// Journey & record, combined (§18 + §4/§6). Two views of the same history:
// "Timeline" — milestones, KPIs, achievements; "Record" — the day-by-day logbook.
const DOT = {
  mission_completed: 'var(--green)',
  kpi: 'var(--orange)',
  evidence: 'var(--muted)',
  achievement: 'var(--green)',
  milestone: 'var(--orange)',
};

function Spinner() {
  return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;
}

function monthLabel(d) {
  return new Date(d).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function JourneyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const packId = params.get('pack');
  const [view, setView] = useState(params.get('view') === 'record' ? 'record' : 'timeline');
  const [entries, setEntries] = useState(null);
  const [state, setState] = useState(null);

  useEffect(() => {
    if (!packId) { router.replace('/app/practice-os'); return; }
    (async () => {
      const [jRes, sRes] = await Promise.all([
        fetch(`/api/practice-os/journey?pack=${packId}`),
        fetch(`/api/practice-os/state?pack=${packId}`),
      ]);
      if (jRes.status === 401) { router.push('/login?entry=practice-os'); return; }
      if (jRes.status === 402) { router.push('/app/practice-os/unlock'); return; }
      const jData = await jRes.json();
      setEntries(jData.success ? jData.entries : []);
      const sData = await sRes.json();
      setState(sData?.success ? sData : { days: [] });
    })();
  }, [packId, router]);

  if (!entries || !state) return <Spinner />;

  const done = (state.days || []).filter((d) => d.status === 'completed');

  return (
    <div className="max-w-2xl mx-auto px-5 pt-[64px] pb-10">
      <PosNav breadcrumb={state.pack?.title} />

      <Link href={`/app/practice-os/track?pack=${packId}`} className="pos-link text-sm inline-block mt-6">← Back to today</Link>

      <div className="mt-6 mb-6">
        <p className="pos-label mb-1">Your journey &amp; record</p>
        <h1 className="text-[26px] font-semibold text-[var(--ink)]" style={{ letterSpacing: '-0.02em' }}>Everything you&apos;ve built</h1>
        <p className="text-sm text-[var(--muted)] mt-2" style={{ maxWidth: '46ch' }}>
          Your practice-building history — the milestones and the day-by-day record. This is yours to keep.
        </p>
      </div>

      {/* Timeline / Record toggle */}
      <div className="inline-flex rounded-[9px] p-1 mb-7" style={{ background: 'var(--rule-soft)' }}>
        {[['timeline', 'Timeline'], ['record', 'Record']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className="px-4 py-1.5 text-[13px] font-medium rounded-[7px] transition-colors"
            style={view === key
              ? { background: 'var(--card)', color: 'var(--ink)', boxShadow: '0 1px 2px rgba(16,26,19,.08)' }
              : { color: 'var(--muted)' }}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'timeline' ? (
        <TimelineView entries={entries} />
      ) : (
        <RecordView days={state.days || []} done={done} />
      )}
    </div>
  );
}

// Cleaner timeline (§18) — grouped by month, quiet dots, tight rhythm.
function TimelineView({ entries }) {
  if (entries.length === 0) {
    return <div className="pos-card p-8 text-center text-[var(--muted)]">Your timeline starts with your first completed mission.</div>;
  }

  // Group entries by month so the rail is scannable instead of one long list.
  const groups = [];
  let current = null;
  for (const e of entries) {
    const m = monthLabel(e.occurredAt);
    if (!current || current.month !== m) { current = { month: m, items: [] }; groups.push(current); }
    current.items.push(e);
  }

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <div key={g.month}>
          <p className="pos-label mb-3">{g.month}</p>
          <div className="relative pl-5">
            <div className="absolute left-[3px] top-1.5 bottom-1.5 w-px" style={{ background: 'var(--rule)' }} />
            <div className="space-y-4">
              {g.items.map((e) => (
                <div key={e._id} className="relative">
                  <span className="absolute -left-5 top-[6px] w-[7px] h-[7px] rounded-full" style={{ background: DOT[e.type] || 'var(--muted)' }} />
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[var(--ink)] text-[14.5px] font-medium leading-snug">{e.title}</p>
                    <span className="text-[11px] text-[var(--muted)] shrink-0">{new Date(e.occurredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  {e.description && <p className="text-[13px] text-[var(--muted)] mt-0.5">{e.description}</p>}
                  {e.imageUrl && (
                    <a href={e.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={e.imageUrl} alt="" className="rounded-lg max-h-28 border" style={{ borderColor: 'var(--rule)' }} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// The day-by-day logbook (§4/§6) — no grading, skips are fine.
function RecordView({ days, done }) {
  if (done.length === 0) {
    return <div className="pos-card p-8 text-center text-[var(--muted)]">Nothing recorded yet. Finish today&apos;s mission and it appears here.</div>;
  }
  return (
    <>
      <p className="text-[13px] text-[var(--muted)] mb-4">
        <span className="pos-num text-[var(--ink)]">{done.length}</span> {done.length === 1 ? 'day' : 'days'} of work built. At Day 30 this is your completion record.
      </p>
      <div className="space-y-3">
        {days.map((d) => {
          if (d.status === 'skipped') {
            return (
              <div key={d._id} className="rounded-xl p-4 border border-dashed" style={{ borderColor: 'var(--rule)' }}>
                <p className="text-sm text-[var(--muted)]">Day {d.missionNumber} · skipped — that&apos;s fine.</p>
              </div>
            );
          }
          if (d.status !== 'completed') return null;
          const rec = d.record || {};
          return (
            <div key={d._id} className="pos-card p-5">
              <div className="flex justify-between items-baseline gap-3">
                <p className="font-medium text-[var(--ink)]">Day {d.missionNumber} · {d.title}</p>
                {d.completedAt && <span className="pos-label shrink-0">{new Date(d.completedAt).toLocaleDateString()}</span>}
              </div>
              {rec.notes && <p className="text-sm text-[var(--muted)] mt-2">{rec.notes}</p>}
              {rec.links?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {rec.links.map((l, i) => <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-[13px] text-[var(--green)] truncate">{l}</a>)}
                </div>
              )}
              {rec.screenshots?.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {rec.screenshots.map((s, i) => <img key={i} src={s} alt="" className="w-16 h-16 rounded-lg object-cover border" style={{ borderColor: 'var(--rule)' }} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function JourneyPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <JourneyInner />
    </Suspense>
  );
}
