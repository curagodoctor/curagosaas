'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// §8 — "your practice awaits your approval". Two states:
//  ready   — new work is waiting for a first look
//  backlog — work has been sitting a few days
// Hidden when there's nothing to review.
export default function PendingWorkPrompt() {
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    let on = true;
    fetch('/api/practice-os/pending-work', { credentials: 'include' })
      .then((r) => r.json()).then((d) => { if (on) setData(d.success ? d : null); })
      .catch(() => { if (on) setData(null); });
    return () => { on = false; };
  }, []);

  if (!data || data.state === 'clear' || data.count === 0) return null;

  const backlog = data.state === 'backlog';
  const parts = [];
  if (data.articles?.length) parts.push(`${data.articles.length} education ${data.articles.length === 1 ? 'page' : 'pages'}`);
  if (data.pageDrafts) parts.push(`${data.pageDrafts} website ${data.pageDrafts === 1 ? 'update' : 'updates'}`);
  const summary = parts.join(' · ');

  const goToFirst = () => {
    if (data.articles?.[0]?.id) router.push(`/admin/dashboard/blog-articles/${data.articles[0].id}`);
    else router.push('/admin/dashboard/blog-articles');
  };

  return (
    <div className="pos-card p-5" style={{ borderColor: 'var(--orange)', background: 'var(--orange-soft)' }}>
      <p className="pos-label" style={{ color: 'var(--orange)' }}>
        {backlog ? 'Waiting for you' : 'Your practice needs review'}
      </p>
      <p className="text-[16px] font-semibold text-[var(--ink)] mt-1">
        {backlog
          ? `You have ${data.oldestDays} days of work waiting for your review.`
          : `${data.count} ${data.count === 1 ? 'item is' : 'items are'} ready for your review.`}
      </p>
      {summary && <p className="text-[13px] text-[var(--muted)] mt-1">We&apos;ve created {summary} — look them over and publish.</p>}
      <button onClick={goToFirst} className="pos-action mt-3">
        {backlog ? 'Catch up now' : 'Review & publish'}
      </button>
    </div>
  );
}
