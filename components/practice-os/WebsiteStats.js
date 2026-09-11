'use client';

import { useState, useEffect } from 'react';

// §9 — basic website analytics on the control center.
export default function WebsiteStats() {
  const [s, setS] = useState(null);

  useEffect(() => {
    let on = true;
    fetch('/api/practice-os/website-stats', { credentials: 'include' })
      .then((r) => r.json()).then((d) => { if (on) setS(d.success ? d.stats : null); })
      .catch(() => { if (on) setS(null); });
    return () => { on = false; };
  }, []);

  if (!s || !s.hasSite) return null;

  const cells = [
    { label: 'Website visits', value: s.visits },
    { label: 'New requests · 7d', value: s.newRequests7d },
    { label: 'Published pages', value: s.publishedPages },
    { label: 'Article views', value: s.blogViews },
  ];

  return (
    <div className="pos-card p-4">
      <p className="pos-label mb-3">Your website</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cells.map((c) => (
          <div key={c.label}>
            <p className="pos-num text-[22px] text-[var(--ink)]" style={{ fontVariantNumeric: 'tabular-nums' }}>{(c.value || 0).toLocaleString('en-IN')}</p>
            <p className="text-[11.5px] text-[var(--muted)] mt-0.5 leading-tight">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
