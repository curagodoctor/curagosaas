'use client';

import { useState, useEffect } from 'react';

// Control-center card: the doctor's recently published blog pages, each with a
// Preview link (opens the live page). Publishing from the daily-task chatbot goes
// live immediately, so this is where the doctor previews what went out.
export default function PublishedContent() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    fetch('/api/practice-os/pending-work', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d.success) setItems(d.published || []); })
      .catch(() => setItems([]));
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <div className="pos-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="pos-label" style={{ color: 'var(--green)' }}>Published content</p>
        <span className="text-[11px] text-[var(--muted)]">{items.length} live</span>
      </div>
      <div className="space-y-2.5">
        {items.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13.5px] text-[var(--ink)] font-medium truncate">{a.title}</p>
              <p className="text-[11px] text-[var(--muted)]">
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: 'var(--green)' }} />Live
                {a.publishedAt ? ` · ${new Date(a.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
              </p>
            </div>
            <a href={a.url} target="_blank" rel="noreferrer" className="pos-link text-[12.5px] font-medium shrink-0" style={{ color: 'var(--green)' }}>Preview →</a>
          </div>
        ))}
      </div>
    </div>
  );
}
