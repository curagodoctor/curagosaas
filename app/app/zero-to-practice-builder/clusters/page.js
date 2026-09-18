'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PosNav from '@/components/practice-os/PosNav';

// Disease-cluster review (matches the Dominate onboarding prototype). Two stages:
//  1. disease  — review each AI-drafted disease + its 1-2 treatments, one at a
//                time; edit, add/remove treatments, approve. Treatment numbering
//                is CONTINUOUS across diseases (01, 02, 03…).
//  2. gbp      — post the approved treatments as GBP services.
const TREAT_CAP = 20;
const FOREST = '#0a3d16';
const LEAF_SOFT = 'var(--green-soft, rgba(9,107,23,.09))';

function ClustersInner() {
  const router = useRouter();
  const [clusters, setClusters] = useState(null);
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState('disease'); // 'disease' | 'gbp'
  const [generating, setGenerating] = useState(false);
  const [genErr, setGenErr] = useState('');
  const [busy, setBusy] = useState('');
  const [newTreat, setNewTreat] = useState('');
  const [copied, setCopied] = useState(false);
  const triedGen = useRef(false);

  const doGenerate = useCallback(async () => {
    setGenerating(true); setGenErr('');
    try {
      const d = await fetch('/api/practice-os/clusters/generate', { method: 'POST', credentials: 'include' }).then((r) => r.json());
      if (d.success) { setClusters(d.clusters || []); setIdx(0); setStage('disease'); }
      else if (d.error === 'PaymentRequired') setGenErr('This is part of the optimization program — request access first.');
      else if (d.error === 'NoCredits') setGenErr(d.message || "You've used today's AI credits.");
      else setGenErr(d.error || 'Could not generate your diseases.');
    } catch { setGenErr('Something went wrong.'); } finally { setGenerating(false); }
  }, []);

  const load = useCallback(async () => {
    try {
      const d = await fetch('/api/practice-os/clusters', { credentials: 'include' }).then((r) => r.json());
      const cl = d.success ? (d.clusters || []) : [];
      setClusters(cl);
      if (cl.length === 0 && !triedGen.current) { triedGen.current = true; doGenerate(); }
    } catch { setClusters([]); }
  }, [doGenerate]);
  useEffect(() => { load(); }, [load]);

  const cur = clusters?.[idx];
  const total = clusters?.length || 0;
  const treatTotal = (clusters || []).reduce((n, c) => n + (c.treatments?.length || 0), 0);
  const serialOffset = (clusters || []).slice(0, idx).reduce((n, c) => n + (c.treatments?.length || 0), 0);
  const approvedClusters = (clusters || []).filter((c) => c.approved);
  const approvedCount = approvedClusters.length;
  const serviceLines = approvedClusters.flatMap((c) => (c.treatments || []).map((t) => `${t.name} — ${c.name}`));

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
    const name = newTreat.trim() || 'New treatment';
    const treatments = [...(cur.treatments || []), { name, source: 'manual' }];
    save(cur._id, { treatments }); setNewTreat('');
  };
  const removeTreatment = (i) => { const treatments = cur.treatments.filter((_, j) => j !== i); save(cur._id, { treatments }); };

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
    await save(cur._id, { name: cur.name, treatments: cur.treatments, approved: true });
    if (idx >= total - 1) { setStage('gbp'); window.scrollTo(0, 0); }
    else { setIdx(idx + 1); window.scrollTo(0, 0); }
  };

  const copyServices = () => {
    const text = serviceLines.map((l, i) => `${String(i + 1).padStart(2, '0')}. ${l}`).join('\n');
    try { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  const mono = { fontFamily: 'var(--font-mono, ui-monospace, monospace)' };

  if (clusters === null) return <div className="min-h-screen grid place-items-center" style={{ background: 'var(--paper)' }}><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <div className="w-full px-4 sm:px-8 lg:px-12 pt-[64px] pb-12 max-w-[860px] mx-auto">
        <PosNav breadcrumb={stage === 'gbp' ? 'Google Business Profile' : 'Practice map review'} />

        {/* ---- empty / generating ---- */}
        {clusters.length === 0 ? (
          <div className="pos-card p-10 text-center mt-6" style={{ borderRadius: 22 }}>
            {generating ? (
              <>
                <div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-[var(--ink)] text-sm font-semibold">Mapping your practice…</p>
                <p className="text-[var(--muted)] text-[13px] mt-1">Generating the 10 diseases you treat and their treatments, from your specialty.</p>
              </>
            ) : (
              <>
                <p className="text-[var(--muted)] text-sm">{genErr || 'Let’s map the diseases you treat, generated from your specialty.'}</p>
                <button onClick={doGenerate} className="pos-action mt-4">Generate my diseases</button>
              </>
            )}
          </div>
        ) : stage === 'disease' && cur ? (
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
                  <span className="block" style={{ ...mono, fontSize: 10.5, letterSpacing: '.14em', color: 'var(--muted)', marginBottom: 8 }}>DISEASE {String(idx + 1).padStart(2, '0')}</span>
                  <input type="text" value={cur.name} onChange={(e) => setName(e.target.value)} onBlur={() => save(cur._id, { name: cur.name })}
                    style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--rule)', borderRadius: 14, padding: '16px 17px', fontSize: 19, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--ink)', background: 'var(--paper)', outline: 'none' }} />
                </label>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
                    <span style={{ ...mono, fontSize: 10.5, letterSpacing: '.14em', color: 'var(--muted)' }}>TREATMENTS FOR THIS DISEASE</span>
                    <span style={{ ...mono, fontSize: 10.5, color: treatTotal >= TREAT_CAP ? 'var(--orange)' : 'var(--muted)' }}>{treatTotal} / {TREAT_CAP} TREATMENTS</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {(cur.treatments || []).map((t, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <span style={{ flex: '0 0 40px', height: 40, borderRadius: 11, background: LEAF_SOFT, border: '1px solid var(--green)', color: 'var(--green)', display: 'grid', placeItems: 'center', ...mono, fontSize: 12.5, fontWeight: 700 }}>{String(serialOffset + i + 1).padStart(2, '0')}</span>
                        <input type="text" value={t.name} onChange={(e) => setTreatment(i, e.target.value)} onBlur={() => save(cur._id, { treatments: cur.treatments })}
                          style={{ flex: '1 1 auto', minWidth: 0, boxSizing: 'border-box', border: '1px solid var(--rule)', borderRadius: 12, padding: '13px 15px', fontSize: 15.5, color: 'var(--ink)', background: 'var(--paper)', outline: 'none' }} />
                        <button onClick={() => removeTreatment(i)} aria-label="Remove treatment" style={{ flex: '0 0 auto', background: '#fff', border: '1px solid var(--rule)', color: 'var(--muted)', ...mono, fontSize: 15, lineHeight: 1, width: 40, height: 40, borderRadius: 11, cursor: 'pointer' }}>×</button>
                      </div>
                    ))}
                    <div className="flex items-stretch gap-2">
                      <input value={newTreat} onChange={(e) => setNewTreat(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addTreatment(); }} placeholder="Add a treatment…"
                        style={{ flex: '1 1 auto', minWidth: 0, border: '1px solid var(--rule)', borderRadius: 12, padding: '11px 15px', fontSize: 14, background: '#fff', outline: 'none' }} />
                      <button onClick={addTreatment} style={{ alignSelf: 'center', background: '#fff', border: '1px dashed var(--rule)', color: 'var(--ink)', fontSize: 13.5, fontWeight: 600, padding: '11px 16px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add treatment</button>
                    </div>
                  </div>
                  {treatTotal >= TREAT_CAP && <div style={{ fontSize: 12.5, color: 'var(--orange)', marginTop: 9 }}>You have reached {TREAT_CAP} treatments — remove one before adding another.</div>}
                  {genErr && <div style={{ fontSize: 12.5, color: '#b42318', marginTop: 9 }}>{genErr}</div>}
                </div>

                <div className="flex flex-wrap gap-2.5 items-center">
                  <button onClick={approveAndContinue} style={{ background: 'var(--orange)', color: '#fff', border: 0, fontWeight: 700, fontSize: 16, padding: '16px 30px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {idx === total - 1 ? 'Approve and finish' : 'Approve and continue →'}
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
                {approvedClusters.map((c, i) => (
                  <span key={c._id} className="inline-flex items-center gap-1.5" style={{ background: LEAF_SOFT, border: '1px solid var(--green)', color: 'var(--green)', padding: '7px 11px', borderRadius: 9, fontSize: 13, whiteSpace: 'nowrap' }}>
                    {String(i + 1).padStart(2, '0')} · {c.name} ✓
                  </span>
                ))}
                {approvedCount === 0 && <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>Nothing approved yet — start with disease 1.</span>}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ---- GBP: POST AS SERVICES ---- */}
            <div style={{ background: FOREST, color: '#fff', borderRadius: 30, padding: 'clamp(22px,3vw,38px)' }} className="mt-2">
              <div style={{ ...mono, fontSize: 11, letterSpacing: '.18em', color: 'rgba(255,255,255,.75)', fontWeight: 600, marginBottom: 12 }}>NEXT ACTION · GOOGLE BUSINESS PROFILE</div>
              <h1 style={{ fontSize: 'clamp(24px,3.2vw,38px)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.05, margin: '0 0 12px' }}>Your Google Business Profile needs an update.</h1>
              <p style={{ fontSize: 16.5, color: 'rgba(255,255,255,.82)', lineHeight: 1.6, margin: 0, maxWidth: 640 }}>You approved {approvedCount} disease{approvedCount === 1 ? '' : 's'} and {serviceLines.length} treatment{serviceLines.length === 1 ? '' : 's'}. Post them as services on your profile so the local clinic matches the global one.</p>
            </div>

            <div className="pos-card mt-4" style={{ borderRadius: 30, boxShadow: '0 22px 56px rgba(10,77,24,.07)', padding: 'clamp(20px,2.6vw,32px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <span style={{ ...mono, fontSize: 10.5, letterSpacing: '.14em', color: 'var(--muted)' }}>SERVICES TO POST</span>
                <span style={{ ...mono, fontSize: 10.5, color: 'var(--muted)' }}>{serviceLines.length} ITEMS</span>
              </div>
              <div style={{ border: '1px solid var(--rule)', borderRadius: 16, background: 'var(--paper)', padding: 18, maxHeight: 340, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {serviceLines.map((l, i) => (
                  <div key={i} className="flex gap-2.5 items-baseline">
                    <span style={{ flex: '0 0 28px', ...mono, fontSize: 11.5, color: 'var(--muted)' }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ fontSize: 14.5, color: 'var(--ink)', lineHeight: 1.5 }}>{l}</span>
                  </div>
                ))}
                {serviceLines.length === 0 && <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>No approved treatments yet.</span>}
              </div>

              <div className="flex flex-wrap gap-2.5 items-center">
                <button onClick={copyServices} style={{ background: FOREST, color: '#fff', border: 0, fontWeight: 700, fontSize: 15.5, padding: '15px 26px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap' }}>{copied ? 'Copied ✓' : 'Copy all services'}</button>
                <a href="https://business.google.com/" target="_blank" rel="noreferrer" style={{ background: 'var(--orange)', color: '#fff', fontWeight: 700, fontSize: 15.5, padding: '15px 26px', borderRadius: 999, textDecoration: 'none', whiteSpace: 'nowrap' }}>Open Google Business Profile →</a>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--rule)', paddingTop: 16 }}>
                <div style={{ ...mono, fontSize: 10.5, letterSpacing: '.14em', color: 'var(--muted)' }}>HOW TO POST</div>
                {[
                  ['01', 'Open your Google Business Profile and go to Edit profile → Services.'],
                  ['02', 'Paste one service per line — keep the disease name in the description so the service matches what patients search.'],
                  ['03', 'Link each service back to the matching page on your website.'],
                  ['04', 'Save. Google usually reflects new services within a day or two.'],
                ].map(([n, t]) => (
                  <div key={n} className="flex gap-2.5 items-start">
                    <span style={{ flex: '0 0 auto', ...mono, fontSize: 11.5, color: 'var(--green)', fontWeight: 700, marginTop: 2 }}>{n}</span>
                    <span style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.55 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 items-center mt-4">
              <button onClick={() => { setStage('disease'); setIdx(0); window.scrollTo(0, 0); }} style={{ background: '#fff', color: 'var(--muted)', border: '1px solid var(--rule)', fontWeight: 600, fontSize: 15, padding: '15px 22px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap' }}>← Back to disease review</button>
              <button onClick={() => router.push('/app/zero-to-practice-builder')} className="pos-action">Continue to my content →</button>
            </div>
          </>
        )}
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
