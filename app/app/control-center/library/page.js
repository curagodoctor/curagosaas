'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// My Library — the books & courses the doctor has bought from the store. Each
// opens a secure in-app reader (book) or player (course); nothing is downloadable.
export default function LibraryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/store/library', { credentials: 'include' }).then((r) => r.json())
      .then((d) => { if (d.success) setItems(d.items || []); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="pos-root" style={{ background: 'var(--paper)', minHeight: '100%' }}>
      <div className="mx-auto max-w-[980px] px-5 md:px-8 py-8 md:py-10">
        <div className="mb-6">
          <div className="text-[10.5px] font-mono uppercase tracking-[0.11em]" style={{ color: 'var(--muted)' }}>My library</div>
          <h1 className="text-[26px] md:text-[32px] font-semibold leading-tight mt-1" style={{ color: 'var(--ink)', letterSpacing: '-0.025em' }}>Your books &amp; courses</h1>
          <p className="text-[14px] mt-2" style={{ color: 'var(--muted)' }}>Everything you’ve bought, read and watched securely from your account.</p>
        </div>

        {loading ? (
          <p className="text-[14px]" style={{ color: 'var(--muted)' }}>Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: 'var(--card)', border: '1px solid var(--rule-soft)' }}>
            <p className="text-[15px] mb-1" style={{ color: 'var(--ink)' }}>Your library is empty.</p>
            <p className="text-[14px] mb-4" style={{ color: 'var(--muted)' }}>Browse books and courses in the store.</p>
            <Link href="/store" className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13.5px] font-semibold text-white" style={{ background: 'var(--orange)' }}>Visit the store</Link>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {items.map((p) => (
              <Link key={p.id} href={`/app/control-center/library/${p.id}`} className="rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow" style={{ background: 'var(--card)', border: '1px solid var(--rule-soft)' }}>
                <div style={{ aspectRatio: '16/10', background: 'var(--rule-soft)', position: 'relative' }}>
                  {p.coverUrl ? <img src={p.coverUrl} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="grid place-items-center h-full text-[13px]" style={{ color: 'var(--muted)' }}>{p.type === 'course' ? 'Video course' : 'Book'}</div>}
                  <span className="absolute top-2.5 left-2.5 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-white" style={{ background: p.type === 'course' ? 'var(--orange)' : 'var(--green)' }}>{p.type === 'course' ? 'Course' : 'Book'}</span>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-1">
                  <h3 className="text-[15.5px] font-semibold" style={{ color: 'var(--ink)' }}>{p.title}</h3>
                  {p.summary && <p className="text-[13px]" style={{ color: 'var(--muted)' }}>{p.summary}</p>}
                  <span className="text-[12.5px] font-semibold mt-2" style={{ color: 'var(--green)' }}>{p.type === 'course' ? 'Watch →' : 'Read →'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
