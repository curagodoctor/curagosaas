'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { SECTIONS, Field } from '../_profile-fields';
import GbpGuide from '@/components/practice-os/GbpGuide';
import { validateImage } from '@/lib/imageValidation';
import { INTEREST_OPTIONS } from '@/lib/practice-os/profile-fields-defaults';

// A dropdown-combobox: shows the option list beneath the field (filtered as you
// type), and still allows a custom entry. Used for the specialty field.
function ComboBox({ value, onChange, placeholder, options, className, style, onFocus, onBlur }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);
  const q = String(value || '').toLowerCase().trim();
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input value={value || ''} placeholder={placeholder} autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={(e) => { setOpen(true); onFocus?.(e); }}
        onBlur={onBlur}
        className={className} style={style} />
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, maxHeight: 240, overflowY: 'auto', background: 'var(--card, #fff)', border: '1px solid var(--rule)', borderRadius: 11, boxShadow: '0 8px 24px rgba(16,26,19,.12)' }}>
          {filtered.map((o) => (
            <button key={o} type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(o); setOpen(false); }}
              className="w-full text-left px-3.5 py-2.5 text-[14px] hover:bg-[var(--paper)]"
              style={{ color: 'var(--ink)', background: o === value ? 'var(--green-soft, rgba(9,107,23,.08))' : 'transparent', borderBottom: '1px solid var(--rule-soft)' }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// The linear onboarding wizard (entry flow §2). One guided flow, one step at a
// time, with a phase rail: PROFILE → WEBSITE → GOOGLE → ACCESS. POS design.
// This commit implements the PROFILE phase; later phases follow.
// Phase rail labels. 'Account' (signup) is always complete by the time the
// wizard opens, so it shows as a done step; a STEP's `phase` (0–3) maps to
// Profile…Access, i.e. rail index = phase + 1.
const PHASES = ['Account', 'Profile', 'Website', 'Google', 'Access'];

const PRO = SECTIONS.find((s) => s.id === 'pro') || { fields: [] };
const PRACTICE = SECTIONS.find((s) => s.id === 'practice') || { fields: [] };
const IDENTITY_KEYS = ['doctor_name', 'designation', 'specialty', 'subspecialty', 'qualifications', 'additional_qualifications', 'years_experience', 'languages', 'gender'];
const GENERATED_KEYS = ['expertise', 'diseases', 'procedures', 'usp', 'interests'];
const OPTIONAL_KEYS = ['awards', 'publications', 'registration'];
// Phase A profile flow groups (spec order).
const MAP_KEYS = ['expertise', 'diseases', 'procedures'];   // "with this create" — generated lists
const USP_KEYS = ['usp', 'interests'];                       // describe your USP / interests
const AWARDS_KEYS = ['awards', 'publications', 'registration']; // shown unchanged, optional
const fieldsBy = (section, keys) => keys.map((k) => section.fields.find((f) => f.key === k)).filter(Boolean);

// Wizard steps (PROFILE + WEBSITE phases so far).
const STEPS = [
  { id: 'branch', phase: 0 },
  { id: 'profile', phase: 0 },   // Block 1 · identity (untouched)
  { id: 'map', phase: 0 },       // with this, create expertise/diseases/procedures
  { id: 'usp', phase: 0 },       // USP + areas of interest
  { id: 'photos', phase: 0 },    // 3 landscape + 1 profile
  { id: 'clinical', phase: 0 },  // edit further — clinical details
  { id: 'awards', phase: 0 },    // edit further — awards/research/publications
  { id: 'links', phase: 0 },     // Maps/GBP/IG/FB/LinkedIn
  { id: 'subdomain', phase: 0 }, // choose subdomain → create website + blog
  { id: 'generate', phase: 1 },
  { id: 'live', phase: 1 },
  { id: 'google', phase: 2 },
  { id: 'quiz', phase: 3 },
];

// Common Indian medical specialties — offered as suggestions on the specialty
// field (a combobox: pick one or type your own, e.g. a sub-specialty we don't list).
const SPECIALTY_OPTIONS = [
  'General Medicine', 'General Surgery', 'Orthopaedics', 'Cardiology', 'Cardiothoracic Surgery',
  'Neurology', 'Neurosurgery', 'Gastroenterology', 'Surgical Gastroenterology', 'Hepatology',
  'Nephrology', 'Urology', 'Endocrinology', 'Pulmonology', 'Rheumatology', 'Dermatology',
  'Psychiatry', 'Paediatrics', 'Paediatric Surgery', 'Obstetrics & Gynaecology', 'Gynaecology',
  'Ophthalmology', 'ENT (Otorhinolaryngology)', 'Dentistry', 'Oral & Maxillofacial Surgery',
  'General Physician', 'Family Medicine', 'Oncology', 'Surgical Oncology', 'Medical Oncology',
  'Radiation Oncology', 'Radiology', 'Anaesthesiology', 'Plastic & Reconstructive Surgery',
  'Vascular Surgery', 'Colorectal Surgery', 'Bariatric Surgery', 'Laparoscopic Surgery',
  'Physiotherapy', 'Physical Medicine & Rehabilitation', 'Diabetology', 'Haematology',
  'Infectious Diseases', 'Sports Medicine', 'Pain Management', 'Sexology', 'Ayurveda', 'Homeopathy',
];

// Years-of-practice dropdown options.
const YEARS_OPTIONS = ['Less than 1', ...Array.from({ length: 40 }, (_, i) => String(i + 1)), '40+'];

// §2 Block 1 — the identity questions, worded exactly as the September prototype
// ("Who are you, as patients should see you?"), mapped to our profile fields.
const IDENTITY_Q = [
  { key: 'doctor_name', label: 'How should your name appear to patients?', ph: 'Dr. Your Name' },
  { key: 'specialty', label: 'What is your specialty?', ph: 'Pick one or type your own', type: 'combo', options: INTEREST_OPTIONS },
  { key: 'qualifications', label: 'What are your qualifications?', ph: 'MBBS, MS' },
  { key: 'additional_qualifications', label: 'Any additional qualifications?', ph: 'Fellowship, diploma', optional: true },
  { key: 'years_experience', label: 'How many years have you been practising?', type: 'select', options: YEARS_OPTIONS },
];

// §11 — the commitment check before Get Access. The first two questions are
// mandatory (a "no" stops here); the third (buying a custom domain) is optional —
// either answer qualifies.
const QUIZ = [
  { title: 'Are you serious about being found by your patients on Google?', body: 'Not curious — serious. This only works for doctors who genuinely want to be discoverable.', yes: 'Yes, I am serious', no: 'Not right now', mandatory: true },
  { title: 'Can you commit 60 minutes a week?', body: '60 mins a week (flexible) managing your GBP and website. All you need to do is review the content and publish it — a minimum of 2 clicks to a maximum of 6 clicks per task.', yes: 'Yes, I can commit', no: "I can't commit that", mandatory: true },
  { title: 'Are you ready to buy a custom domain of your own, which would cost around ₹500 to ₹800 per year?', body: 'We recommend buying your custom domain at the earliest so that you can pick one of your choice and not settle for what is available. SEO is a long-term mission, best on your own domain. You can start on a subdomain and switch later, but you may see a short ranking dip while Google processes the shift. This question is not mandatory to qualify for the next level.', yes: 'Yes, I will buy one', no: 'Not right now', mandatory: false },
];


function Wizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState({});
  const [summary, setSummary] = useState('');
  const [loaded, setLoaded] = useState(false);

  // branch
  const [hasWebsite, setHasWebsite] = useState(null); // 'no' | 'yes'
  const [branchStage, setBranchStage] = useState(0);  // 0 = question, 1 = the pitch + proceed/not-interested
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
  const [existingSubdomain, setExistingSubdomain] = useState('');
  const [subStatus, setSubStatus] = useState(null);
  const [subMsg, setSubMsg] = useState('');
  // website generation
  const [genState, setGenState] = useState('idle'); // idle | running | done | error
  const [genMsg, setGenMsg] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [creditsLeft, setCreditsLeft] = useState(null);
  const [firstArticleId, setFirstArticleId] = useState('');
  const [firstArticleUrl, setFirstArticleUrl] = useState('');
  const [practiceErr, setPracticeErr] = useState(false);
  // commitment quiz
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizFailed, setQuizFailed] = useState(false);
  const [quizPhase, setQuizPhase] = useState('milestone'); // milestone → quiz → ready
  const [gbpStage, setGbpStage] = useState('choose'); // choose (status) → guide
  const [gbpChoice, setGbpChoice] = useState('');
  // §5b areas + §5e relevant links
  const [areas, setAreas] = useState([]);
  // Default labels so patients' clinic + socials show by default (spec: Maps,
  // GBP, Instagram, Facebook, LinkedIn). Saved values overwrite these on load.
  const [relevantLinks, setRelevantLinks] = useState([
    { label: 'Google Maps link', url: '' },
    { label: 'Google Business Profile', url: '' },
    { label: 'Instagram', url: '' },
    { label: 'Facebook', url: '' },
    { label: 'LinkedIn', url: '' },
  ]);

  const st = STEPS[step];

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/practice-os/profile', { credentials: 'include' });
        if (r.status === 401) { router.push('/login?entry=practice-os'); return; }
        const d = await r.json();
        if (d.success) {
          setFields(d.fields || {}); setSummary(d.summary || '');
          if (d.hasWebsite) setHasWebsite(d.hasWebsite);
          if (d.subdomain) { setSubdomain(d.subdomain); setExistingSubdomain(d.subdomain); }
          // If they cleared the commitment filter but never submitted the
          // qualifying application, resume them straight to that form (the last
          // gate) rather than replaying the whole wizard.
          if (d.quizPassed && !d.onboardComplete) { router.replace('/app/zero-to-practice-builder/get-access'); return; }
          // Resume where they left off. Never resume ONTO the auto-running
          // 'generate' step (it would re-charge credits) — land on 'live' instead.
          let s = Number(d.onboardStep) || 0;
          const genIdx = STEPS.findIndex((x) => x.id === 'generate');
          const liveIdx = STEPS.findIndex((x) => x.id === 'live');
          if (s === genIdx) s = liveIdx;
          setStep(Math.min(Math.max(s, 0), STEPS.length - 1));
        }
      } catch { /* ignore */ }
      setLoaded(true);
    })();
  }, [router]);

  // Trap the browser Back button inside the wizard: build a back-stack for the
  // resumed step, then intercept popstate to move BETWEEN steps rather than
  // navigating away from onboarding.
  const historyInit = useRef(false);
  useEffect(() => {
    if (!loaded || historyInit.current) return;
    historyInit.current = true;
    try {
      window.history.replaceState({ posStep: 0 }, '');
      for (let i = 1; i <= step; i++) window.history.pushState({ posStep: i }, '');
    } catch { /* no-op */ }
    const onPop = (e) => {
      const t = e?.state?.posStep;
      if (typeof t === 'number') { setStep(t); setErr(''); window.scrollTo(0, 0); persistStep(t); }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const setField = (k, v) => setFields((f) => ({ ...f, [k]: v }));
  const toggleTag = (k, opt) => setFields((f) => {
    const cur = (f[k] || '').split(',').map((x) => x.trim()).filter(Boolean);
    const next = cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt];
    return { ...f, [k]: next.join(', ') };
  });

  // Persist the wizard position so a mid-flow refresh resumes instead of
  // restarting (fire-and-forget; never blocks navigation).
  const persistStep = useCallback((i) => {
    fetch('/api/practice-os/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ onboardStep: i }),
    }).catch(() => {});
  }, []);

  // Leave onboarding for the control center. Mark onboarding complete first —
  // otherwise the dashboard sees onboardComplete=false and bounces back here.
  const goToControlCenter = useCallback(async () => {
    try {
      await fetch('/api/practice-os/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ onboardComplete: true }),
      });
    } catch { /* navigate anyway */ }
    router.push('/app/zero-to-practice-builder');
  }, [router]);
  const go = (i) => {
    setStep(i); setErr(''); window.scrollTo(0, 0); persistStep(i);
    // Add a browser-history entry per step so the browser Back button walks the
    // wizard instead of leaving onboarding (which dropped users on the signup
    // page and looked like a logout).
    try { window.history.pushState({ posStep: i }, ''); } catch { /* no-op */ }
  };
  const next = () => go(Math.min(step + 1, STEPS.length - 1));
  const goToId = (id) => go(STEPS.findIndex((s) => s.id === id));
  // §3 branch — remember the choice so a refresh keeps the right framing.
  const chooseBranch = (v) => {
    setHasWebsite(v);
    fetch('/api/practice-os/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ hasWebsite: v }),
    }).catch(() => {});
  };
  // Passing the 3-question commitment filter records `quizPassed` but does NOT
  // finish onboarding — onboarding is only complete once the qualifying
  // application is submitted (set in the get-access page). Recording quizPassed
  // lets a returning doctor resume straight to the application form.
  const proceedToApplication = async () => {
    try {
      await fetch('/api/practice-os/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ quizPassed: true }),
      });
    } catch { /* non-blocking */ }
    router.push('/app/zero-to-practice-builder/get-access');
  };

  const signOut = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch { /* ignore */ }
    router.push('/login?entry=practice-os');
  };

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

  // Phase A — "with this, create" the expertise / diseases / procedures lists
  // from the identity block (specialty + qualifications + experience).
  const generateMap = useCallback(async () => {
    setBusy('map'); setErr('');
    try {
      const hintText = [fields.specialty, fields.qualifications, fields.additional_qualifications, fields.years_experience && `${fields.years_experience} years experience`].filter(Boolean).join(', ');
      const res = await fetch('/api/practice-os/profile/draft-section', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ sectionId: 'pro', hint: hintText }),
      });
      const d = await res.json();
      if (d.success) setFields((f) => ({ ...f, ...d.values }));
      else setErr(d.error === 'PaymentRequired' ? 'This needs AI access.' : (d.error || 'Could not generate.'));
    } catch { setErr('Something went wrong.'); }
    finally { setBusy(''); }
  }, [fields.specialty, fields.qualifications, fields.additional_qualifications, fields.years_experience]);

  // Auto-generate the practice map the first time the doctor reaches it.
  useEffect(() => {
    if (st.id === 'map' && !busy && fields.specialty && !fields.diseases && !fields.expertise) generateMap();
  }, [st.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setErr('');
    const v = await validateImage(file, 'portrait');
    if (!v.ok) { setErr(v.error); if (e.target) e.target.value = ''; return; }
    setBusy('photo');
    try { setProfilePhoto(await uploadPhoto(file, 'profile')); } catch (x) { setErr(x.message); } finally { setBusy(''); }
  };
  // Website (hero) photos — landscape; the doctor can add as many as they like.
  const onClinicPhotoAdd = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setErr('');
    const v = await validateImage(file, 'landscape');
    if (!v.ok) { setErr(v.error); if (e.target) e.target.value = ''; return; }
    setBusy('clinicadd');
    try { const url = await uploadPhoto(file, 'clinic'); setClinicPhotos((p) => [...p, url]); }
    catch (x) { setErr(x.message); } finally { setBusy(''); if (e.target) e.target.value = ''; }
  };
  const removeClinicPhoto = (i) => setClinicPhotos((p) => p.filter((_, j) => j !== i));
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

      // §6d — reveal the live site immediately (the "aha"); it must NOT wait behind
      // the slow first-article draft. Navigate by absolute index: `next()` here
      // closes over a stale `step` (deps are [fields]) and would jump backwards.
      setGenState('done');
      goToId('live');

      // First educational article drafts in the background from the top condition.
      const topic = (fields.diseases || '').split(',')[0]?.trim() || (fields.expertise || '').split(',')[0]?.trim() || `${fields.specialty || 'my practice'}`;
      fetch('/api/practice-os/actions/draft-blog', { method: 'POST', ...J, body: JSON.stringify({ context: `An introductory patient-education article about ${topic}.`, pageType: 'disease' }) })
        .then((r) => r.json())
        .then((b) => { if (typeof b.creditsRemaining === 'number') setCreditsLeft(b.creditsRemaining); if (b.id) setFirstArticleId(b.id); if (b.url) setFirstArticleUrl(b.url); })
        .catch(() => {});
    } catch (x) { setGenState('error'); setErr(x.message || 'Something went wrong.'); }
  }, [fields]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (st.id === 'generate' && genState === 'idle') runGenerate(); }, [st.id, genState, runGenerate]);

  // §5b — AI-suggest local areas from the city.
  const suggestAreas = async () => {
    setBusy('areas'); setErr('');
    try {
      const d = await fetch('/api/practice-os/actions/suggest-areas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ city: fields.city, specialty: fields.specialty }),
      }).then((r) => r.json());
      if (d.success) setAreas((prev) => Array.from(new Set([...prev, ...(d.areas || [])])));
      else setErr(d.error || 'Could not suggest areas.');
    } catch { setErr('Something went wrong.'); }
    finally { setBusy(''); }
  };
  const saveMedia = (extra = {}) => fetch('/api/practice-os/onboarding-media', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
    body: JSON.stringify(extra),
  }).catch(() => {});

  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  if (!loaded) return <div className="min-h-screen grid place-items-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      {/* Top bar — logo · phase · Exit, with an orange progress line */}
      <header className="sticky top-0 z-20" style={{ background: 'var(--card)', borderBottom: '1px solid var(--rule)' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/curago-logo.png" alt="CuraGo" className="h-7 w-auto" />
          <div className="flex items-center gap-2.5">
            <span className="pos-label" style={{ color: 'var(--muted)' }}>{PHASES[st.phase + 1] || 'Setup'}</span>
            {step > 0 && (
              <button onClick={() => { if (window.confirm('Start the setup again from the beginning? Your saved details are kept.')) { setBranchStage(0); setQuizPhase('milestone'); setQuizIdx(0); setQuizFailed(false); go(0); } }}
                className="text-[13px] font-medium" style={{ color: 'var(--muted)' }}>Start over</button>
            )}
            <button onClick={signOut}
              className="text-[13px] font-semibold rounded-[10px] px-3 py-1.5"
              style={{ border: '1px solid var(--rule)', color: 'var(--muted)', background: 'var(--card)' }}>Sign out</button>
          </div>
        </div>
        <div style={{ height: 4, background: 'var(--rule-soft)' }}>
          <div style={{ height: '100%', background: 'var(--orange)', width: `${pct}%`, transition: 'width .3s ease' }} />
        </div>
      </header>

      {/* Phase rail — pills (Account done · current filled · rest outlined) */}
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-5 pt-4 flex flex-wrap gap-2">
        {PHASES.map((p, i) => {
          const cur = st.phase + 1;      // Account (index 0) is already done
          const active = i === cur;
          const done = i < cur;
          return (
            <span key={p} className="pos-label" style={{
              padding: '6px 10px', borderRadius: 7,
              background: active ? 'var(--green)' : done ? 'var(--green-soft)' : 'transparent',
              color: active ? '#fff' : done ? 'var(--green)' : 'var(--muted)',
              border: `1px solid ${active ? 'var(--green)' : done ? 'transparent' : 'var(--rule)'}`,
            }}>{p}</span>
          );
        })}
      </div>

      <main className="max-w-2xl mx-auto w-full px-4 sm:px-5 pt-4 pb-3">
        <div className="pos-card" style={{ padding: 'clamp(20px,4vw,32px)', borderRadius: 20, boxShadow: '0 22px 56px rgba(9,107,23,.06)' }}>
        {/* STEP: branch */}
        {st.id === 'branch' && (branchStage === 0 ? (
          <div>
            <p className="pos-label" style={{ color: 'var(--green)' }}>Getting started</p>
            <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1 mb-2" style={{ letterSpacing: '-0.02em' }}>Do you already have a website?</h1>
            <div className="grid gap-2.5 mt-4">
              <button onClick={() => { chooseBranch('no'); setBranchStage(1); }} className="pos-card p-4 text-left" style={{ borderColor: hasWebsite === 'no' ? 'var(--green)' : 'var(--rule)', background: hasWebsite === 'no' ? 'var(--green-soft)' : 'var(--card)' }}>
                <span className="block font-semibold text-[15px] text-[var(--ink)]">No, not yet</span>
              </button>
              <button onClick={() => { chooseBranch('yes'); setBranchStage(1); }} className="pos-card p-4 text-left" style={{ borderColor: hasWebsite === 'yes' ? 'var(--green)' : 'var(--rule)', background: hasWebsite === 'yes' ? 'var(--green-soft)' : 'var(--card)' }}>
                <span className="block font-semibold text-[15px] text-[var(--ink)]">Yes, I have one</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="pos-label" style={{ color: 'var(--green)' }}>{hasWebsite === 'yes' ? 'You already have a website' : 'No website yet'}</p>
            <h1 className="text-[23px] font-semibold text-[var(--ink)] mt-1 mb-2" style={{ letterSpacing: '-0.02em', lineHeight: 1.25 }}>
              {hasWebsite === 'yes' ? 'Got it — let us build you a better one.' : 'Perfect. Our AI builds one for you.'}
            </h1>
            <p className="text-[15px] text-[var(--muted)] mb-5" style={{ lineHeight: 1.6, maxWidth: '58ch' }}>
              {hasWebsite === 'yes'
                ? 'Our AI can build a brand-new website on your own subdomain, live instantly. If you like it, you can point your custom domain to it instantly and seamlessly — you keep your domain and its SEO.'
                : 'In less than 10 minutes, at no cost for life. No downside — give it a shot.'}
            </p>
            <div className="grid gap-2.5">
              <button onClick={next} className="pos-action text-center">Yes, proceed</button>
              <button onClick={() => goToId('google')} className="pos-card p-3.5 text-center text-[15px] font-medium" style={{ color: 'var(--muted)' }}>No, not interested</button>
            </div>
            <button onClick={() => setBranchStage(0)} className="pos-link text-sm mt-5" style={{ color: 'var(--muted)' }}>← Back</button>
          </div>
        ))}

        {/* STEP: profile — Block 1 · Doctor identity (prototype questions) */}
        {st.id === 'profile' && (
          <div>
            <p className="pos-label" style={{ color: 'var(--orange)' }}>Block 1 · Doctor identity</p>
            <h1 className="font-extrabold text-[var(--ink)] mt-2.5 mb-3" style={{ fontSize: 'clamp(24px,5vw,34px)', letterSpacing: '-0.03em', lineHeight: 1.08 }}>Who are you, as patients should see you?</h1>
            <p className="text-[15.5px] text-[var(--muted)] mb-6" style={{ lineHeight: 1.6, maxWidth: '58ch' }}>These are source-of-truth fields. They are stored exactly as you provide them — never rewritten into something more impressive.</p>

            <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' }}>
              {IDENTITY_Q.map((q) => {
                const inputCls = 'w-full rounded-[11px] px-3.5 py-3 text-[14.5px] outline-none';
                const inputStyle = { border: '1px solid var(--rule)', background: 'var(--paper)' };
                const onFocus = (e) => { e.target.style.outline = '2px solid var(--orange)'; e.target.style.outlineOffset = '1px'; };
                const onBlur = (e) => { e.target.style.outline = 'none'; };
                return (
                <label key={q.key} className="block">
                  <span className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-[13px] font-semibold text-[var(--ink)]">{q.label}</span>
                    {q.optional && <span className="pos-label" style={{ color: 'var(--muted)' }}>Optional</span>}
                  </span>
                  {q.type === 'select' ? (
                    <select value={fields[q.key] || ''} onChange={(e) => setField(q.key, e.target.value)}
                      className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
                      <option value="" disabled>Select…</option>
                      {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : q.type === 'combo' ? (
                    <ComboBox value={fields[q.key] || ''} onChange={(v) => setField(q.key, v)} placeholder={q.ph}
                      options={q.options} className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  ) : (
                    <input value={fields[q.key] || ''} onChange={(e) => setField(q.key, e.target.value)} placeholder={q.ph}
                      className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  )}
                </label>
                );
              })}
            </div>

            {err && <p className="text-[13px] text-red-600 mt-4">{err}</p>}
            <div className="flex items-center justify-between gap-3 mt-7">
              <button onClick={async () => { if (await saveProfile()) next(); }} disabled={!!busy} className="pos-action">{busy === 'save' ? 'Saving…' : 'Save and continue'}</button>
            </div>
          </div>
        )}

        {/* STEP: map — with this, create the practice lists */}
        {st.id === 'map' && (
          <div>
            <p className="pos-label" style={{ color: 'var(--orange)' }}>Block 2 · Your practice map</p>
            <h1 className="font-extrabold text-[var(--ink)] mt-2.5 mb-3" style={{ fontSize: 'clamp(24px,5vw,34px)', letterSpacing: '-0.03em', lineHeight: 1.08 }}>With this, we&apos;ve mapped your practice.</h1>
            <p className="text-[15.5px] text-[var(--muted)] mb-5" style={{ lineHeight: 1.6, maxWidth: '58ch' }}>From your specialty and experience, CuraGo drafted your areas of expertise, the diseases you treat and the procedures you perform. Edit anything — then save.</p>
            {busy === 'map' && !fields.diseases ? (
              <div className="pos-card p-6 text-center"><div className="w-8 h-8 mx-auto rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /><p className="text-sm text-[var(--muted)] mt-3">Mapping your practice…</p></div>
            ) : (
              <>
                <div className="space-y-4">{fieldsBy(PRO, MAP_KEYS).map((f) => <Field key={f.key} f={f} value={fields[f.key] || ''} onChange={(v) => setField(f.key, v)} onToggleTag={(o) => toggleTag(f.key, o)} />)}</div>
                <button onClick={generateMap} disabled={!!busy} className="pos-link text-sm mt-3">↻ Regenerate from my specialty</button>
              </>
            )}
            {err && <p className="text-[13px] text-red-600 mt-3">{err}</p>}
            <div className="flex items-center gap-3 mt-6">
              <button onClick={async () => { if (await saveProfile()) next(); }} disabled={!!busy} className="pos-action">{busy === 'save' ? 'Saving…' : 'Save and continue'}</button>
            </div>
          </div>
        )}

        {/* STEP: usp — describe your USP + interests */}
        {st.id === 'usp' && (
          <div>
            <p className="pos-label" style={{ color: 'var(--orange)' }}>Block 3 · What sets you apart</p>
            <h1 className="font-extrabold text-[var(--ink)] mt-2.5 mb-3" style={{ fontSize: 'clamp(24px,5vw,34px)', letterSpacing: '-0.03em', lineHeight: 1.08 }}>Describe your strength and interests.</h1>
            <p className="text-[15.5px] text-[var(--muted)] mb-5" style={{ lineHeight: 1.6, maxWidth: '58ch' }}>In a line or two — what makes your practice different, and the areas you want to be known for. We&apos;ll shape it into your website.</p>
            <div className="space-y-4">{fieldsBy(PRO, USP_KEYS).map((f) => <Field key={f.key} f={f} value={fields[f.key] || ''} onChange={(v) => setField(f.key, v)} onToggleTag={(o) => toggleTag(f.key, o)} />)}</div>
            {err && <p className="text-[13px] text-red-600 mt-3">{err}</p>}
            <div className="flex items-center gap-3 mt-6">
              <button onClick={async () => { if (await saveProfile()) next(); }} disabled={!!busy} className="pos-action">{busy === 'save' ? 'Saving…' : 'Save and continue'}</button>
            </div>
          </div>
        )}

        {/* STEP: photos */}
        {st.id === 'photos' && (
          <div>
            <p className="pos-label" style={{ color: 'var(--green)' }}>Photos</p>
            <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1 mb-1.5" style={{ letterSpacing: '-0.02em' }}>Add your photos.</h1>
            <p className="text-sm text-[var(--muted)] mb-5" style={{ lineHeight: 1.6, maxWidth: '58ch' }}>Real photos are required to build your website — they can&apos;t be added later. Please add them now.</p>

            {/* Website / hero photos */}
            <div className="flex items-baseline gap-2 mb-1">
              <p className="pos-label" style={{ margin: 0 }}>Website photos</p>
              <span className="pos-label" style={{ color: 'var(--orange)' }}>Required · at least 1</span>
            </div>
            <p className="text-[12.5px] text-[var(--muted)] mb-2.5" style={{ lineHeight: 1.55, maxWidth: '60ch' }}>
              These fill the <strong style={{ color: 'var(--ink)' }}>hero section</strong> at the top of your site, so they must be <strong style={{ color: 'var(--ink)' }}>landscape</strong> (wide, not tall).
              Aim for <strong style={{ color: 'var(--ink)' }}>1600×900 px (16:9)</strong>, minimum <strong style={{ color: 'var(--ink)' }}>1200×675 px</strong>, sharp and well-lit, JPG or PNG up to ~8&nbsp;MB.
              Good examples: your <em>clinic exterior</em>, your <em>clinic interior</em>, or <em>you at the clinic / receiving an award</em>. Add as many as you like — the more, the better.
            </p>
            <div className="grid gap-2.5 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
              {clinicPhotos.map((url, i) => (
                <div key={i} className="relative pos-card aspect-video overflow-hidden" style={{ borderStyle: 'solid' }}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeClinicPhoto(i)} aria-label="Remove photo"
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full grid place-items-center text-white"
                    style={{ background: 'rgba(16,26,19,.72)', fontSize: 14, lineHeight: 1 }}>×</button>
                </div>
              ))}
              <label className="pos-card aspect-video grid place-items-center cursor-pointer text-center" style={{ borderStyle: 'dashed' }}>
                <input type="file" accept="image/*" className="hidden" onChange={onClinicPhotoAdd} />
                <span className="text-[12px] text-[var(--muted)]">{busy === 'clinicadd' ? 'Uploading…' : (clinicPhotos.length ? '+ Add another' : '+ Add landscape photo')}</span>
              </label>
            </div>

            {/* Profile photo */}
            <div className="flex items-baseline gap-2 mb-1">
              <p className="pos-label" style={{ margin: 0 }}>Profile photo</p>
              <span className="pos-label" style={{ color: 'var(--orange)' }}>Required</span>
            </div>
            <p className="text-[12.5px] text-[var(--muted)] mb-2.5" style={{ lineHeight: 1.55, maxWidth: '60ch' }}>
              A professional <strong style={{ color: 'var(--ink)' }}>portrait headshot</strong> of you — <strong style={{ color: 'var(--ink)' }}>tall, not wide</strong>, face clearly visible, plain background.
              Aim for <strong style={{ color: 'var(--ink)' }}>800×1000 px (4:5)</strong>, minimum <strong style={{ color: 'var(--ink)' }}>600×750 px</strong>. This is used only for your profile — not the hero.
            </p>
            <label className="pos-card cursor-pointer overflow-hidden grid place-items-center" style={{ width: 132, height: 165, borderStyle: profilePhoto ? 'solid' : 'dashed' }}>
              <input type="file" accept="image/*" className="hidden" onChange={onProfilePhoto} />
              {profilePhoto ? <img src={profilePhoto} alt="" className="w-full h-full object-cover" /> : <span className="text-[11px] text-[var(--muted)] px-2 text-center">{busy === 'photo' ? 'Uploading…' : 'Add portrait photo'}</span>}
            </label>

            {err && <p className="text-[13px] text-red-600 mt-3">{err}</p>}
            {!(clinicPhotos.length >= 1 && profilePhoto) && (
              <p className="text-[12.5px] mt-4" style={{ color: 'var(--muted)' }}>
                To continue, add {clinicPhotos.length < 1 ? 'at least one website (landscape) photo' : ''}{clinicPhotos.length < 1 && !profilePhoto ? ' and ' : ''}{!profilePhoto ? 'your profile (portrait) photo' : ''}.
              </p>
            )}
            <div className="flex items-center gap-3 mt-5">
              <button onClick={async () => { await savePhotos(); next(); }} disabled={!!busy || !(clinicPhotos.length >= 1 && profilePhoto)} className="pos-action disabled:opacity-40 disabled:cursor-not-allowed">{busy === 'savephotos' ? 'Saving…' : 'Save & continue'}</button>
            </div>
          </div>
        )}

        {/* STEP: subdomain */}
        {st.id === 'subdomain' && (existingSubdomain ? (
          // Existing account — they already have a website here. Let them keep it,
          // rebuild it with AI, or change the address. (Old users choose.)
          <div>
            <p className="pos-label" style={{ color: 'var(--green)' }}>Website address</p>
            <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1 mb-1.5" style={{ letterSpacing: '-0.02em' }}>You already have a website here.</h1>
            <p className="text-sm text-[var(--muted)] mb-4">Keep the site you already have, or let our AI rebuild it from your updated profile. You can point a custom domain at it later from Settings.</p>
            <div className="pos-card p-4 flex items-center gap-2 mb-4" style={{ background: 'var(--green-soft)', borderColor: 'var(--green)' }}>
              <span className="text-[15px] font-semibold text-[var(--ink)]">{existingSubdomain}.curago.in</span>
            </div>
            <div className="grid gap-2.5">
              <button onClick={() => goToId('google')} className="pos-action text-center">Keep my current website</button>
              <button onClick={next} className="pos-card p-3.5 text-center text-[15px] font-medium" style={{ color: 'var(--ink)' }}>Rebuild it with AI</button>
              <button onClick={() => { setExistingSubdomain(''); setSubdomain(''); setSubStatus(null); setSubMsg(''); }} className="pos-link text-sm mt-1" style={{ color: 'var(--muted)' }}>Change my address →</button>
            </div>
          </div>
        ) : (
          <div>
            <p className="pos-label" style={{ color: 'var(--green)' }}>Website address</p>
            <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1 mb-1.5" style={{ letterSpacing: '-0.02em' }}>Choose your website address.</h1>
            <p className="text-sm text-[var(--muted)] mb-1.5">Create your subdomain. You can change it later.</p>
            <p className="text-sm text-[var(--muted)] mb-4">
              {hasWebsite === 'yes'
                ? <>We&apos;ll build your new site here first, then help you point{existing ? <> <b>{existing}</b></> : ' your existing domain'} at it — you keep your domain and its SEO.</>
                : 'You can connect a custom domain later.'}
            </p>
            <div className="flex items-stretch pos-card overflow-hidden p-0">
              <input autoFocus value={subdomain} onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="yourclinic" maxLength={30} className="flex-1 px-3.5 py-3 text-sm outline-none bg-transparent" />
              <span className="flex items-center px-3.5 text-sm text-[var(--muted)]" style={{ background: 'var(--rule-soft)', borderLeft: '1px solid var(--rule)' }}>.curago.in</span>
            </div>
            <p className="text-[12.5px] text-[var(--muted)] mt-1.5">Example: drkumar.curago.in</p>
            {subMsg && <p className="text-[13px] mt-2" style={{ color: subStatus === 'ok' ? 'var(--green)' : subStatus === 'taken' || subStatus === 'bad' ? '#B42318' : 'var(--muted)' }}>{subMsg}</p>}
            {err && <p className="text-[13px] text-red-600 mt-2">{err}</p>}
            <button onClick={claimSub} disabled={busy === 'sub' || subStatus !== 'ok'} className="pos-action mt-6" style={{ opacity: subStatus === 'ok' ? 1 : 0.5 }}>{busy === 'sub' ? 'Setting up…' : 'Create my website'}</button>
          </div>
        ))}

        {/* STEP: clinical */}
        {st.id === 'clinical' && (
          <div>
            <p className="pos-label" style={{ color: 'var(--green)' }}>Practice details</p>
            <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1 mb-1.5" style={{ letterSpacing: '-0.02em' }}>Where do patients find you?</h1>
            <p className="text-sm text-[var(--muted)] mb-4">These are needed to build your site and can&apos;t be skipped. Please use clinic (not personal) contact details.</p>
            <div className="space-y-4">{PRACTICE.fields.map((f) => <Field key={f.key} f={f} value={fields[f.key] || ''} error={practiceErr && f.required && !String(fields[f.key] || '').trim()} onChange={(v) => setField(f.key, v)} onToggleTag={(o) => toggleTag(f.key, o)} />)}</div>

            {/* §5b — local areas for local SEO */}
            <div className="pos-card p-4 mt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="pos-label" style={{ color: 'var(--green)' }}>Local areas</p>
                  <p className="text-[13px] text-[var(--muted)] mt-0.5">Areas near you that patients search from — we&apos;ll mention these for local SEO.</p>
                </div>
                <button onClick={suggestAreas} disabled={!!busy || !fields.city} className="pos-action shrink-0" style={{ padding: '8px 14px', opacity: fields.city ? 1 : 0.5 }}>{busy === 'areas' ? '…' : '✨ Suggest'}</button>
              </div>
              {areas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {areas.map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1 rounded-full" style={{ background: 'var(--green-soft)', color: 'var(--green)', border: '1px solid var(--rule)' }}>
                      {a}
                      <button onClick={() => setAreas(areas.filter((_, j) => j !== i))} className="opacity-60 hover:opacity-100">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {practiceErr && <p className="text-[13px] text-red-600 mt-3">Please fill every required field before continuing.</p>}
            {err && <p className="text-[13px] text-red-600 mt-3">{err}</p>}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={async () => {
                  const missing = PRACTICE.fields.some((f) => f.required && !String(fields[f.key] || '').trim());
                  if (missing) { setPracticeErr(true); setErr(''); return; }
                  // Digit fields (phone/PIN) must be the exact length when filled.
                  const badDigits = PRACTICE.fields.find((f) => f.digits && String(fields[f.key] || '').trim() && String(fields[f.key]).length !== f.digits);
                  if (badDigits) { setPracticeErr(false); setErr(`${badDigits.label} must be exactly ${badDigits.digits} digits.`); return; }
                  setPracticeErr(false); setErr('');
                  if (await saveProfile(true)) { saveMedia({ localAreas: areas }); next(); }
                }}
                disabled={!!busy}
                className="pos-action">{busy === 'save' ? 'Saving…' : 'Save & continue'}</button>
            </div>
          </div>
        )}

        {/* STEP: awards — edit further (optional, shown unchanged) */}
        {st.id === 'awards' && (
          <div>
            <p className="pos-label" style={{ color: 'var(--green)' }}>Edit further</p>
            <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1 mb-1.5" style={{ letterSpacing: '-0.02em' }}>Awards, research and publications.</h1>
            <p className="text-sm text-[var(--muted)] mb-4">Optional. Anything you add appears exactly as you enter it — nothing rewritten. Skip if you have none.</p>
            <div className="space-y-4">{fieldsBy(PRO, AWARDS_KEYS).map((f) => <Field key={f.key} f={f} value={fields[f.key] || ''} onChange={(v) => setField(f.key, v)} onToggleTag={(o) => toggleTag(f.key, o)} />)}</div>
            {err && <p className="text-[13px] text-red-600 mt-3">{err}</p>}
            <div className="flex items-center gap-3 mt-6">
              <button onClick={async () => { if (await saveProfile()) next(); }} disabled={!!busy} className="pos-action">{busy === 'save' ? 'Saving…' : 'Save and continue'}</button>
              <button onClick={next} className="pos-link text-sm" style={{ color: 'var(--muted)' }}>Skip →</button>
            </div>
          </div>
        )}

        {/* STEP: relevant links (§5e) */}
        {st.id === 'links' && (
          <div>
            <p className="pos-label" style={{ color: 'var(--green)' }}>Your links</p>
            <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1 mb-1.5" style={{ letterSpacing: '-0.02em' }}>Add your map and social links.</h1>
            <p className="text-sm text-[var(--muted)] mb-4">Paste your Google Maps link (so patients see your clinic on the map), your Google Business Profile, and your Instagram, Facebook and LinkedIn. All optional — skip and come back anytime.</p>
            <div className="space-y-2">
              {relevantLinks.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <input value={l.label} onChange={(e) => setRelevantLinks((p) => { const n = [...p]; n[i] = { ...n[i], label: e.target.value }; return n; })} placeholder="Label" className="w-1/3 pos-card p-2.5 text-sm" />
                  <input value={l.url} onChange={(e) => setRelevantLinks((p) => { const n = [...p]; n[i] = { ...n[i], url: e.target.value }; return n; })} placeholder="https://…" className="flex-1 pos-card p-2.5 text-sm" />
                  <button onClick={() => setRelevantLinks(relevantLinks.filter((_, j) => j !== i))} className="pos-link text-sm px-2">Remove</button>
                </div>
              ))}
            </div>
            <button onClick={() => setRelevantLinks([...relevantLinks, { label: '', url: '' }])} className="pos-link text-sm mt-3">+ Add a link</button>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => { saveMedia({ relevantLinks }); next(); }} className="pos-action">Save &amp; continue</button>
              <button onClick={next} className="pos-link" style={{ fontSize: 14 }}>Skip for now →</button>
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
              <div className="flex flex-wrap gap-3 mt-3">
                {siteUrl && <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="pos-action inline-block">View my website →</a>}
                <a href="/admin/dashboard/ai-generate" className="pos-card inline-block px-4 py-3 text-[14px] font-semibold" style={{ borderColor: 'var(--green)', color: 'var(--green)' }}>Edit in the AI builder →</a>
              </div>
            </div>
            {/* First article — its own distinct (orange) surface, beneath the website card */}
            <div className="pos-card p-5 mb-4" style={{ background: 'var(--orange-soft, rgba(242,106,27,.08))', borderColor: 'var(--orange)' }}>
              <p className="pos-label" style={{ color: 'var(--orange)' }}>Your first article</p>
              {firstArticleId ? (
                <>
                  <p className="text-[15px] font-semibold text-[var(--ink)] mt-1" style={{ lineHeight: 1.5 }}>Published from your practice — it&apos;s live on your site.</p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {firstArticleUrl && <a href={firstArticleUrl} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-3 text-[14px] font-semibold rounded-[9px] text-white" style={{ background: 'var(--orange)' }}>View my article →</a>}
                    <a href={`/admin/dashboard/blog-articles/${firstArticleId}`} className="pos-card inline-block px-4 py-3 text-[14px] font-semibold" style={{ borderColor: 'var(--orange)', color: 'var(--orange)' }}>Edit in the builder →</a>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 mt-2">
                  <span className="inline-block w-6 h-6 rounded-full shrink-0 animate-spin" style={{ border: '2.5px solid var(--orange)', borderTopColor: 'transparent' }} />
                  <p className="text-[14px] font-medium text-[var(--ink)]">Your first article is being published…</p>
                </div>
              )}
            </div>
            <div className="pos-card p-4 mb-4">
              <p className="pos-num text-2xl text-[var(--green)]">{creditsLeft ?? 10}</p>
              <p className="text-[13px] text-[var(--muted)] mt-0.5">AI credits, ready to use</p>
            </div>
            <div className="pos-card p-4 mb-5">
              <p className="text-[14px] font-semibold text-[var(--ink)]">Optional: connect Google Search Console</p>
              <p className="text-[13px] text-[var(--muted)] mt-0.5">See the searches your site starts appearing for. You can do this anytime.</p>
            </div>
            <button onClick={next} className="pos-action">Set up Google Business Profile →</button>
            <p className="text-[12px] text-[var(--muted)] mt-3">Next up: your Google Business Profile setup.</p>
          </div>
        )}

        {/* STEP: google (GBP setup task flow) */}
        {st.id === 'google' && (
          <div>
            <p className="pos-label" style={{ color: 'var(--green)' }}>Google Business Profile</p>
            <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1 mb-1.5" style={{ letterSpacing: '-0.02em' }}>Set up your Google Business Profile</h1>
            <p className="text-sm text-[var(--muted)] mb-4">You will set up your own GBP account and make changes in that. We will guide you, provide content suggestions and mark which fields are dangerous <b>before</b> you touch them. Start with the mandatory block.</p>

            {/* The guide handles its own Back / Next / Skip / Finish — finishing
                the last block advances to the commitment check. */}
            <GbpGuide onDone={next} />
            <p className="text-[12px] text-[var(--muted)] mt-3">Next up: the commitment check and Get Access.</p>
          </div>
        )}

        {/* STEP: quiz → Get Access */}
        {st.id === 'quiz' && (
          quizPhase === 'milestone' ? (
            // MILESTONE — "You're ready to appear" ladder, before the commitment check.
            <div>
              <p className="pos-label" style={{ color: 'var(--orange)' }}>Milestone</p>
              <h1 className="text-[26px] font-semibold text-[var(--ink)] mt-1 mb-2" style={{ letterSpacing: '-0.02em' }}>You are ready to appear.</h1>
              <p className="text-[15px] text-[var(--muted)] mb-5" style={{ lineHeight: 1.6, maxWidth: '60ch' }}>Your website and Google Business Profile are live. Patients searching for you can now find your practice. That part is done. Next: compete and dominate — we help you publish new content, consistently, on your website and your Google Business Profile, so you show up for more searches across Google.</p>
              <div className="grid gap-2.5 mb-6">
                {[
                  { tag: 'Done', title: 'Appear', sub: 'Your website is live. Your Google Business Profile is set up. Patients can find you.', done: true },
                  { tag: 'Next', title: 'Compete and dominate', sub: 'We help you publish new content, consistently, on your website and your Google Business Profile — so you show up for more searches over time.' },
                ].map((r) => (
                  <div key={r.title} className="pos-card p-4 flex items-start gap-3" style={{ borderColor: r.done ? 'var(--green)' : 'var(--rule)', background: r.done ? 'var(--green-soft)' : 'var(--card)' }}>
                    <span className="pos-label shrink-0" style={{ padding: '3px 8px', borderRadius: 6, background: r.done ? 'var(--green)' : 'var(--rule-soft)', color: r.done ? '#fff' : 'var(--muted)' }}>{r.tag}</span>
                    <div>
                      <p className="text-[15px] font-semibold text-[var(--ink)]">{r.title}</p>
                      <p className="text-[13px] text-[var(--muted)] mt-0.5">{r.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[14px] text-[var(--ink)] font-medium mb-3">If you&apos;re ready, answer three questions.</p>
              <button onClick={() => { setQuizIdx(0); setQuizFailed(false); setQuizPhase('quiz'); }} className="pos-action">I am ready</button>
              <button onClick={() => go(step - 1)} className="pos-link text-sm mt-5 block" style={{ color: 'var(--muted)' }}>← Back</button>
            </div>
          ) : quizPhase === 'ready' ? (
            // ALL THREE · YES — the early-access offer, before the application form.
            <div>
              <h1 className="text-[26px] font-semibold text-[var(--ink)] mt-1 mb-2" style={{ letterSpacing: '-0.02em' }}>You&apos;re a fit. Get early access.</h1>
              <p className="text-[15px] text-[var(--muted)] mb-5" style={{ lineHeight: 1.6, maxWidth: '58ch' }}>Here&apos;s what early access gives you.</p>
              <div className="pos-card p-5 mb-5" style={{ background: 'var(--green-soft)', borderColor: 'var(--green)' }}>
                <p className="pos-label" style={{ color: 'var(--green)' }}>Early access · Founder price</p>
                <p className="text-[22px] font-semibold text-[var(--ink)] mt-1" style={{ letterSpacing: '-0.02em' }}>No cost <span className="text-[15px] font-normal text-[var(--muted)]">for the first 4 weeks</span></p>
                <p className="text-[13px] text-[var(--muted)] mt-0.5">Then ₹5,000 for 4 weeks — founder price, locked in.</p>
                <div className="mt-4 space-y-2">
                  {[
                    'Full Dominate Organic Search access for the first 4 weeks, at no cost.',
                    'After that, ₹5,000 per 4 weeks — the founder price, locked in for as long as you stay.',
                    'No bulk payment. Cancel anytime, finish the running 4 weeks.',
                    'Your website, content and Control Center stay yours either way.',
                  ].map((t) => (
                    <p key={t} className="text-[13.5px] text-[var(--ink)] flex gap-2" style={{ lineHeight: 1.5 }}><span style={{ color: 'var(--green)' }}>✓</span>{t}</p>
                  ))}
                </div>
              </div>
              <p className="pos-label mb-3" style={{ color: 'var(--muted)' }}>Short application · one question at a time · reviewed by Dr Yuvaraj</p>
              <button onClick={proceedToApplication} className="pos-action">Get Early Access →</button>
              <button onClick={goToControlCenter} className="pos-link text-sm mt-4 block" style={{ color: 'var(--ink)' }}>I don&apos;t want access — take me to Control Center →</button>
              <button onClick={() => setQuizPhase('milestone')} className="pos-link text-sm mt-3 block" style={{ color: 'var(--muted)' }}>← Back</button>
            </div>
          ) : quizFailed ? (
            <div>
              <p className="pos-label" style={{ color: 'var(--orange)' }}>Not yet</p>
              <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1 mb-2" style={{ letterSpacing: '-0.02em' }}>Access needs a yes to the first two.</h1>
              <p className="text-sm text-[var(--muted)] mb-5" style={{ maxWidth: '52ch' }}>Organic search is a long mission, not a sprint. Your website, first article and Google foundation stay yours either way — come back when the 60 minutes a week are genuinely available.</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => { setQuizIdx(0); setQuizFailed(false); }} className="pos-action">Answer again</button>
                <button onClick={goToControlCenter} className="pos-card px-4 py-3 text-[15px] font-medium" style={{ color: 'var(--ink)' }}>Go to Control Center →</button>
              </div>
            </div>
          ) : (
            <div>
              <p className="pos-label" style={{ color: 'var(--green)' }}>Commitment check · {quizIdx + 1} of 3</p>
              <div className="pos-meter my-3"><span style={{ width: `${Math.round(((quizIdx) / 3) * 100)}%` }} /></div>
              <h1 className="text-[23px] font-semibold text-[var(--ink)] mt-1 mb-2" style={{ letterSpacing: '-0.02em' }}>{QUIZ[quizIdx].title}</h1>
              <p className="text-sm text-[var(--muted)] mb-5" style={{ lineHeight: 1.6 }}>{QUIZ[quizIdx].body}</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => { if (quizIdx >= QUIZ.length - 1) setQuizPhase('ready'); else setQuizIdx(quizIdx + 1); }}
                  className="pos-action" style={{ flex: '1 1 200px' }}>
                  {QUIZ[quizIdx].yes}
                </button>
                <button
                  onClick={() => {
                    // Optional questions (e.g. buying a custom domain) don't block
                    // access — a "no" simply moves on.
                    if (QUIZ[quizIdx].mandatory) { setQuizFailed(true); return; }
                    if (quizIdx >= QUIZ.length - 1) setQuizPhase('ready'); else setQuizIdx(quizIdx + 1);
                  }}
                  className="pos-card px-4 py-3 text-[15px] font-medium text-[var(--muted)]" style={{ flex: '1 1 200px' }}>
                  {QUIZ[quizIdx].no}
                </button>
              </div>
              <button onClick={() => { if (quizIdx > 0) setQuizIdx(quizIdx - 1); else setQuizPhase('milestone'); }} className="pos-link text-sm mt-5">← Back</button>
            </div>
          )
        )}

        {/* Back — only within the editable PROFILE steps */}
        {st.phase === 0 && step > 0 && st.id !== 'summary' && (
          <button onClick={() => go(step - 1)} disabled={!!busy} className="pos-link text-sm mt-6 disabled:opacity-40">← Back</button>
        )}
        </div>
      </main>

      <div className="px-5 pb-10 pt-1 text-center">
        <button onClick={() => router.push('/')} className="text-[13.5px] hover:underline" style={{ color: 'var(--muted)' }}>Back to the CuraGo site</button>
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
