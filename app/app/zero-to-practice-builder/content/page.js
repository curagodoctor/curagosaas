'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PosNav from '@/components/practice-os/PosNav';

// §3 — the optimization surface. To the doctor this is "content", not "tasks":
// they review AI-generated output and approve/publish it. Simplified — no
// lectures or steps. Gated behind the Get Access grant; the persistent assistant
// (bottom-right) is the chatbot for this screen.
export default function ContentPage() {
  const router = useRouter();
  const [state, setState] = useState(null); // { access, items, pageDrafts }
  const [gen, setGen] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const [acc, pend] = await Promise.all([
        fetch('/api/practice-os/access-request', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/practice-os/pending-work', { credentials: 'include' }).then((r) => r.json()),
      ]);
      setState({ access: acc.granted, items: pend.articles || [], pageDrafts: pend.pageDrafts || 0 });
    } catch { setState({ access: false, items: [], pageDrafts: 0 }); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const generateNext = async () => {
    setGen('run'); setMsg('');
    try {
      const d = await fetch('/api/practice-os/actions/generate-next-page', { method: 'POST', credentials: 'include' }).then((r) => r.json());
      if (d.success && d.id) { router.push(`/admin/dashboard/blog-articles/${d.id}`); return; }
      setMsg(d.message || d.error || 'Could not create content.');
    } catch { setMsg('Something went wrong.'); }
    finally { setGen(''); }
  };

  return (
    <div className="max-w-2xl mx-auto px-5 pt-[64px] pb-10">
      <PosNav breadcrumb="Your content" />

      {state === null ? (
        <p className="text-sm text-[var(--muted)] mt-8">Loading…</p>
      ) : !state.access ? (
        <div className="mt-8 pos-card p-6" style={{ borderColor: 'var(--orange)', background: 'var(--orange-soft)' }}>
          <p className="pos-label" style={{ color: 'var(--orange)' }}>Locked</p>
          <h1 className="text-[22px] font-semibold text-[var(--ink)] mt-1" style={{ letterSpacing: '-0.02em' }}>Unlock your ongoing content</h1>
          <p className="text-sm text-[var(--muted)] mt-2" style={{ maxWidth: '52ch' }}>This is where we prepare content for your practice and you review and publish it. Request access to open it up.</p>
          <button onClick={() => router.push('/app/zero-to-practice-builder/get-access')} className="pos-action mt-4">Get access</button>
        </div>
      ) : (
        <>
          <div className="mt-8 mb-5">
            <p className="pos-label" style={{ color: 'var(--green)' }}>Your content</p>
            <h1 className="text-[26px] font-semibold text-[var(--ink)]" style={{ letterSpacing: '-0.02em' }}>Review what we&apos;ve prepared.</h1>
            <p className="text-sm text-[var(--muted)] mt-2" style={{ maxWidth: '52ch' }}>We write it — you review, edit if needed, and publish. Ask the assistant (bottom-right) anytime.</p>
          </div>

          {state.items.length === 0 && state.pageDrafts === 0 ? (
            <div className="pos-card p-6 text-center">
              <p className="text-[15px] text-[var(--ink)] font-medium">You&apos;re all caught up.</p>
              <p className="text-[13px] text-[var(--muted)] mt-1 mb-4">Generate your next education page whenever you&apos;re ready.</p>
              <button onClick={generateNext} disabled={gen === 'run'} className="pos-action">{gen === 'run' ? 'Preparing…' : '✨ Generate my next page'}</button>
              {msg && <p className="text-[13px] text-[var(--muted)] mt-3">{msg}</p>}
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {state.pageDrafts > 0 && (
                  <li className="pos-card p-4 flex items-center justify-between gap-3" style={{ borderLeft: '3px solid var(--green)' }}>
                    <div className="min-w-0">
                      <span className="pos-label" style={{ color: 'var(--green)' }}>Website</span>
                      <p className="text-[15px] font-medium text-[var(--ink)] mt-0.5">A homepage update is ready to review</p>
                    </div>
                    <button onClick={() => router.push('/admin/dashboard/ai-generate')} className="pos-action shrink-0" style={{ padding: '9px 16px' }}>Review &amp; publish</button>
                  </li>
                )}
                {state.items.map((it) => (
                  <li key={it.id} className="pos-card p-4 flex items-center justify-between gap-3" style={{ borderLeft: '3px solid var(--green)' }}>
                    <div className="min-w-0">
                      <span className="pos-label" style={{ color: 'var(--green)' }}>Education page</span>
                      <p className="text-[15px] font-medium text-[var(--ink)] mt-0.5 truncate">{it.title}</p>
                    </div>
                    <button onClick={() => router.push(`/admin/dashboard/blog-articles/${it.id}`)} className="pos-action shrink-0" style={{ padding: '9px 16px' }}>Review &amp; publish</button>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center gap-3">
                <button onClick={generateNext} disabled={gen === 'run'} className="pos-link" style={{ fontSize: 14 }}>{gen === 'run' ? 'Preparing…' : '✨ Generate another page'}</button>
              </div>
              {msg && <p className="text-[13px] text-[var(--muted)] mt-3">{msg}</p>}
            </>
          )}
        </>
      )}
    </div>
  );
}
