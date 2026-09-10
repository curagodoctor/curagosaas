'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PosNav from '@/components/practice-os/PosNav';

// §2 — the free setup funnel as a guided checklist. Sequences the steps a new
// doctor moves through (address → profile → website → first article → GBP),
// each with live completion status and a single clear next action. Not a rebuild
// of the individual tools — it routes into the ones that already exist.
const STEPS = [
  { key: 'subdomain', title: 'Claim your website address', desc: 'Your patients find you here.', href: '/app/onboarding', cta: 'Choose address' },
  { key: 'profileBuilt', title: 'Build your profile with AI', desc: 'Answer a few prompts — the AI writes it up, you edit and approve.', href: '/app/zero-to-practice-builder/profile/build', cta: 'Build profile' },
  { key: 'websiteReady', title: 'Generate your website', desc: 'Your site is written from your profile and goes live — no redirection.', href: '/admin/dashboard/ai-generate', cta: 'Generate website' },
  { key: 'firstBlog', title: 'Publish your first article', desc: 'A patient-education page that helps people find you on Google.', href: '/admin/dashboard/ai-generate', cta: 'Write an article' },
  { key: 'gbpConnected', title: 'Set up Google Business Profile', desc: 'The single biggest lever for being found locally.', href: '/admin/dashboard/gmb', cta: 'Set up GBP' },
];

export default function StartPage() {
  const router = useRouter();
  const [steps, setSteps] = useState(null);
  const [sub, setSub] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/practice-os/onboarding-status', { credentials: 'include' });
      if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
      const d = await res.json();
      setSteps(d.steps || {});
      setSub(d.subdomainName || '');
    } catch { setSteps({}); }
  }, [router]);
  useEffect(() => { load(); }, [load]);

  const doneCount = steps ? STEPS.filter((s) => steps[s.key]).length : 0;
  const total = STEPS.length;
  const pct = Math.round((doneCount / total) * 100);
  // The first not-yet-done step is the highlighted "next" action.
  const nextKey = steps ? (STEPS.find((s) => !steps[s.key])?.key || null) : null;

  return (
    <div className="max-w-2xl mx-auto px-5 pt-[64px] pb-10">
      <PosNav breadcrumb="Get set up" />

      <div className="mt-8 mb-5">
        <p className="pos-label mb-1">Get set up</p>
        <h1 className="text-[26px] font-semibold text-[var(--ink)]" style={{ letterSpacing: '-0.02em' }}>
          {doneCount >= total ? "You're all set up" : 'A few steps to get you found online'}
        </h1>
        <p className="text-sm text-[var(--muted)] mt-2" style={{ maxWidth: '52ch' }}>
          {doneCount >= total
            ? 'Everything below is done. Keep your details fresh and your Google presence growing.'
            : 'Do these in order — each one takes about 10 minutes. You can leave and come back anytime.'}
        </p>
      </div>

      {/* Progress */}
      <div className="pos-card p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="pos-label">Setup progress</span>
          <span className="text-[13px] text-[var(--muted)]"><span className="pos-num text-[var(--ink)]">{doneCount}</span> of {total}</span>
        </div>
        <div className="pos-meter"><span style={{ width: `${pct}%` }} /></div>
      </div>

      {/* Steps */}
      {steps === null ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : (
        <ol className="space-y-3">
          {STEPS.map((s, i) => {
            const done = !!steps[s.key];
            const isNext = s.key === nextKey;
            const showSub = s.key === 'subdomain' && done && sub;
            return (
              <li key={s.key} className="pos-card p-4" style={{ borderColor: isNext ? 'var(--orange)' : done ? 'var(--green)' : 'var(--rule)' }}>
                <div className="flex items-start gap-3">
                  <span
                    className="pos-num flex items-center justify-center rounded-full shrink-0"
                    style={{ width: 28, height: 28, fontSize: 13, background: done ? 'var(--green)' : isNext ? 'var(--orange)' : 'var(--rule-soft)', color: done || isNext ? '#fff' : 'var(--muted)' }}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-[var(--ink)]">{s.title}</p>
                    <p className="text-[13px] text-[var(--muted)] mt-0.5">
                      {showSub ? <>Live at <b>{sub}.curago.in</b></> : s.desc}
                    </p>
                    {!done && (
                      <button
                        onClick={() => router.push(s.href)}
                        className={isNext ? 'pos-action mt-3' : 'pos-link mt-3'}
                        style={isNext ? { padding: '9px 16px' } : { fontSize: 14 }}
                      >
                        {isNext ? s.cta : `${s.cta} →`}
                      </button>
                    )}
                    {done && (
                      <button onClick={() => router.push(s.href)} className="pos-link mt-2" style={{ fontSize: 13 }}>
                        Review →
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {steps !== null && doneCount >= total && (
        <button onClick={() => router.push('/app/zero-to-practice-builder')} className="pos-action mt-6" style={{ width: '100%' }}>
          Go to my control center
        </button>
      )}
    </div>
  );
}
