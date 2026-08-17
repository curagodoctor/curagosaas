'use client';

import { useState, useMemo, useRef } from 'react';
import { QUESTIONS, visibleQuestions } from '@/lib/cohortQuestions';

const CONTACT_WA = 'https://wa.me/917021227203?text=' + encodeURIComponent("Hi, I just finished the Zero to Practice Builder fit assessment and would like to speak with Dr Yuvaraj.");
const COHORT_START = 'August 15th';

// The conditional fit assessment. Renders one question at a time (branching via
// each question's showIf), then submits to compute the result and shows one of
// three outcome screens. `source` tags where the flow was entered from.
export default function Questionnaire({ source = 'landing' }) {
  const [answers, setAnswers] = useState({});
  const [currentId, setCurrentId] = useState(QUESTIONS[0].id);
  const [phase, setPhase] = useState('form'); // 'form' | 'result'
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState(null); // { result, reason, flags }
  const [error, setError] = useState('');
  const startedRef = useRef(false);

  const visible = useMemo(() => visibleQuestions(answers), [answers]);
  const idx = Math.max(0, visible.findIndex((q) => q.id === currentId));
  const q = visible[idx];
  const isLast = idx === visible.length - 1;

  const setAnswer = (id, value) => { setAnswers((a) => ({ ...a, [id]: value })); setError(''); };

  const answered = (question) => {
    const v = answers[question.id];
    if (question.type === 'multi') return Array.isArray(v) && v.length > 0;
    if (question.type === 'scale') return v != null && v !== '';
    return v != null && String(v).trim() !== '';
  };

  // Fire the "started" funnel event once we have a valid email.
  const maybeTrackStart = () => {
    if (startedRef.current) return;
    const email = answers.email;
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      startedRef.current = true;
      fetch('/api/cohort/assessment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', email, name: answers.name, source }),
      }).catch(() => {});
    }
  };

  const next = async () => {
    // Every question needs an answer except the multi-select and long-text ones —
    // so nobody can skip the qualifiers and land on a false "strong fit".
    const mustAnswer = q.required || ['single', 'scale', 'text', 'email', 'tel'].includes(q.type);
    if (mustAnswer && !answered(q)) { setError('Please answer to continue.'); return; }
    if (q.type === 'email' && answers[q.id] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers[q.id])) {
      setError('Please enter a valid email.'); return;
    }
    if (q.type === 'tel' && (String(answers[q.id] || '').replace(/\D/g, '').length < 10)) {
      setError('Please enter a valid phone number (at least 10 digits).'); return;
    }
    maybeTrackStart();
    if (isLast) return submit();
    const nextQ = visible[idx + 1];
    if (nextQ) setCurrentId(nextQ.id);
  };

  const back = () => { if (idx > 0) setCurrentId(visible[idx - 1].id); };

  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/cohort/assessment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', email: answers.email, name: answers.name, answers, source }),
      });
      const data = await res.json();
      if (data.success) { setOutcome(data); setPhase('result'); }
      else setError(data.error || 'Something went wrong.');
    } catch { setError('Something went wrong.'); }
    finally { setSubmitting(false); }
  };

  if (phase === 'result' && outcome) {
    return <Result outcome={outcome} email={answers.email} name={answers.name} />;
  }

  const pct = Math.round(((idx + 1) / visible.length) * 100);

  return (
    <div className="w-full max-w-xl">
      <div className="flex items-center justify-between mb-2 text-[12px]" style={{ color: 'rgba(255,255,255,.55)' }}>
        <span className="font-mono tracking-widest">{q.section?.toUpperCase()}</span>
        <span>{idx + 1} / {visible.length}</span>
      </div>
      <div className="h-1.5 rounded-full mb-7" style={{ background: 'rgba(255,255,255,.12)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#F26A1B', transition: 'width .3s' }} />
      </div>

      <h1 className="text-[20px] sm:text-[24px] font-bold leading-snug" style={{ letterSpacing: '-0.01em' }}>{q.title}</h1>
      {q.help && <p className="text-[14px] mt-2" style={{ color: 'rgba(255,255,255,.6)' }}>{q.help}</p>}

      <div className="mt-6">
        <QuestionInput q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} onEnter={next} />
      </div>

      {error && <p className="text-[13px] mt-3" style={{ color: '#ffb4a0' }}>{error}</p>}

      <div className="mt-8 flex items-center justify-between">
        <button onClick={back} disabled={idx === 0} className="text-[14px] disabled:opacity-30" style={{ color: 'rgba(255,255,255,.6)' }}>← Back</button>
        <button onClick={next} disabled={submitting} className="font-semibold text-[15px] px-6 py-3 rounded-xl" style={{ background: '#F26A1B', color: '#fff', opacity: submitting ? 0.6 : 1 }}>
          {submitting ? 'Checking…' : (isLast ? 'See my result' : 'Continue →')}
        </button>
      </div>
    </div>
  );
}

function QuestionInput({ q, value, onChange, onEnter }) {
  if (q.type === 'text' || q.type === 'email' || q.type === 'tel') {
    return (
      <input
        type={q.type === 'email' ? 'email' : q.type === 'tel' ? 'tel' : 'text'}
        inputMode={q.type === 'tel' ? 'tel' : undefined}
        value={value || ''}
        // Phone accepts only digits and +, - , space — no letters.
        onChange={(e) => onChange(q.type === 'tel' ? e.target.value.replace(/[^\d+\-\s]/g, '') : e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onEnter(); }}
        autoFocus
        placeholder={q.type === 'email' ? 'you@example.com' : q.type === 'tel' ? '+91 …' : 'Type your answer'}
        className="w-full rounded-xl px-4 py-3 text-[16px] outline-none"
        style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.15)', color: '#fff' }}
      />
    );
  }
  if (q.type === 'longtext') {
    return (
      <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={4} autoFocus placeholder="Type your answer"
        className="w-full rounded-xl px-4 py-3 text-[15px] outline-none resize-y"
        style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.15)', color: '#fff' }} />
    );
  }
  if (q.type === 'scale') {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: (q.max || 10) - (q.min || 1) + 1 }, (_, i) => (q.min || 1) + i).map((n) => {
          const on = Number(value) === n;
          return (
            <button key={n} type="button" onClick={() => onChange(n)}
              className="w-11 h-11 rounded-lg font-semibold text-[15px]"
              style={{ background: on ? '#F26A1B' : 'rgba(255,255,255,.06)', border: `1px solid ${on ? '#F26A1B' : 'rgba(255,255,255,.15)'}`, color: '#fff' }}>
              {n}
            </button>
          );
        })}
      </div>
    );
  }
  // single / multi
  const selected = q.type === 'multi' ? (Array.isArray(value) ? value : []) : value;
  const toggle = (v) => {
    if (q.type === 'multi') {
      const arr = Array.isArray(value) ? value : [];
      if (arr.includes(v)) onChange(arr.filter((x) => x !== v));
      else if (!q.max || arr.length < q.max) onChange([...arr, v]);
    } else onChange(v);
  };
  return (
    <div className="flex flex-col gap-2">
      {q.options.map((o) => {
        const on = q.type === 'multi' ? selected.includes(o.value) : selected === o.value;
        return (
          <button key={o.value} type="button" onClick={() => toggle(o.value)}
            className="text-left rounded-xl px-4 py-3 text-[15px] transition-colors flex items-center gap-3"
            style={{ background: on ? 'rgba(242,106,27,.15)' : 'rgba(255,255,255,.05)', border: `1px solid ${on ? '#F26A1B' : 'rgba(255,255,255,.13)'}`, color: '#fff' }}>
            <span className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center" style={{ border: `1px solid ${on ? '#F26A1B' : 'rgba(255,255,255,.3)'}`, background: on ? '#F26A1B' : 'transparent' }}>
              {on && <svg className="w-3 h-3" fill="none" stroke="#fff" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </span>
            {o.label}
          </button>
        );
      })}
      {q.max && <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,.45)' }}>Choose up to {q.max}.</p>}
    </div>
  );
}

function Result({ outcome, email, name }) {
  const [popup, setPopup] = useState(false);
  const go = (path, chosenPath) => {
    fetch('/api/cohort/assessment', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', email, chosenPath }),
    }).catch(() => {});
    if (chosenPath === 'cohort') { setPopup(true); return; }
    window.location.href = path;
  };

  const meta = {
    strong_fit: { dot: '#3fbf5f', label: 'Strong fit', title: 'You appear to be a strong fit for the Zero to Practice Builder.' },
    maybe: { dot: '#f2c317', label: 'Founder review', title: 'You may benefit from the Builder — your situation needs a little more context.' },
    not_fit: { dot: '#e0503f', label: 'Not the best cohort fit right now', title: 'The 28-day cohort may not be the best fit for you right now.' },
  }[outcome.result];
  const meaning = {
    strong_fit: "You have the time, the intent and the willingness to execute — so you're set up to get real value from the 28-day cohort. Joining now locks the founding price.",
    maybe: "You could get real value, but one or two things are worth a short conversation so we can be sure the cohort is the right format for you right now.",
    not_fit: 'The 28-day cohort may not give you enough value at this stage — usually down to time, execution capacity, or where your practice is right now. That is not a no to the software or to building your practice.',
  }[outcome.result];
  const positives = outcome.flags?.positive || [];
  const concerns = [...(outcome.flags?.hard || []), ...(outcome.flags?.maybe || [])];

  return (
    <div className="w-full max-w-xl text-center">
      <span className="inline-flex items-center gap-2 text-[12px] font-mono tracking-widest mb-4" style={{ color: 'rgba(255,255,255,.6)' }}>
        <span className="w-3 h-3 rounded-full" style={{ background: meta.dot }} /> {meta.label.toUpperCase()}
      </span>
      <h1 className="text-[24px] sm:text-[30px] font-bold leading-tight mb-5" style={{ letterSpacing: '-0.02em' }}>{meta.title}</h1>

      {/* What we noticed + what it means — every observation shown, not just one. */}
      <div className="text-left rounded-2xl p-5 mb-6" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)' }}>
        <p className="text-[11px] font-mono uppercase tracking-widest mb-3" style={{ color: '#8fe6ae' }}>What we noticed about your practice</p>
        <ul className="space-y-2 mb-5">
          {positives.map((t, i) => (
            <li key={`p${i}`} className="flex items-start gap-2.5 text-[13.5px] leading-snug" style={{ color: 'rgba(255,255,255,.85)' }}>
              <span className="mt-0.5" style={{ color: '#3fbf5f' }}>✓</span><span>{t}</span>
            </li>
          ))}
          {concerns.map((t, i) => (
            <li key={`c${i}`} className="flex items-start gap-2.5 text-[13.5px] leading-snug" style={{ color: 'rgba(255,255,255,.72)' }}>
              <span className="mt-0.5" style={{ color: outcome.result === 'not_fit' ? '#e0503f' : '#f2c317' }}>•</span><span>{t}</span>
            </li>
          ))}
          {positives.length === 0 && concerns.length === 0 && (
            <li className="text-[13.5px]" style={{ color: 'rgba(255,255,255,.6)' }}>Based on your answers.</li>
          )}
        </ul>
        <p className="text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#8fe6ae' }}>What that means for you</p>
        <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,.85)' }}>{meaning}</p>
      </div>

      {outcome.result === 'strong_fit' && (
        <>
          <p className="text-[15px] mb-7" style={{ color: 'rgba(255,255,255,.7)' }}>
            The First Founding Cohort starts <strong style={{ color: '#fff' }}>{COHORT_START}</strong>. Two ways forward:
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={() => go('/signup?entry=practice-os', 'cohort')} className="font-semibold text-[16px] px-6 py-4 rounded-xl" style={{ background: '#F26A1B', color: '#fff' }}>
              Join the First Founding Cohort →
            </button>
            <a href={CONTACT_WA} target="_blank" rel="noopener noreferrer" className="text-[14px] py-2" style={{ color: 'rgba(255,255,255,.7)' }}>
              Still unsure? Reach out to Dr Yuvaraj and schedule a short call →
            </a>
          </div>
        </>
      )}

      {outcome.result === 'maybe' && (
        <>
          <p className="text-[15px] mb-7" style={{ color: 'rgba(255,255,255,.7)' }}>Dr Yuvaraj will help determine whether the cohort is the right format for you.</p>
          <div className="flex flex-col gap-3">
            <a href={CONTACT_WA} target="_blank" rel="noopener noreferrer" className="font-semibold text-[16px] px-6 py-4 rounded-xl" style={{ background: '#F26A1B', color: '#fff' }}>
              Schedule a call with Dr Yuvaraj →
            </a>
            <button onClick={() => go('/signup?entry=practice-os', 'builder_only')} className="text-[14px] py-2 underline" style={{ color: 'rgba(255,255,255,.75)' }}>
              I don&apos;t want to join the cohort, but I want to sign up for the Practice / Website Builder
            </button>
          </div>
        </>
      )}

      {outcome.result === 'not_fit' && (
        <>
          <p className="text-[14px] mb-7" style={{ color: 'rgba(255,255,255,.7)' }}>If you&apos;d still like to go ahead, you&apos;re welcome to.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => go('/signup?entry=practice-os', 'builder_only')} className="font-semibold text-[15px] px-6 py-4 rounded-xl" style={{ background: '#F26A1B', color: '#fff' }}>
              Explore the software / sign up anyway →
            </button>
            <a href={CONTACT_WA} target="_blank" rel="noopener noreferrer" className="text-[14px] py-2" style={{ color: 'rgba(255,255,255,.7)' }}>
              Speak with Dr Yuvaraj before deciding →
            </a>
          </div>
        </>
      )}

      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.6)' }}>
          <div className="rounded-2xl p-7 max-w-sm text-center" style={{ background: '#0c2515', border: '1px solid rgba(255,255,255,.15)' }}>
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: '#0E6B25' }}>
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-[20px] font-bold mb-2">You&apos;re on the list{name ? `, ${String(name).split(' ')[0]}` : ''}!</h2>
            <p className="text-[14px] mb-6" style={{ color: 'rgba(255,255,255,.7)' }}>
              We&apos;ll reach out to onboard you into the {COHORT_START} cohort. Next, create your account — you can complete payment from your control center.
            </p>
            <button onClick={() => { window.location.href = '/signup?entry=practice-os'; }} className="w-full font-semibold text-[15px] px-6 py-3 rounded-xl" style={{ background: '#F26A1B', color: '#fff' }}>
              Create my account →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
