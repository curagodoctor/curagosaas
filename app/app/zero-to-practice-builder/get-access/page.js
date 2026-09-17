'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PosNav from '@/components/practice-os/PosNav';

// §11/§C — the early-access application. One question per page with a progress
// bar; the founder reviews the answers and grants access. States: questionnaire
// / submitted / pending / granted.
const QUESTIONS = [
  { id: 'location', type: 'text', q: 'Where is your clinic located?', ph: 'City, area' },
  { id: 'specialty', type: 'text', q: 'What is your specialty?', ph: 'e.g. Surgical gastroenterology' },
  { id: 'practice_status', type: 'choice', q: 'Your current clinical practice status', options: ['Own clinic', 'Rented or shared clinic', 'Setting up', 'None of the above'] },
  { id: 'gbp_status', type: 'choice', q: 'Do you currently have a Google Business Profile?', options: ['No', 'Yes, but inactive', 'Yes, active'] },
  { id: 'website_status', type: 'choice', q: 'Do you currently have a website?', options: ['No', 'Yes, outdated', 'Yes, active'] },
  { id: 'buy_domain', type: 'choice', q: 'Are you willing to purchase your own domain as part of this process?', options: ['Yes', 'No'] },
  { id: 'results_timeline', type: 'text', q: 'How soon are you expecting results to show up when it comes to organic search?', ph: 'Your honest expectation' },
  { id: 'time_fit', type: 'choice', q: 'Beyond setup, this is an ongoing commitment — about 10 minutes a day, or roughly 60 minutes a week, for several months. How will you realistically fit that in?', options: ['Daily', 'Every other day', 'Weekly'] },
  { id: 'long_horizon', type: 'choice', q: 'Do you see yourself working on this for months to years before any visible results?', options: ['Yes', 'No', 'Not sure'] },
  { id: 'stop_reason', type: 'textarea', q: 'What would realistically make you stop before that?' },
  { id: 'perception', type: 'textarea', q: "What is your honest perception of digital presence for doctors right now — necessary, overrated, or something you haven\'t fully figured out yet?" },
  { id: 'fix_first', type: 'textarea', q: 'If you had to fix one thing first — your GBP, your website, or your reviews — which would it be, and why?' },
  { id: 'tier_matters', type: 'textarea', q: 'Do you think organic search actually matters for a practice in a tier 2 or tier 3 city, or is it mainly a metro thing in your view?' },
  { id: 'onetime_or_ongoing', type: 'textarea', q: 'Do you see this as a one-time fix, or something that needs ongoing maintenance? Be honest — what you actually believe, not what sounds right.' },
  { id: 'biggest_challenge', type: 'textarea', q: 'What is the single biggest challenge you personally face with Google or online visibility for your practice?' },
  { id: 'change_one_thing', type: 'textarea', q: 'If you could change one thing about how doctors currently handle their online presence, what would it be?' },
  { id: 'why_founding', type: 'textarea', q: 'Why should you be one of the 5 founding doctors?', note: 'Minimum 400 characters — this matters, please don\'t rush it.', minChars: 400 },
  { id: 'agreement', type: 'agreement', q: 'Case Study Participation Agreement',
    text: 'I understand Dominate Organic Search is provided to me at no cost for a month as part of a founding case study, not a giveaway. I agree to genuinely implement the system on my own practice. If my account goes dormant, CuraGo will personally reach out to help me get back on track. If I still do not engage after that, my access will be withdrawn. I agree to provide honest feedback during the process, and I consent to CuraGo using my feedback, testimonials, screenshots, and results for website content, educational, marketing, and case-study purposes.',
    agree: 'I Agree' },
];

export default function GetAccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState(null); // 'none' | 'pending' | 'granted' | 'denied'
  const [access, setAccess] = useState({});
  const [prefill, setPrefill] = useState({});
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/practice-os/access-request', { credentials: 'include' });
      if (res.status === 401) { router.push('/login?entry=practice-os'); return; }
      const d = await res.json();
      setStatus(d.status || 'none');
      setAccess(d.access || {});
      setPrefill(d.prefill || {});
      setAnswers((a) => ({ specialty: d.prefill?.specialty || '', ...a }));
    } catch { setStatus('none'); }
  }, [router]);
  useEffect(() => { load(); }, [load]);

  const q = QUESTIONS[idx];
  const val = answers[q?.id];
  const answered = q ? (q.type === 'agreement' ? val === true : String(val ?? '').trim().length >= (q.minChars || 1)) : false;
  const setA = (v) => setAnswers((a) => ({ ...a, [q.id]: v }));
  const back = () => { setError(''); if (idx > 0) setIdx(idx - 1); };
  const signOut = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch { /* ignore */ }
    router.push('/login?entry=practice-os');
  };
  const advance = () => {
    setError('');
    if (!answered) { setError(q.minChars ? `Please write at least ${q.minChars} characters.` : 'Please answer to continue.'); return; }
    if (idx < QUESTIONS.length - 1) setIdx(idx + 1); else submit();
  };
  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/practice-os/access-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ answers, name: prefill.name, phone: prefill.phone, specialty: answers.specialty }),
      });
      const d = await res.json();
      if (d.success) {
        // Submitting the qualifying application is the true end of onboarding —
        // only now does the control center stop sending them back to the wizard.
        try {
          await fetch('/api/practice-os/profile', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({ onboardComplete: true }),
          });
        } catch { /* non-blocking */ }
        setSubmitted(true);
      }
      else setError(d.error || 'Could not submit. Please try again.');
    } catch { setError('Something went wrong.'); }
    finally { setSubmitting(false); }
  };

  const pct = Math.round(((idx + 1) / QUESTIONS.length) * 100);

  return (
    <div className="max-w-2xl mx-auto px-5 pt-[64px] pb-10">
      <PosNav breadcrumb="Early access" />

      {status === null && <p className="text-sm text-[var(--muted)] mt-8">Loading…</p>}

      {status === 'granted' && <GrantedActions router={router} access={access} />}

      {status === 'pending' && (
        <div className="mt-8"><div className="pos-card p-6" style={{ borderColor: 'var(--orange)' }}>
          <p className="pos-label" style={{ color: 'var(--orange)' }}>Application received</p>
          <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1" style={{ letterSpacing: '-0.02em' }}>We&apos;re reviewing your answers</h1>
          <p className="text-sm text-[var(--muted)] mt-2" style={{ maxWidth: '52ch' }}>We&apos;ll review your answers and, if you&apos;re a fit for the founding cohort, reach out within 24 hours. In the meantime, keep your setup polished.</p>
          <button onClick={() => router.push('/app/zero-to-practice-builder')} className="pos-link mt-4" style={{ fontSize: 14 }}>Go to control center →</button>
        </div></div>
      )}

      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: 'rgba(16,26,19,.45)' }}>
          <div className="pos-card p-7 max-w-md w-full text-center" style={{ background: 'var(--card)' }}>
            <div className="w-12 h-12 rounded-full grid place-items-center mx-auto mb-3" style={{ background: 'var(--green-soft)', color: 'var(--green)', fontSize: 22 }}>✓</div>
            <h2 className="text-[22px] font-semibold text-[var(--ink)]" style={{ letterSpacing: '-0.02em' }}>Application submitted</h2>
            <p className="text-sm text-[var(--muted)] mt-2" style={{ lineHeight: 1.6 }}>Thank you. I&apos;ll personally review your answers, and if you fit our criteria for the founding cohort, we&apos;ll reach out to you within 24 hours.</p>
            <button onClick={() => router.push('/app/zero-to-practice-builder')} className="pos-action mt-5 w-full">Go to my control center</button>
          </div>
        </div>
      )}

      {(status === 'none' || status === 'denied') && !submitted && q && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="pos-label" style={{ color: 'var(--green)' }}>Question {idx + 1} of {QUESTIONS.length}</span>
            <button onClick={signOut} className="pos-link text-[13px]" style={{ color: 'var(--muted)' }}>Sign out</button>
          </div>
          <div className="pos-meter mb-6"><span style={{ width: `${pct}%` }} /></div>

          <div className="pos-card p-6">
            <h1 className="text-[21px] font-semibold text-[var(--ink)]" style={{ letterSpacing: '-0.01em', lineHeight: 1.25 }}>{q.q}</h1>
            {q.note && <p className="text-[13px] text-[var(--orange)] mt-1.5">{q.note}</p>}

            <div className="mt-4">
              {q.type === 'text' && (
                <input autoFocus value={val || ''} onChange={(e) => setA(e.target.value)} placeholder={q.ph || ''}
                  onKeyDown={(e) => { if (e.key === 'Enter') advance(); }}
                  className="w-full rounded-[11px] px-3.5 py-3 text-[15px] outline-none" style={{ border: '1px solid var(--rule)', background: 'var(--paper)' }} />
              )}
              {q.type === 'textarea' && (
                <>
                  <textarea autoFocus value={val || ''} onChange={(e) => setA(e.target.value)} rows={5}
                    className="w-full rounded-[11px] px-3.5 py-3 text-[15px] outline-none" style={{ border: '1px solid var(--rule)', background: 'var(--paper)', lineHeight: 1.55 }} />
                  {q.minChars && <p className="text-[12px] mt-1.5" style={{ color: String(val || '').length >= q.minChars ? 'var(--green)' : 'var(--muted)' }}>{String(val || '').length} / {q.minChars} characters</p>}
                </>
              )}
              {q.type === 'choice' && (
                <div className="grid gap-2.5">
                  {q.options.map((opt) => (
                    <button key={opt} onClick={() => setA(opt)} className="pos-card p-3.5 text-left text-[15px] font-medium"
                      style={{ borderColor: val === opt ? 'var(--green)' : 'var(--rule)', background: val === opt ? 'var(--green-soft)' : 'var(--card)', color: 'var(--ink)' }}>{opt}</button>
                  ))}
                </div>
              )}
              {q.type === 'agreement' && (
                <div>
                  <p className="text-[13.5px] text-[var(--muted)]" style={{ lineHeight: 1.6 }}>{q.text}</p>
                  <label className="flex items-start gap-3 mt-4 cursor-pointer">
                    <input type="checkbox" checked={val === true} onChange={(e) => setA(e.target.checked)} className="mt-0.5 w-5 h-5 rounded" style={{ accentColor: 'var(--green)' }} />
                    <span className="text-[15px] font-semibold text-[var(--ink)]">{q.agree}</span>
                  </label>
                </div>
              )}
            </div>

            {error && <p className="text-[13px] text-red-600 mt-3">{error}</p>}
            <div className="flex items-center justify-between gap-3 mt-6">
              <button onClick={advance} disabled={submitting} className="pos-action">{submitting ? 'Submitting…' : idx < QUESTIONS.length - 1 ? 'Continue' : 'Submit application'}</button>
              {idx > 0 && <button onClick={back} disabled={submitting} className="pos-link text-sm" style={{ color: 'var(--muted)' }}>← Back</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// Granted state — access status + subscribe/renew (₹5,000/mo) + generate next page.
function GrantedActions({ router, access }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [subBusy, setSubBusy] = useState(false);

  const days = access?.expiresAt ? Math.ceil((new Date(access.expiresAt) - Date.now()) / (24 * 60 * 60 * 1000)) : null;
  const statusLine = access?.subscribed
    ? 'Your ₹5,000/mo subscription is active.'
    : access?.permanent
      ? 'Full access — enabled by CuraGo.'
      : days != null
        ? `Your free access ${days > 0 ? `runs for ${days} more day${days === 1 ? '' : 's'}` : 'has ended'} — subscribe to keep it going.`
        : 'Optimization is unlocked.';
  const showSubscribe = !access?.subscribed && !access?.permanent;

  const generateNext = async () => {
    setBusy(true); setMsg('');
    try {
      const res = await fetch('/api/practice-os/actions/generate-next-page', { method: 'POST', credentials: 'include' });
      const d = await res.json();
      if (d.success && d.id) { router.push(`/admin/dashboard/blog-articles/${d.id}`); return; }
      if (d.success && d.done) setMsg(d.message || "You've covered all your conditions.");
      else setMsg(d.message || d.error || 'Could not generate a page.');
    } catch { setMsg('Something went wrong.'); }
    finally { setBusy(false); }
  };

  const subscribe = async () => {
    setSubBusy(true); setMsg('');
    try {
      const d = await fetch('/api/practice-os/optimization/subscribe', { method: 'POST', credentials: 'include' }).then((r) => r.json());
      if (!d.success) { setMsg(d.error || 'Could not start the subscription.'); return; }
      const ok = await loadRazorpay();
      if (!ok) { setMsg('Could not load the payment window.'); return; }
      const rz = new window.Razorpay({
        key: d.keyId,
        subscription_id: d.subscriptionId,
        name: 'CuraGo — Dominate Organic Search',
        description: '₹5,000 / month',
        handler: async (resp) => {
          await fetch('/api/practice-os/optimization/verify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify(resp),
          });
          window.location.reload();
        },
        theme: { color: '#096b17' },
      });
      rz.open();
    } catch { setMsg('Something went wrong.'); }
    finally { setSubBusy(false); }
  };

  return (
    <div className="mt-8">
      <div className="pos-card p-6" style={{ borderColor: 'var(--green)', background: 'var(--green-soft)' }}>
        <p className="pos-label" style={{ color: 'var(--green)' }}>You&apos;re in</p>
        <h1 className="text-[24px] font-semibold text-[var(--ink)] mt-1" style={{ letterSpacing: '-0.02em' }}>Optimization is unlocked</h1>
        <p className="text-sm text-[var(--muted)] mt-2">{statusLine}</p>
        <p className="text-[13.5px] text-[var(--ink)] mt-3" style={{ maxWidth: '58ch' }}>First, review the diseases you treat and their treatments — this is what we build your pages, posts and GBP services from.</p>
        {msg && <p className="text-[13px] text-[var(--muted)] mt-3">{msg}</p>}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button onClick={() => router.push('/app/zero-to-practice-builder/clusters')} className="pos-action">Review my diseases &amp; treatments →</button>
          <button onClick={generateNext} disabled={busy} className="pos-card px-4 py-3 text-[14px] font-semibold" style={{ opacity: busy ? 0.5 : 1 }}>
            {busy ? 'Generating…' : '✨ Generate my next page'}
          </button>
          {showSubscribe && (
            <button onClick={subscribe} disabled={subBusy} className="pos-card px-4 py-3 text-[14px] font-semibold" style={{ borderColor: 'var(--orange)', color: 'var(--orange)' }}>
              {subBusy ? 'Opening…' : 'Subscribe · ₹5,000/mo'}
            </button>
          )}
          <button onClick={() => router.push('/app/zero-to-practice-builder')} className="pos-link" style={{ fontSize: 14 }}>Go to control center →</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea }) {
  return (
    <label className="block">
      <span className="pos-label">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="w-full pos-card p-2.5 text-sm mt-1.5" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full pos-card p-2.5 text-sm mt-1.5" />
      )}
    </label>
  );
}
