'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PosNav from '@/components/practice-os/PosNav';

// Disease-cluster review — after GBP approval the doctor reviews the diseases
// they treat and each disease's treatments (drafted from their practice map),
// edits, and approves. Approved diseases + treatments feed content generation
// and become GBP service lines.
function ClustersInner() {
  const router = useRouter();
  const [clusters, setClusters] = useState(null);
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState('');
  const [newTreat, setNewTreat] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await fetch('/api/practice-os/clusters', { credentials: 'include' }).then((r) => r.json());
      if (d.success) setClusters(d.clusters || []);
      else setClusters([]);
    } catch { setClusters([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const cur = clusters?.[idx];
  const approvedCount = (clusters || []).filter((c) => c.approved).length;

  const save = async (id, body, optimistic) => {
    if (optimistic) setClusters((arr) => arr.map((c) => c._id === id ? { ...c, ...optimistic } : c));
    const d = await fetch(`/api/practice-os/clusters/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body),
    }).then((r) => r.json());
    if (d.success && d.cluster) setClusters((arr) => arr.map((c) => c._id === id ? d.cluster : c));
  };

  const addTreatment = () => {
    const name = newTreat.trim();
    if (!name || !cur) return;
    const treatments = [...(cur.treatments || []), { name, source: 'manual' }];
    save(cur._id, { treatments }, { treatments });
    setNewTreat('');
  };
  const removeTreatment = (i) => {
    const treatments = cur.treatments.filter((_, j) => j !== i);
    save(cur._id, { treatments }, { treatments });
  };
  const suggest = async () => {
    if (!cur) return;
    setBusy('suggest'); setErr('');
    try {
      const d = await fetch(`/api/practice-os/clusters/${cur._id}/suggest`, { method: 'POST', credentials: 'include' }).then((r) => r.json());
      if (d.success && d.cluster) setClusters((arr) => arr.map((c) => c._id === cur._id ? d.cluster : c));
      else if (d.error === 'PaymentRequired') setErr('Suggestions need an active plan.');
      else if (d.error === 'NoCredits') setErr(d.message || "You've used today's AI credits.");
      else setErr(d.error || 'Could not suggest.');
    } catch { setErr('The assistant is unavailable.'); } finally { setBusy(''); }
  };
  const approveAndNext = async () => {
    if (!cur) return;
    await save(cur._id, { approved: true }, { approved: true, approvedAt: new Date().toISOString() });
    if (idx < clusters.length - 1) { setIdx(idx + 1); window.scrollTo(0, 0); }
  };
  const addDisease = async () => {
    const name = prompt('Disease / condition name');
    if (!name || !name.trim()) return;
    const d = await fetch('/api/practice-os/clusters', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ name: name.trim() }),
    }).then((r) => r.json());
    if (d.success && d.cluster) { setClusters((arr) => [...arr, d.cluster]); setIdx((clusters?.length) || 0); }
  };

  if (clusters === null) return <div className="min-h-screen grid place-items-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;

  const allReviewed = clusters.length > 0 && approvedCount === clusters.length;
  const serviceLines = clusters.filter((c) => c.approved).flatMap((c) => (c.treatments || []).map((t) => `${t.name} — ${c.name}`));

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 pt-[64px] pb-10 max-w-[880px] mx-auto">
      <PosNav breadcrumb="Review your practice" />
      <p className="pos-label mb-2" style={{ color: 'var(--orange)' }}>AI generated · editable</p>
      <h1 className="text-[26px] md:text-[34px] font-semibold text-[var(--ink)] leading-tight" style={{ letterSpacing: '-0.027em' }}>Review this disease and its treatments.</h1>
      <p className="text-[15px] text-[var(--muted)] mt-2.5 leading-relaxed" style={{ maxWidth: '60ch' }}>
        CuraGo drafted this from your practice map. Change anything that doesn&apos;t sound like your practice, then approve it — approved items become pages, posts and GBP services.
      </p>

      {clusters.length === 0 ? (
        <div className="pos-card p-8 text-center mt-8">
          <p className="text-[var(--muted)] text-sm">We couldn&apos;t find any diseases on your profile yet. Add the conditions you treat in your profile, or add one here.</p>
          <button onClick={addDisease} className="pos-action mt-4">+ Add a disease</button>
        </div>
      ) : (
        <>
          {cur && (
            <div className="pos-card p-6 mt-6" style={{ borderColor: cur.approved ? 'var(--green)' : 'var(--rule)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="pos-label" style={{ color: 'var(--muted)' }}>Disease {String(idx + 1).padStart(2, '0')} of {clusters.length}</p>
                {cur.approved && <span className="pos-label" style={{ color: 'var(--green)' }}>Approved ✓</span>}
              </div>
              <input
                value={cur.name}
                onChange={(e) => setClusters((arr) => arr.map((c) => c._id === cur._id ? { ...c, name: e.target.value } : c))}
                onBlur={() => save(cur._id, { name: cur.name })}
                className="w-full text-[20px] font-semibold text-[var(--ink)] pos-card p-2.5 mb-4"
              />

              <p className="pos-label mb-2">Treatments for this disease <span className="text-[var(--muted)]">· {cur.treatments?.length || 0}</span></p>
              <div className="space-y-2">
                {(cur.treatments || []).map((t, i) => (
                  <div key={i} className="flex items-center gap-2 pos-card px-3 py-2">
                    <span className="pos-num text-[12px] text-[var(--muted)] w-6">{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1 text-[14px] text-[var(--ink)]">{t.name}</span>
                    {t.source === 'ai' && <span className="pos-label text-[9px]" style={{ color: 'var(--orange)' }}>AI</span>}
                    <button onClick={() => removeTreatment(i)} className="text-[var(--muted)] hover:text-red-600 text-lg leading-none">×</button>
                  </div>
                ))}
                {(cur.treatments || []).length === 0 && <p className="text-[13px] text-[var(--muted)]">No treatments yet — add one or suggest with AI.</p>}
              </div>

              <div className="flex items-stretch gap-2 mt-3">
                <input value={newTreat} onChange={(e) => setNewTreat(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addTreatment(); }} placeholder="Add a treatment…" className="flex-1 pos-card p-2.5 text-sm" />
                <button onClick={addTreatment} disabled={!newTreat.trim()} className="pos-card px-3 text-[14px] font-medium" style={{ color: 'var(--ink)' }}>Add</button>
              </div>
              <button onClick={suggest} disabled={busy === 'suggest'} className="mt-3 text-[13px] font-semibold" style={{ color: 'var(--orange)' }}>
                {busy === 'suggest' ? 'Thinking…' : '✨ Suggest treatments with AI'}
              </button>
              {err && <p className="text-[13px] text-red-600 mt-2">{err}</p>}

              <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t" style={{ borderColor: 'var(--rule-soft)' }}>
                <button onClick={() => { if (idx > 0) { setIdx(idx - 1); window.scrollTo(0, 0); } }} disabled={idx === 0} className="pos-link text-sm disabled:opacity-40" style={{ color: 'var(--muted)' }}>← Previous</button>
                <button onClick={approveAndNext} className="pos-action">{cur.approved ? (idx < clusters.length - 1 ? 'Next disease →' : 'Done') : (idx < clusters.length - 1 ? 'Approve & next →' : 'Approve')}</button>
              </div>
            </div>
          )}

          {/* Approved so far */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="pos-label">Approved so far <span className="text-[var(--muted)]">· {approvedCount} of {clusters.length}</span></p>
              <button onClick={addDisease} className="pos-link text-[12px]">+ Add disease</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {clusters.map((c, i) => (
                <button key={c._id} onClick={() => { setIdx(i); window.scrollTo(0, 0); }} className="pos-card px-3 py-1.5 text-[13px]" style={{ borderColor: c.approved ? 'var(--green)' : 'var(--rule)', color: c.approved ? 'var(--green)' : 'var(--muted)' }}>
                  {c.name}{c.approved ? ' ✓' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* GBP services — once at least one disease is approved */}
          {approvedCount > 0 && (
            <div className="pos-card p-6 mt-8" style={{ background: 'var(--green-soft)', borderColor: 'var(--green)' }}>
              <p className="pos-label" style={{ color: 'var(--green)' }}>Next action · Google Business Profile</p>
              <h2 className="text-[19px] font-semibold text-[var(--ink)] mt-1">Post these as services on your profile.</h2>
              <p className="text-[13.5px] text-[var(--muted)] mt-1" style={{ maxWidth: '58ch' }}>You approved {approvedCount} disease{approvedCount === 1 ? '' : 's'} and {serviceLines.length} treatment{serviceLines.length === 1 ? '' : 's'}. Add them as services so the local clinic matches the global one.</p>
              <div className="mt-4 space-y-1.5 max-h-56 overflow-y-auto">
                {serviceLines.map((l, i) => (
                  <div key={i} className="flex gap-2 text-[13px] text-[var(--ink)]"><span className="pos-num text-[var(--muted)] w-6">{String(i + 1).padStart(2, '0')}</span>{l}</div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-5">
                <button onClick={() => { navigator.clipboard?.writeText(serviceLines.map((l, i) => `${i + 1}. ${l}`).join('\n')); }} className="pos-card px-4 py-2.5 text-[14px] font-medium">Copy all services</button>
                <a href="https://business.google.com/" target="_blank" rel="noreferrer" className="pos-action">Open Google Business Profile →</a>
              </div>
            </div>
          )}

          {allReviewed && (
            <div className="text-center mt-8">
              <p className="text-[14px] text-[var(--green)] font-medium mb-3">All diseases reviewed and approved.</p>
              <button onClick={() => router.push('/app/zero-to-practice-builder')} className="pos-action">Go to my control center →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ClustersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>}>
      <ClustersInner />
    </Suspense>
  );
}
