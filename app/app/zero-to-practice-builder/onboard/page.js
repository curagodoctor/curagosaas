'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { SECTIONS, Field } from '../_profile-fields';

// The linear onboarding wizard (entry flow §2). One guided flow, one step at a
// time, with a phase rail: PROFILE → WEBSITE → GOOGLE → ACCESS. POS design.
// This commit implements the PROFILE phase; later phases follow.
const PHASES = ['Profile', 'Website', 'Google', 'Access'];

const PRO = SECTIONS.find((s) => s.id === 'pro') || { fields: [] };
const PRACTICE = SECTIONS.find((s) => s.id === 'practice') || { fields: [] };
const IDENTITY_KEYS = ['doctor_name', 'designation', 'specialty', 'subspecialty', 'qualifications', 'additional_qualifications', 'years_experience', 'languages', 'gender'];
const GENERATED_KEYS = ['expertise', 'diseases', 'procedures', 'usp', 'interests'];
const OPTIONAL_KEYS = ['awards', 'publications', 'registration'];
const fieldsBy = (section, keys) => keys.map((k) => section.fields.find((f) => f.key === k)).filter(Boolean);

// Wizard steps (PROFILE + WEBSITE phases so far).
const STEPS = [
  { id: 'branch', phase: 0 },
  { id: 'profile', phase: 0 },
  { id: 'photos', phase: 0 },
  { id: 'subdomain', phase: 0 },
  { id: 'clinical', phase: 0 },
  { id: 'summary', phase: 0 },
  { id: 'generate', phase: 1 },
  { id: 'live', phase: 1 },
];

function Wizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState({});
  const [summary, setSummary] = useState('');
  const [loaded, setLoaded] = useState(false);

  // branch
  const [hasWebsite, setHasWebsite] = useState(null); // 'no' | 'yes'
  const [existing, setExisting] = useState('');
  // profile AI
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  // photos
  const [profilePhoto, setProfilePhoto] = useState('');
  const [clinicPhotos, setClinicPhotos] = useState([]);
  // subdomain
  const [subdomain, setSubdomain] = useState('');
  const [subStatus, setSubStatus] = useState(null);
  const [subMsg, setSubMsg] = useState('');
  // website generation
  const [genState, setGenState] = useState('idle'); // idle | running | done | error
  const [genMsg, setGenMsg] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [creditsLeft, setCreditsLeft] = useState(null);

  const st = STEPS[step];

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/practice-os/profile', { credentials: 'include' });
        if (r.status === 401) { router.push('/login?entry=practice-os'); return; }
        const d = await r.json();
        if (d.success) { setFields(d.fields || {}); setSummary(d.summary || ''); }
      } catch { /* ignore */ }
      setLoaded(true);
    })();
  }, [router]);

  const setField = (k, v) => setFields((f) => ({ ...f, [k]: v }));
  const toggleTag = (k, opt) => setFields((f) => {
    const cur = (f[k] || '').split(',').map((x) => x.trim()).filter(Boolean);
    const next = cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt];
    return { ...f, [k]: next.join(', ') };
  });

  const go = (i) => { setStep(i); setErr(''); window.scrollTo(0, 0); };
  const next = () => go(Math.min(step + 1, STEPS.length - 1));

  // ---- profile AI draft + save ----
  const draft = async () => {
    setBusy('draft'); setErr('');
    try {
      const res = await fetch('/api/practice-os/profile/draft-section', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ sectionId: 'pro', hint }),
      });
      const d = await res.json();
      if (d.success) setFields((f) => ({ ...f, ...d.values }));
      else setErr(d.error === 'PaymentRequired' ? 'This needs AI access.' : (d.error || 'Could not draft.'));
    } catch { setErr('Something went wrong.'); }
    finally { setBusy(''); }
  };

  const saveProfile = async (thenSummary = false) => {
    setBusy('save'); setErr('');
    try {
      const res = await fetch('/api/practice-os/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ fields }),
      });
      const d = await res.json();
      if (!d.success) { setErr('Could not save. Please try again.'); return false; }
      if (thenSummary) {
        const r2 = await fetch('/api/practice-os/profile', { credentials: 'include' });
        const d2 = await r2.json();
        if (d2.success) setSummary(d2.summary || '');
      }
      return true;
    } catch { setErr('Something went wrong.'); return false; }
    finally { setBusy(''); }
  };

  // ---- photos ----
  const uploadPhoto = async (file, folder) => {
    const fd = new FormData();
    fd.append('file', file); fd.append('folder', folder);
    const res = await fetch('/api/admin/upload-image', { method: 'POST', credentials: 'include', body: fd });
    const d = await res.json();
    if (!d.success) throw new Error(d.error || 'Upload failed');
    return d.url;
  };
  const onProfilePhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy('photo'); setErr('');
    try { setProfilePhoto(await uploadPhoto(file, 'profile')); } catch (x) { setErr(x.message); } finally { setBusy(''); }
  };
  const onClinicPhoto = async (e, i) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(`clinic${i}`); setErr('');
    try { const url = await uploadPhoto(file, 'clinic'); setClinicPhotos((p) => { const n = [...p]; n[i] = url; return n; }); }
    catch (x) { setErr(x.message); } finally { setBusy(''); }
  };
  const savePhotos = async () => {
    setBusy('savephotos');
    try {
      await fetch('/api/practice-os/onboarding-media', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ profileImage: profilePhoto, clinicPhotos: clinicPhotos.filter(Boolean) }),
      });
      // also mirror profile photo into doctor profile
      if (profilePhoto) await fetch('/api/doctor/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ profileImage: profilePhoto }) });
    } catch { /* non-blocking */ } finally { setBusy(''); }
  };

  // ---- subdomain ----
  const checkSub = useCallback(async (v) => {
    if (!v || v.length < 3) { setSubStatus(null); setSubMsg(''); return; }
    setSubStatus('checking'); setSubMsg('Checking…');
    try {
      const r = await fetch(`/api/auth/check-subdomain?subdomain=${encodeURIComponent(v)}`);
      const d = await r.json();
      if (d.available) { setSubStatus('ok'); setSubMsg(`${v}.curago.in is available`); }
      else { setSubStatus('taken'); setSubMsg(d.reason || 'Not available'); }
    } catch { setSubStatus('bad'); setSubMsg('Could not check'); }
  }, []);
  useEffect(() => { const t = setTimeout(() => { if (subdomain) checkSub(subdomain); }, 400); return () => clearTimeout(t); }, [subdomain, checkSub]);
  const claimSub = async () => {
    if (subStatus !== 'ok') { setErr('Choose an available address first.'); return; }
    setBusy('sub'); setErr('');
    try {
      const res = await fetch('/api/doctor/subdomain', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ subdomain, hadWebsite: hasWebsite === 'yes', existingWebsiteUrl: existing }),
      });
      const d = await res.json();
      if (!res.ok || (!d.success && !d.alreadySet)) { setErr(d.error || 'Could not set address.'); return; }
      next();
    } catch { setErr('Something went wrong.'); }
    finally { setBusy(''); }
  };

  // ---- website auto-build (§6/§7): homepage live + first blog, no redirect ----
  const runGenerate = useCallback(async () => {
    setGenState('running'); setErr(''); setGenMsg('Writing your homepage from your profile…');
    const J = { headers: { 'Content-Type': 'application/json' }, credentials: 'include' };
    try {
      const g = await fetch('/api/practice-os/actions/generate-site', { method: 'POST', ...J, body: JSON.stringify({ force: true }) }).then((r) => r.json());
      if (!g.success) throw new Error(g.message || g.error || 'Could not build your website.');
      if (g.url) setSiteUrl(g.url);
      // The subdomain seeds a bare default page, so generation returns a draft —
      // approve it so the AI homepage goes LIVE (no redirection).
      if (g.mode === 'draft') { setGenMsg('Publishing your homepage…'); await fetch('/api/practice-os/actions/site-draft', { method: 'POST', ...J, body: JSON.stringify({ action: 'approve' }) }); }
      // First educational blog, auto-drafted from the doctor's top condition.
      setGenMsg('Preparing your first article…');
      const topic = (fields.diseases || '').split(',')[0]?.trim() || (fields.expertise || '').split(',')[0]?.trim() || `${fields.specialty || 'my practice'}`;
      const b = await fetch('/api/practice-os/actions/draft-blog', { method: 'POST', ...J, body: JSON.stringify({ context: `An introductory patient-education article about ${topic}.`, pageType: 'disease' }) }).then((r) => r.json());
      if (typeof b.creditsRemaining === 'number') setCreditsLeft(b.creditsRemaining);
      setGenState('done'); next();
    } catch (x) { setGenState('error'); setErr(x.message || 'Something went wrong.'); }
  }, [fields]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (st.id === 'generate' && genState === 'idle') runGenerate(); }, [st.id, genState, runGenerate]);

  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  if (!loaded) return <div className="min-h-screen grid place-items-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      {/* Phase rail + progress */}
      <div className="sticky top-0 z-10" style={{ background: 'var(--paper)', borderBottom: '1px solid var(--rule)' }}>
        <div className="max-w-2xl mx-auto px-5 py-3">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {PHASES.map((p, i) => (
              <span key={p} className="pos-label px-2 py-1 rounded-md"
                style={{ background: i === st.phase ? 'var(--green)' : i < st.phase ? 'var(--green-soft)' : 'transparent', color: i === st.phase ? '#fff' : i < st.phase ? 'var(--green)' : 'var(--muted)', border: `1px solid ${i <= st.phase ? 'var(--green)' : 'var(--rule)'}` }}>
                {p}
              </span>
            ))}
          </div>
          <div className="pos-meter"><span style={{ width: `${pct}%` }} /></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-7">
        {/* STEP: branch */}
        {st.id === 'branch' && (
          <div>
            <p className="pos-label" style={{ color: 'var(--green)' }}>Getting started</p>
            <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1 mb-2" style={{ letterSpacing: '-0.02em' }}>Do you already have a website?</h1>
            <div className="grid gap-2.5 mt-4">
              <button onClick={() => setHasWebsite('no')} className="pos-card p-4 text-left" style={{ borderColor: hasWebsite === 'no' ? 'var(--green)' : 'var(--rule)', background: hasWebsite === 'no' ? 'var(--green-soft)' : 'var(--card)' }}>
                <span className="block font-semibold text-[15px] text-[var(--ink)]">No, not yet</span>
                <span className="block text-[13px] text-[var(--muted)] mt-1">Perfect — we&apos;ll build one for you, free. No downside.</span>
              </button>
              <button onClick={() => setHasWebsite('yes')} className="pos-card p-4 text-left" style={{ borderColor: hasWebsite === 'yes' ? 'var(--green)' : 'var(--rule)', background: hasWebsite === 'yes' ? 'var(--green-soft)' : 'var(--card)' }}>
                <span className="block font-semibold text-[15px] text-[var(--ink)]">Yes, I have one</span>
                <span className="block text-[13px] text-[var(--muted)] mt-1">We&apos;ll build your new site here, then help you point your existing domain at it — you keep your domain and its SEO.</span>
              </button>
            </div>
            {hasWebsite === 'yes' && (
              <div className="mt-4">
                <label className="pos-label">Your current website (optional)</label>
                <input value={existing} onChange={(e) => setExisting(e.target.value)} placeholder="drrao.com" className="w-full pos-card p-2.5 text-sm mt-1.5" />
              </div>
            )}
            <button onClick={next} disabled={!hasWebsite} className="pos-action mt-6" style={{ opacity: hasWebsite ? 1 : 0.5 }}>Continue</button>
          </div>
        )}

        {/* STEP: profile */}
        {st.id === 'profile' && (
          <div>
            <p className="pos-label" style={{ color: 'var(--green)' }}>Your profile</p>
            <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1" style={{ letterSpacing: '-0.02em' }}>Tell us about you — we&apos;ll write it up.</h1>
            <p className="text-sm text-[var(--muted)] mt-1.5 mb-4">Your identity details stay exactly as you type them. Your expertise, diseases and procedures are drafted by AI from a line of input — edit anything.</p>

            {/* AI hint → draft */}
            <div className="pos-card p-4 mb-5">
              <label className="pos-label">In your words (e.g. &quot;surgical gastro, 12 yrs, Mumbai&quot;)</label>
              <textarea value={hint} onChange={(e) => setHint(e.target.value)} rows={2} className="w-full pos-card p-2.5 text-sm mt-1.5" placeholder="A line about your specialty and focus" />
              <button onClick={draft} disabled={!!busy} className="pos-action mt-3" style={{ padding: '9px 16px' }}>{busy === 'draft' ? 'Writing…' : '✨ Draft my expertise, diseases & procedures'}</button>
            </div>

            <p className="pos-label mb-2">Identity — taken as you type it</p>
            <div className="space-y-4">{fieldsBy(PRO, IDENTITY_KEYS).map((f) => <Field key={f.key} f={f} value={fields[f.key] || ''} onChange={(v) => setField(f.key, v)} onToggleTag={(o) => toggleTag(f.key, o)} />)}</div>

            <p className="pos-label mt-6 mb-2" style={{ color: 'var(--green)' }}>Generated from your answers — edit freely</p>
            <div className="space-y-4">{fieldsBy(PRO, GENERATED_KEYS).map((f) => <Field key={f.key} f={f} value={fields[f.key] || ''} onChange={(v) => setField(f.key, v)} onToggleTag={(o) => toggleTag(f.key, o)} />)}</div>

            <details className="mt-6">
              <summary className="pos-label cursor-pointer">Optional — awards, publications, registration</summary>
              <div className="space-y-4 mt-3">{fieldsBy(PRO, OPTIONAL_KEYS).map((f) => <Field key={f.key} f={f} value={fields[f.key] || ''} onChange={(v) => setField(f.key, v)} onToggleTag={(o) => toggleTag(f.key, o)} />)}</div>
            </details>

            {err && <p className="text-[13px] text-red-600 mt-3">{err}</p>}
            <button onClick={async () => { if (await saveProfile()) next(); }} disabled={!!busy} className="pos-action mt-6">{busy === 'save' ? 'Saving…' : 'Save & continue'}</button>
          </div>
        )}

        {/* STEP: photos */}
        {st.id === 'photos' && (
          <div>
            <p className="pos-label" style={{ color: 'var(--green)' }}>Photos</p>
            <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1 mb-1.5" style={{ letterSpacing: '-0.02em' }}>Add your photos.</h1>
            <p className="text-sm text-[var(--muted)] mb-4">Three photos for your website, plus your profile photo. You can come back to this anytime.</p>

            <p className="pos-label mb-2">Website photos</p>
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {[0, 1, 2].map((i) => (
                <label key={i} className="pos-card aspect-[4/3] grid place-items-center cursor-pointer overflow-hidden text-center" style={{ borderStyle: clinicPhotos[i] ? 'solid' : 'dashed' }}>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onClinicPhoto(e, i)} />
                  {clinicPhotos[i] ? <img src={clinicPhotos[i]} alt="" className="w-full h-full object-cover" /> : <span className="text-[11px] text-[var(--muted)]">{busy === `clinic${i}` ? 'Uploading…' : `Photo ${i + 1}`}</span>}
                </label>
              ))}
            </div>

            <p className="pos-label mb-2">Profile photo</p>
            <label className="pos-card cursor-pointer overflow-hidden grid place-items-center" style={{ width: 120, height: 120, borderStyle: profilePhoto ? 'solid' : 'dashed' }}>
              <input type="file" accept="image/*" className="hidden" onChange={onProfilePhoto} />
              {profilePhoto ? <img src={profilePhoto} alt="" className="w-full h-full object-cover" /> : <span className="text-[11px] text-[var(--muted)]">{busy === 'photo' ? 'Uploading…' : 'Add photo'}</span>}
            </label>

            {err && <p className="text-[13px] text-red-600 mt-3">{err}</p>}
            <div className="flex items-center gap-3 mt-6">
              <button onClick={async () => { await savePhotos(); next(); }} disabled={!!busy} className="pos-action">Save & continue</button>
              <button onClick={next} className="pos-link" style={{ fontSize: 14 }}>Do this later →</button>
            </div>
          </div>
        )}

        {/* STEP: subdomain */}
        {st.id === 'subdomain' && (
          <div>
            <p className="pos-label" style={{ color: 'var(--green)' }}>Website address</p>
            <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1 mb-1.5" style={{ letterSpacing: '-0.02em' }}>Choose your website address.</h1>
            <p className="text-sm text-[var(--muted)] mb-4">
              {hasWebsite === 'yes'
                ? <>We&apos;ll build your new site here first, then help you point{existing ? <> <b>{existing}</b></> : ' your existing domain'} at it — you keep your domain and its SEO.</>
                : 'You can connect a custom domain later.'}
            </p>
            <div className="flex items-stretch pos-card overflow-hidden p-0">
              <input autoFocus value={subdomain} onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="yourclinic" maxLength={30} className="flex-1 px-3.5 py-3 text-sm outline-none bg-transparent" />
              <span className="flex items-center px-3.5 text-sm text-[var(--muted)]" style={{ background: 'var(--rule-soft)', borderLeft: '1px solid var(--rule)' }}>.curago.in</span>
            </div>
            {subMsg && <p className="text-[13px] mt-2" style={{ color: subStatus === 'ok' ? 'var(--green)' : subStatus === 'taken' || subStatus === 'bad' ? '#B42318' : 'var(--muted)' }}>{subMsg}</p>}
            {err && <p className="text-[13px] text-red-600 mt-2">{err}</p>}
            <button onClick={claimSub} disabled={busy === 'sub' || subStatus !== 'ok'} className="pos-action mt-6" style={{ opacity: subStatus === 'ok' ? 1 : 0.5 }}>{busy === 'sub' ? 'Setting up…' : 'Create my website'}</button>
          </div>
        )}

        {/* STEP: clinical */}
        {st.id === 'clinical' && (
          <div>
            <p className="pos-label" style={{ color: 'var(--green)' }}>Practice details</p>
            <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1 mb-1.5" style={{ letterSpacing: '-0.02em' }}>Where do patients find you?</h1>
            <p className="text-sm text-[var(--muted)] mb-4">Taken as you type it. Anything you skip simply doesn&apos;t appear on your site. Please use clinic (not personal) contact details.</p>
            <div className="space-y-4">{PRACTICE.fields.map((f) => <Field key={f.key} f={f} value={fields[f.key] || ''} onChange={(v) => setField(f.key, v)} onToggleTag={(o) => toggleTag(f.key, o)} />)}</div>
            {err && <p className="text-[13px] text-red-600 mt-3">{err}</p>}
            <div className="flex items-center gap-3 mt-6">
              <button onClick={async () => { if (await saveProfile(true)) next(); }} disabled={!!busy} className="pos-action">{busy === 'save' ? 'Saving…' : 'Save & continue'}</button>
              <button onClick={async () => { await saveProfile(true); next(); }} className="pos-link" style={{ fontSize: 14 }}>Skip for now →</button>
            </div>
          </div>
        )}

        {/* STEP: summary */}
        {st.id === 'summary' && (
          <div>
            <p className="pos-label" style={{ color: 'var(--green)' }}>Your profile is ready</p>
            <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1 mb-3" style={{ letterSpacing: '-0.02em' }}>Here&apos;s what we&apos;ll build from.</h1>
            <div className="pos-card p-5" style={{ background: 'var(--green-soft)', borderColor: 'var(--green)' }}>
              {summary
                ? <p className="text-[15px] text-[var(--ink)] whitespace-pre-line" style={{ lineHeight: 1.65 }}>{summary}</p>
                : <p className="text-sm text-[var(--muted)]">Your profile is saved. We&apos;ll use it to build your website next.</p>}
            </div>
            <button onClick={next} className="pos-action mt-6">Build my website →</button>
            <p className="text-[12px] text-[var(--muted)] mt-3">Next: we generate your website and first article from this profile.</p>
          </div>
        )}

        {/* STEP: generate (auto) */}
        {st.id === 'generate' && (
          <div className="text-center py-10">
            {genState === 'error' ? (
              <>
                <h1 className="text-[22px] font-semibold text-[var(--ink)]" style={{ letterSpacing: '-0.02em' }}>We hit a snag</h1>
                <p className="text-sm text-red-600 mt-2">{err}</p>
                <button onClick={() => { setGenState('idle'); }} className="pos-action mt-5">Try again</button>
              </>
            ) : (
              <>
                <div className="w-10 h-10 mx-auto rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" />
                <h1 className="text-[22px] font-semibold text-[var(--ink)] mt-5" style={{ letterSpacing: '-0.02em' }}>Building your website…</h1>
                <p className="text-sm text-[var(--muted)] mt-2">{genMsg || 'One moment…'}</p>
              </>
            )}
          </div>
        )}

        {/* STEP: live (aha) */}
        {st.id === 'live' && (
          <div>
            <p className="pos-label" style={{ color: 'var(--green)' }}>Your website is live</p>
            <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1 mb-3" style={{ letterSpacing: '-0.02em' }}>It&apos;s built — and editable, no redirection.</h1>
            <div className="pos-card p-5 mb-4" style={{ background: 'var(--green-soft)', borderColor: 'var(--green)' }}>
              <p className="text-[15px] text-[var(--ink)]" style={{ lineHeight: 1.6 }}>Your website and your first article are ready. Edit everything from the AI builder — you never leave CuraGo.</p>
              {siteUrl && <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="pos-action inline-block mt-3">View my website →</a>}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="pos-card p-4">
                <p className="pos-num text-2xl text-[var(--green)]">{creditsLeft ?? 10}</p>
                <p className="text-[13px] text-[var(--muted)] mt-0.5">AI credits, ready to use</p>
              </div>
              <div className="pos-card p-4">
                <p className="text-[14px] font-semibold text-[var(--ink)]">First article ready</p>
                <p className="text-[13px] text-[var(--muted)] mt-0.5">Review &amp; publish it anytime.</p>
              </div>
            </div>
            <div className="pos-card p-4 mb-5">
              <p className="text-[14px] font-semibold text-[var(--ink)]">Optional: connect Google Search Console</p>
              <p className="text-[13px] text-[var(--muted)] mt-0.5">See the searches your site starts appearing for. You can do this anytime.</p>
            </div>
            <button onClick={() => router.push('/app/zero-to-practice-builder')} className="pos-action">Continue</button>
            <p className="text-[12px] text-[var(--muted)] mt-3">Next up: your Google Business Profile setup.</p>
          </div>
        )}

        {/* Back */}
        {step > 0 && st.id !== 'summary' && (
          <button onClick={() => go(step - 1)} disabled={!!busy} className="pos-link text-sm mt-6 disabled:opacity-40">← Back</button>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Wizard />
    </Suspense>
  );
}
