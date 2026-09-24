'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PosNav from '@/components/practice-os/PosNav';

// Disease-cluster review (matches the Dominate onboarding prototype). Two stages:
//  1. disease  — review each AI-drafted disease + its 1-2 treatments, one at a
//                time; edit, add/remove treatments, approve. Treatment numbering
//                is CONTINUOUS across diseases (01, 02, 03…).
//  2. gbp      — post the approved treatments as GBP services.
const PER_DISEASE_MIN = 1;
const PER_DISEASE_MAX = 3;
const TOTAL_TREATMENT_CAP = 20; // across all 10 diseases
const LEAF_SOFT = 'var(--green-soft, rgba(9,107,23,.09))';

function ClustersInner() {
  const router = useRouter();
  const [clusters, setClusters] = useState(null);
  const [idx, setIdx] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [genErr, setGenErr] = useState('');
  const [busy, setBusy] = useState('');
  const [newTreat, setNewTreat] = useState('');
  const [mode, setMode] = useState(null); // 'diseases' (surgical) | 'treatments' (non-surgical)

  // Generate the chosen pathway: diseases+treatments (surgical) or treatments-only.
  const doGenerate = useCallback(async (chosen) => {
    setMode(chosen);
    setGenerating(true); setGenErr('');
    const endpoint = chosen === 'treatments'
      ? '/api/practice-os/clusters/generate-treatments'
      : '/api/practice-os/clusters/generate';
    try {
      const d = await fetch(endpoint, { method: 'POST', credentials: 'include' }).then((r) => r.json());
      if (d.success) { setClusters(d.clusters || []); setIdx(0); }
      else if (d.error === 'PaymentRequired') setGenErr('This is part of the optimization program — request access first.');
      else if (d.error === 'NoCredits') setGenErr(d.message || "You've used today's AI credits.");
      else setGenErr(d.error || 'Could not generate your map.');
    } catch { setGenErr('Something went wrong.'); } finally { setGenerating(false); }
  }, []);

  const load = useCallback(async () => {
    try {
      const d = await fetch('/api/practice-os/clusters', { credentials: 'include' }).then((r) => r.json());
      const cl = d.success ? (d.clusters || []) : [];
      setClusters(cl);
      // Existing map → infer its mode. Empty → show the pathway choice (no auto-gen).
      if (cl.length) setMode(cl[0]?.kind === 'treatment' ? 'treatments' : 'diseases');
    } catch { setClusters([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const isTreatmentMode = mode === 'treatments' || (clusters && clusters[0]?.kind === 'treatment');
  const cur = clusters?.[idx];
  const total = clusters?.length || 0;
  const treatTotal = (clusters || []).reduce((n, c) => n + (c.treatments?.length || 0), 0);
  const serialOffset = (clusters || []).slice(0, idx).reduce((n, c) => n + (c.treatments?.length || 0), 0);
  const approvedClusters = (clusters || []).filter((c) => c.approved);
  const approvedCount = approvedClusters.length;

  const patchLocal = (id, body) => setClusters((arr) => arr.map((c) => c._id === id ? { ...c, ...body } : c));
  const save = async (id, body) => {
    patchLocal(id, body);
    const d = await fetch(`/api/practice-os/clusters/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body),
    }).then((r) => r.json()).catch(() => ({}));
    if (d.success && d.cluster) patchLocal(id, d.cluster);
  };

  const setName = (v) => patchLocal(cur._id, { name: v });
  const setTreatment = (i, v) => { const treatments = cur.treatments.map((t, j) => j === i ? { ...t, name: v } : t); patchLocal(cur._id, { treatments }); };
  const addTreatment = () => {
    if ((cur.treatments?.length || 0) >= PER_DISEASE_MAX) return; // max 3 per disease
    if (treatTotal >= TOTAL_TREATMENT_CAP) return;                // max 20 overall
    const name = newTreat.trim() || 'New treatment';
    const treatments = [...(cur.treatments || []), { name, source: 'manual' }];
    save(cur._id, { treatments }); setNewTreat('');
  };
  // Keep at least one treatment per disease (min 1).
  const removeTreatment = (i) => {
    if ((cur.treatments?.length || 0) <= PER_DISEASE_MIN) return;
    const treatments = cur.treatments.filter((_, j) => j !== i); save(cur._id, { treatments });
  };

  const regenerate = async () => {
    if (!cur) return;
    setBusy('regen'); setGenErr('');
    try {
      const d = await fetch(`/api/practice-os/clusters/${cur._id}/suggest`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ replace: true }),
      }).then((r) => r.json());
      if (d.success && d.cluster) patchLocal(cur._id, d.cluster);
      else if (d.error === 'PaymentRequired') setGenErr('Regeneration needs an active plan.');
      else if (d.error === 'NoCredits') setGenErr(d.message || "You've used today's AI credits.");
      else setGenErr(d.error || 'Could not regenerate.');
    } catch { setGenErr('The assistant is unavailable.'); } finally { setBusy(''); }
  };

  const approveAndContinue = async () => {
    if (!cur) return;
    // Flush a treatment the doctor typed but didn't click "+ Add" — so approving
    // never silently drops it (respecting per-disease max 3 and the 20 overall cap).
    let treatments = cur.treatments || [];
    const pending = newTreat.trim();
    if (pending
      && treatments.length < PER_DISEASE_MAX
      && treatTotal < TOTAL_TREATMENT_CAP
      && !treatments.some((t) => t.name.toLowerCase() === pending.toLowerCase())) {
      treatments = [...treatments, { name: pending, source: 'manual' }];
      setNewTreat('');
    }
    if (treatments.length < PER_DISEASE_MIN) { setGenErr('Add at least one treatment for this disease before approving.'); return; }
    setGenErr('');
    await save(cur._id, { name: cur.name, treatments, approved: true });
    // Last disease approved → straight into the content/control center.
    if (idx >= total - 1) { router.push('/app/control-center'); return; }
    setIdx(idx + 1); window.scrollTo(0, 0);
  };

  const mono = { fontFamily: 'var(--font-mono, ui-monospace, monospace)' };

  if (clusters === null) return <div className="min-h-screen grid place-items-center" style={{ background: 'var(--paper)' }}><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <div className="w-full px-4 sm:px-8 lg:px-12 pt-[64px] pb-12 max-w-[860px] mx-auto">
        <PosNav breadcrumb="Practice map review" />

        {/* ---- empty: pathway choice / generating ---- */}
        {clusters.length === 0 ? (
          generating ? (
            <div className="pos-card p-10 text-center mt-6" style={{ borderRadius: 22 }}>
              <div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-[var(--ink)] text-sm font-semibold">Mapping your practice…</p>
              <p className="text-[var(--muted)] text-[13px] mt-1">{mode === 'treatments' ? 'Deriving your treatments and procedures from your specialty.' : 'Generating the diseases you treat and their treatments, from your specialty.'}</p>
            </div>
          ) : (
            <div className="mt-6">
              <h1 className="text-[var(--ink)]" style={{ fontSize: 'clamp(23px,3vw,32px)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.1, margin: '0 0 8px' }}>How do you want to map your practice?</h1>
              <p className="text-[var(--muted)] mb-5" style={{ fontSize: 15.5, lineHeight: 1.6, maxWidth: 640 }}>
                Our recommendation: if you&apos;re a <strong style={{ color: 'var(--ink)' }}>surgical</strong> specialist, choose <em>Diseases &amp; treatments</em>. If you&apos;re a <strong style={{ color: 'var(--ink)' }}>non-surgical</strong> specialist, go straight to <em>Treatments</em>.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={() => doGenerate('diseases')} className="pos-card p-5 text-left hover:shadow-md transition-shadow" style={{ borderColor: 'var(--rule)' }}>
                  <span className="pos-label" style={{ color: 'var(--green)' }}>Recommended for surgical</span>
                  <p className="text-[17px] font-bold text-[var(--ink)] mt-1.5" style={{ letterSpacing: '-.02em' }}>Diseases &amp; treatments</p>
                  <p className="text-[13.5px] text-[var(--muted)] mt-1" style={{ lineHeight: 1.5 }}>10 conditions you treat, each with its own 1–3 treatments (up to 20 total). Best when your work is organised by disease.</p>
                </button>
                <button onClick={() => doGenerate('treatments')} className="pos-card p-5 text-left hover:shadow-md transition-shadow" style={{ borderColor: 'var(--rule)' }}>
                  <span className="pos-label" style={{ color: 'var(--green)' }}>Recommended for non-surgical</span>
                  <p className="text-[17px] font-bold text-[var(--ink)] mt-1.5" style={{ letterSpacing: '-.02em' }}>Treatments only</p>
                  <p className="text-[13.5px] text-[var(--muted)] mt-1" style={{ lineHeight: 1.5 }}>Up to 20 treatments &amp; procedures derived from your specialty — no disease grouping. Best for consult/therapy-led practices.</p>
                </button>
              </div>
              {genErr && <p className="text-[13px] mt-4" style={{ color: '#b42318' }}>{genErr}</p>}
            </div>
          )
        ) : isTreatmentMode ? (
          <TreatmentsReview clusters={clusters} setClusters={setClusters} router={router} save={save} genErr={genErr} setGenErr={setGenErr} mono={mono} />
        ) : cur ? (
          <>
            {/* ---- DISEASE REVIEW ---- */}
            <div className="pos-card" style={{ borderRadius: 24, boxShadow: '0 22px 56px rgba(9,107,23,.06)', overflow: 'hidden' }}>
              <div style={{ padding: 'clamp(20px,2.6vw,32px) clamp(18px,2.6vw,34px) 0' }}>
                <div className="flex flex-wrap items-center gap-2.5 mb-3">
                  <span style={{ ...mono, fontSize: 11.5, letterSpacing: '.18em', color: 'var(--orange)', fontWeight: 600 }}>DISEASE {idx + 1} OF {total}</span>
                  <span style={{ ...mono, fontSize: 10, letterSpacing: '.1em', background: LEAF_SOFT, border: '1px solid var(--green)', color: 'var(--green)', padding: '4px 8px', borderRadius: 6 }}>AI GENERATED · EDITABLE</span>
                </div>
                <h1 className="text-[var(--ink)]" style={{ fontSize: 'clamp(23px,3vw,34px)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.05, margin: '0 0 10px' }}>Review this disease and its treatments.</h1>
                <p className="text-[var(--muted)]" style={{ fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 620 }}>CuraGo drafted this from your practice map. Change anything that doesn&apos;t sound like your practice, then approve it — approved items become pages, posts and GBP services.</p>
              </div>

              <div style={{ padding: 'clamp(18px,2.4vw,28px) clamp(18px,2.6vw,34px) clamp(20px,2.6vw,32px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
                <label className="block">
                  <span className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                    <span style={{ ...mono, fontSize: 10.5, letterSpacing: '.14em', color: 'var(--muted)' }}>DISEASE {String(idx + 1).padStart(2, '0')}</span>
                    {cur.tier === 'authority'
                      ? <span style={{ ...mono, fontSize: 9.5, letterSpacing: '.1em', color: 'var(--orange)', background: 'var(--orange-soft, rgba(242,106,27,.08))', border: '1px solid var(--orange)', padding: '3px 7px', borderRadius: 5 }}>HIGH-AUTHORITY</span>
                      : <span style={{ ...mono, fontSize: 9.5, letterSpacing: '.1em', color: 'var(--green)', background: LEAF_SOFT, border: '1px solid var(--green)', padding: '3px 7px', borderRadius: 5 }}>HIGH-DEMAND</span>}
                  </span>
                  <input type="text" value={cur.name} onChange={(e) => setName(e.target.value)} onBlur={() => save(cur._id, { name: cur.name })}
                    style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--rule)', borderRadius: 14, padding: '16px 17px', fontSize: 19, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--ink)', background: 'var(--paper)', outline: 'none' }} />
                  {cur.reason && <span className="block" style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>Why it&apos;s here: {cur.reason}</span>}
                </label>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2.5 mb-1">
                    <span style={{ ...mono, fontSize: 10.5, letterSpacing: '.14em', color: 'var(--muted)' }}>TREATMENTS FOR THIS DISEASE <span style={{ letterSpacing: 0, textTransform: 'none' }}>(Do not use abbreviations. Use standard terminologies.)</span></span>
                    <span style={{ ...mono, fontSize: 10.5, color: ((cur.treatments?.length || 0) >= PER_DISEASE_MAX || treatTotal >= TOTAL_TREATMENT_CAP) ? 'var(--orange)' : 'var(--muted)' }}>{cur.treatments?.length || 0} / {PER_DISEASE_MAX} · {treatTotal} / {TOTAL_TREATMENT_CAP} TOTAL</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {(cur.treatments || []).map((t, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <span style={{ flex: '0 0 40px', height: 40, borderRadius: 11, background: LEAF_SOFT, border: '1px solid var(--green)', color: 'var(--green)', display: 'grid', placeItems: 'center', ...mono, fontSize: 12.5, fontWeight: 700 }}>{String(serialOffset + i + 1).padStart(2, '0')}</span>
                        <input type="text" value={t.name} onChange={(e) => setTreatment(i, e.target.value)} onBlur={() => save(cur._id, { treatments: cur.treatments })}
                          style={{ flex: '1 1 auto', minWidth: 0, boxSizing: 'border-box', border: '1px solid var(--rule)', borderRadius: 12, padding: '13px 15px', fontSize: 15.5, color: 'var(--ink)', background: 'var(--paper)', outline: 'none' }} />
                        <button onClick={() => removeTreatment(i)} disabled={(cur.treatments?.length || 0) <= PER_DISEASE_MIN} aria-label="Remove treatment" style={{ flex: '0 0 auto', background: '#fff', border: '1px solid var(--rule)', color: 'var(--muted)', ...mono, fontSize: 15, lineHeight: 1, width: 40, height: 40, borderRadius: 11, cursor: (cur.treatments?.length || 0) <= PER_DISEASE_MIN ? 'not-allowed' : 'pointer', opacity: (cur.treatments?.length || 0) <= PER_DISEASE_MIN ? 0.4 : 1 }}>×</button>
                      </div>
                    ))}
                    {(cur.treatments?.length || 0) < PER_DISEASE_MAX && treatTotal < TOTAL_TREATMENT_CAP && (
                      <div className="flex items-stretch gap-2">
                        <input value={newTreat} onChange={(e) => setNewTreat(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addTreatment(); }} placeholder="Add a treatment…"
                          style={{ flex: '1 1 auto', minWidth: 0, border: '1px solid var(--rule)', borderRadius: 12, padding: '11px 15px', fontSize: 14, background: '#fff', outline: 'none' }} />
                        <button onClick={addTreatment} style={{ alignSelf: 'center', background: '#fff', border: '1px dashed var(--rule)', color: 'var(--ink)', fontSize: 13.5, fontWeight: 600, padding: '11px 16px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add treatment</button>
                      </div>
                    )}
                  </div>
                  {treatTotal >= TOTAL_TREATMENT_CAP
                    ? <div style={{ fontSize: 12.5, color: 'var(--orange)', marginTop: 9 }}>You&apos;ve reached {TOTAL_TREATMENT_CAP} treatments across all diseases — remove one to add another.</div>
                    : (cur.treatments?.length || 0) >= PER_DISEASE_MAX && <div style={{ fontSize: 12.5, color: 'var(--orange)', marginTop: 9 }}>Up to {PER_DISEASE_MAX} treatments per disease — remove one before adding another.</div>}
                  {genErr && <div style={{ fontSize: 12.5, color: '#b42318', marginTop: 9 }}>{genErr}</div>}
                </div>

                <div className="flex flex-wrap gap-2.5 items-center">
                  <button onClick={approveAndContinue} style={{ background: 'var(--orange)', color: '#fff', border: 0, fontWeight: 700, fontSize: 16, padding: '16px 30px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {idx === total - 1 ? 'Approve & let’s begin →' : 'Approve and continue →'}
                  </button>
                  <button onClick={regenerate} disabled={busy === 'regen'} style={{ background: '#fff', color: 'var(--muted)', border: '1px solid var(--rule)', fontWeight: 600, fontSize: 15, padding: '15px 22px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {busy === 'regen' ? 'Regenerating…' : 'Regenerate with AI'}
                  </button>
                  {idx > 0 && <button onClick={() => { setIdx(idx - 1); window.scrollTo(0, 0); }} style={{ marginLeft: 'auto', background: 'transparent', border: 0, color: 'var(--muted)', fontSize: 13.5, cursor: 'pointer', padding: '8px 2px' }}>← Previous disease</button>}
                </div>
              </div>
            </div>

            {/* APPROVED SO FAR */}
            <div className="pos-card mt-4" style={{ borderRadius: 22, padding: '18px 20px' }}>
              <div style={{ ...mono, fontSize: 10.5, letterSpacing: '.14em', color: 'var(--muted)', marginBottom: 11 }}>APPROVED SO FAR</div>
              <div className="flex flex-wrap gap-1.5">
                {approvedClusters.map((c, i) => {
                  const target = (clusters || []).findIndex((x) => x._id === c._id);
                  return (
                    <button
                      key={c._id}
                      onClick={() => { if (target >= 0) { setIdx(target); window.scrollTo(0, 0); } }}
                      title="Review this disease again"
                      className="inline-flex items-center gap-1.5 hover:shadow-sm transition-shadow"
                      style={{ background: LEAF_SOFT, border: '1px solid var(--green)', color: 'var(--green)', padding: '7px 11px', borderRadius: 9, fontSize: 13, whiteSpace: 'nowrap', cursor: 'pointer' }}>
                      {String(i + 1).padStart(2, '0')} · {c.name} ✓
                    </button>
                  );
                })}
                {approvedCount === 0 && <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>Nothing approved yet — start with disease 1.</span>}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

// Non-surgical path — review a flat list of treatments/procedures (each entry is a
// treatment-kind cluster), then approve them all at once.
function TreatmentsReview({ clusters, setClusters, router, save, genErr, setGenErr, mono }) {
  const [newTreat, setNewTreat] = useState('');
  const [busy, setBusy] = useState('');
  const patchLocal = (id, body) => setClusters((arr) => arr.map((c) => c._id === id ? { ...c, ...body } : c));

  const setName = (id, v) => patchLocal(id, { name: v });
  const saveName = (c) => { const nm = (c.name || '').trim(); if (nm) save(c._id, { name: nm, treatments: [{ name: nm, source: 'manual' }] }); };
  const addTreatment = async () => {
    const name = newTreat.trim();
    if (!name || (clusters || []).length >= TOTAL_TREATMENT_CAP) return;
    if ((clusters || []).some((c) => c.name.toLowerCase() === name.toLowerCase())) { setNewTreat(''); return; }
    setBusy('add');
    try {
      const d = await fetch('/api/practice-os/clusters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ name, kind: 'treatment' }) }).then((r) => r.json());
      if (d.success && d.cluster) setClusters((arr) => [...arr, d.cluster]);
      setNewTreat('');
    } catch { /* ignore */ } finally { setBusy(''); }
  };
  const removeTreatment = async (id) => {
    if ((clusters || []).length <= 1) return; // keep at least one
    setClusters((arr) => arr.filter((c) => c._id !== id));
    try { await fetch(`/api/practice-os/clusters/${id}`, { method: 'DELETE', credentials: 'include' }); } catch { /* ignore */ }
  };
  const approveAll = async () => {
    const items = (clusters || []).filter((c) => (c.name || '').trim());
    if (!items.length) { setGenErr('Add at least one treatment before approving.'); return; }
    setGenErr(''); setBusy('approve');
    try {
      for (const c of items) {
        const nm = c.name.trim();
        await save(c._id, { name: nm, treatments: [{ name: nm, source: 'manual' }], approved: true });
      }
      router.push('/app/control-center');
    } catch { setGenErr('Could not save. Try again.'); setBusy(''); }
  };

  return (
    <div className="pos-card mt-6" style={{ borderRadius: 24, overflow: 'hidden', boxShadow: '0 22px 56px rgba(9,107,23,.06)' }}>
      <div style={{ padding: 'clamp(20px,2.6vw,32px) clamp(18px,2.6vw,34px) clamp(20px,2.6vw,28px)' }}>
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <span style={{ ...mono, fontSize: 11.5, letterSpacing: '.18em', color: 'var(--orange)', fontWeight: 600 }}>YOUR TREATMENTS · {(clusters || []).length} / {TOTAL_TREATMENT_CAP}</span>
          <span style={{ ...mono, fontSize: 10, letterSpacing: '.1em', background: LEAF_SOFT, border: '1px solid var(--green)', color: 'var(--green)', padding: '4px 8px', borderRadius: 6 }}>AI GENERATED · EDITABLE</span>
        </div>
        <h1 className="text-[var(--ink)]" style={{ fontSize: 'clamp(23px,3vw,34px)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.05, margin: '0 0 10px' }}>Review your treatments &amp; procedures.</h1>
        <p className="text-[var(--muted)]" style={{ fontSize: 15.5, lineHeight: 1.6, margin: '0 0 18px', maxWidth: 620 }}>Derived from your specialty. Edit or remove anything that isn&apos;t yours, add any we missed (up to {TOTAL_TREATMENT_CAP}), then approve — approved items become pages, posts and GBP services. (Do not use abbreviations. Use standard terminologies.)</p>

        <div className="flex flex-col gap-2.5">
          {(clusters || []).map((c, i) => (
            <div key={c._id} className="flex items-center gap-2.5">
              <span style={{ flex: '0 0 40px', height: 40, borderRadius: 11, background: LEAF_SOFT, border: '1px solid var(--green)', color: 'var(--green)', display: 'grid', placeItems: 'center', ...mono, fontSize: 12.5, fontWeight: 700 }}>{String(i + 1).padStart(2, '0')}</span>
              <input type="text" value={c.name} onChange={(e) => setName(c._id, e.target.value)} onBlur={() => saveName(c)}
                style={{ flex: '1 1 auto', minWidth: 0, boxSizing: 'border-box', border: '1px solid var(--rule)', borderRadius: 12, padding: '13px 15px', fontSize: 15.5, color: 'var(--ink)', background: 'var(--paper)', outline: 'none' }} />
              <button onClick={() => removeTreatment(c._id)} disabled={(clusters || []).length <= 1} aria-label="Remove treatment" style={{ flex: '0 0 auto', background: '#fff', border: '1px solid var(--rule)', color: 'var(--muted)', ...mono, fontSize: 15, lineHeight: 1, width: 40, height: 40, borderRadius: 11, cursor: (clusters || []).length <= 1 ? 'not-allowed' : 'pointer', opacity: (clusters || []).length <= 1 ? 0.4 : 1 }}>×</button>
            </div>
          ))}
          {(clusters || []).length < TOTAL_TREATMENT_CAP && (
            <div className="flex items-stretch gap-2">
              <input value={newTreat} onChange={(e) => setNewTreat(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addTreatment(); }} placeholder="Add a treatment or procedure…"
                style={{ flex: '1 1 auto', minWidth: 0, border: '1px solid var(--rule)', borderRadius: 12, padding: '11px 15px', fontSize: 14, background: '#fff', outline: 'none' }} />
              <button onClick={addTreatment} disabled={busy === 'add'} style={{ alignSelf: 'center', background: '#fff', border: '1px dashed var(--rule)', color: 'var(--ink)', fontSize: 13.5, fontWeight: 600, padding: '11px 16px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap' }}>{busy === 'add' ? 'Adding…' : '+ Add'}</button>
            </div>
          )}
          {(clusters || []).length >= TOTAL_TREATMENT_CAP && <div style={{ fontSize: 12.5, color: 'var(--orange)', marginTop: 4 }}>Up to {TOTAL_TREATMENT_CAP} treatments — remove one to add another.</div>}
        </div>

        {genErr && <div style={{ fontSize: 12.5, color: '#b42318', marginTop: 12 }}>{genErr}</div>}
        <div className="flex flex-wrap gap-2.5 items-center mt-5">
          <button onClick={approveAll} disabled={busy === 'approve'} style={{ background: 'var(--orange)', color: '#fff', border: 0, fontWeight: 700, fontSize: 16, padding: '16px 30px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap', opacity: busy === 'approve' ? 0.7 : 1 }}>
            {busy === 'approve' ? 'Saving…' : 'Approve all & let’s begin →'}
          </button>
        </div>
      </div>
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
