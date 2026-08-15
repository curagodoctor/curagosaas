'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WorkspaceDrawer from '@/components/practice-os/WorkspaceDrawer';
import ChatAssistant from '@/components/practice-os/ChatAssistant';
import { SCORE_LABELS } from '../../_score';
import { LeaderboardPrompt } from '../../_username';

const WINDOWS = [
  { id: 'morning', label: 'Morning', hint: '6–12' },
  { id: 'afternoon', label: 'Afternoon', hint: '12–5' },
  { id: 'evening', label: 'Evening', hint: '5–9' },
  { id: 'night', label: 'Night', hint: '9–12' },
];

// WhatsApp support — the "Request assistance" button on each module opens this.
const WA_SUPPORT = '917021227203';
function supportLink(text) {
  return `https://wa.me/${WA_SUPPORT}?text=${encodeURIComponent(text)}`;
}
// Client-side {{variable}} fill so values entered THIS session (earlier modules)
// show inline in a later module's prompt without a page reload.
function fillVars(text, vars) {
  return String(text || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) =>
    (vars[k] != null && String(vars[k]).trim() ? String(vars[k]).trim() : ''));
}

// ---- Cross-device Focus draft helpers (#17, #18) ----
// A server draft is only usable if it actually holds something.
function normalizeDraft(d) {
  if (!d) return null;
  const hasContent = d.inputVals || d.stepChecks || d.reflection || d.kpiValues
    || typeof d.remaining === 'number' || typeof d.index === 'number';
  if (!hasContent) return null;
  return { ...d, _stamp: d.timerUpdatedAt || d.updatedAt || null };
}
// This device's local mirror (used only when the server has no draft yet).
function readLocalDraft(id) {
  try {
    const raw = window.localStorage.getItem(`pos-focus-${id}`);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return { ...d, _stamp: d.ts ? new Date(d.ts).toISOString() : null };
  } catch { return null; }
}
// Reconstruct the countdown: seconds remaining at the last save, minus the
// wall-clock elapsed since (only if it was running), so the timer is the same on
// any device without saving every second.
function reconstructRemaining(draft, fallbackSeconds) {
  let rem = typeof draft.remaining === 'number' ? draft.remaining : fallbackSeconds;
  // Add back only the SHORT gap since the last heartbeat (saved every ~12s while
  // the tab is open). A larger gap means the tab was closed — that time isn't work
  // time, so we cap it. Otherwise reopening after a day would show hundreds of
  // minutes of phantom "overtime" (e.g. +1483:39).
  if (draft.running && draft._stamp) {
    const elapsed = Math.floor((Date.now() - new Date(draft._stamp).getTime()) / 1000);
    if (Number.isFinite(elapsed) && elapsed > 0) rem -= Math.min(elapsed, 30);
  }
  return rem;
}

// The mission workspace — step through the mission's modules one at a time.
// Finishing the last module completes the mission and shows the celebration.
function FocusSession() {
  const { id } = useParams();
  const router = useRouter();
  const params = useSearchParams();
  const packId = params.get('pack');
  const startNow = params.get('start') === '1';   // from the track "Start mission" — skip the intro

  const [day, setDay] = useState(null);
  const [modules, setModules] = useState([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('intro');         // 'intro' | 'work' | 'celebrate'
  const [remaining, setRemaining] = useState(0);       // countdown seconds; negative = overtime
  const [paused, setPaused] = useState(false);
  const [inputVals, setInputVals] = useState({});      // { [moduleId]: { [inputId]: value } }
  const [stepChecks, setStepChecks] = useState({});    // { [moduleId]: { [stepIndex]: true } }
  const [inputError, setInputError] = useState('');    // required-input validation message
  // Gathered on the final module only.
  const [reflection, setReflection] = useState({ confidence: 0, learning: '', challenge: '' });
  const [kpiValues, setKpiValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);          // completion summary
  const [tomorrow, setTomorrow] = useState(null);
  const [commit, setCommit] = useState({ window: 'evening', exactTime: '', dayOffset: 1 });
  const [packTitle, setPackTitle] = useState('');
  const [finalMinutes, setFinalMinutes] = useState(0);   // captured for the celebration screen
  const startedRef = useRef(false);

  useEffect(() => {
    if (!packId) { router.replace('/app/zero-to-practice-builder'); return; }
    (async () => {
      const res = await fetch(`/api/practice-os/day/${id}`);
      const data = await res.json();
      if (data.success) {
        // Finished (or skipped) on another device? Don't allow re-editing — the
        // server is the source of truth, so send them back to the pack. (#17)
        if (data.progress?.status === 'completed' || data.progress?.status === 'skipped') {
          router.replace(`/app/zero-to-practice-builder/track?pack=${packId}`);
          return;
        }
        setDay(data.day);
        const mods = data.modules || [];
        setModules(mods);
        const done = new Set(data.progress?.completedModuleIds || []);
        const firstIncomplete = mods.findIndex((m) => !done.has(m.id));
        // Module position ALWAYS follows server completion — a module finished on
        // another device is never shown as editable here. (#17)
        setIndex(firstIncomplete === -1 ? Math.max(0, mods.length - 1) : firstIncomplete);

        // The cross-device draft: prefer the server's, fall back to this device's
        // local mirror if the server has none yet. (#17, #18)
        const estSeconds = (data.day.estimatedMinutes || 35) * 60;
        const sd = normalizeDraft(data.progress?.draft) || readLocalDraft(id);
        if (sd) {
          if (sd.inputVals) setInputVals(sd.inputVals);
          if (sd.stepChecks) setStepChecks(sd.stepChecks);
          if (sd.reflection) setReflection(sd.reflection);
          if (sd.kpiValues) setKpiValues(sd.kpiValues);
          setRemaining(reconstructRemaining(sd, estSeconds));
        } else {
          setRemaining(estSeconds);   // countdown starts from the estimate
        }
        restoredRef.current = true;
        // Resume straight into the workspace if they've already started this mission,
        // if the track sent us here with ?start=1, or if a draft exists.
        if (done.size > 0 || startNow || sd) setPhase('work');
      }
      if (!startedRef.current) {
        startedRef.current = true;
        fetch(`/api/practice-os/day/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start' }) });
      }
    })();
  }, [id, packId, router, startNow]);

  // Mission countdown from the estimate. Pausable; ticks into negative (overtime)
  // and is never penalised for running long. One timer for the whole mission.
  useEffect(() => {
    if (phase !== 'work' || paused) return;
    const t = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(t);
  }, [phase, paused]);

  // Cross-device draft (inputs, ticked steps, module position, timer). Restored in
  // the load effect above from the SERVER (falling back to this device's local
  // mirror), then pushed back to the server so laptop & phone stay in sync. (#17,#18)
  const restoredRef = useRef(false);
  const latest = useRef({});
  latest.current = { inputVals, stepChecks, reflection, kpiValues, index, remaining, paused };

  const pushDraft = useCallback(() => {
    if (!restoredRef.current) return;
    const s = latest.current;
    const draft = {
      inputVals: s.inputVals, stepChecks: s.stepChecks, reflection: s.reflection,
      kpiValues: s.kpiValues, index: s.index, remaining: s.remaining, running: !s.paused,
    };
    // Local mirror (offline fallback), stamped so the timer can be reconstructed.
    try { window.localStorage.setItem(`pos-focus-${id}`, JSON.stringify({ ...draft, ts: Date.now() })); } catch { /* ignore */ }
    fetch(`/api/practice-os/day/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save-draft', draft }), keepalive: true,
    }).catch(() => { /* ignore transient network errors */ });
  }, [id]);

  // Save shortly after any meaningful change.
  useEffect(() => {
    if (!restoredRef.current || phase !== 'work') return;
    const t = setTimeout(pushDraft, 1200);
    return () => clearTimeout(t);
  }, [inputVals, stepChecks, reflection, kpiValues, index, paused, phase, pushDraft]);

  // Heartbeat so a running timer stays fresh on the server (reconstructed on the
  // other device), and a final save when the tab is hidden/closed.
  useEffect(() => {
    if (phase !== 'work') return;
    const beat = setInterval(pushDraft, 12000);
    const onHide = () => { if (document.visibilityState === 'hidden') pushDraft(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', pushDraft);
    return () => {
      clearInterval(beat);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', pushDraft);
    };
  }, [phase, pushDraft]);

  const mod = modules[index] || null;
  const isLast = modules.length > 0 && index === modules.length - 1;

  const setInput = (moduleId, inputId, v) => {
    setInputError('');
    setInputVals((s) => ({ ...s, [moduleId]: { ...(s[moduleId] || {}), [inputId]: v } }));
  };

  const toggleStep = (moduleId, i) => {
    setStepChecks((s) => {
      const mod = { ...(s[moduleId] || {}) };
      if (mod[i]) delete mod[i]; else mod[i] = true;
      return { ...s, [moduleId]: mod };
    });
  };

  const finishModule = useCallback(async () => {
    if (!mod) return;

    const vals = inputVals[mod.id] || {};

    // Block completion until every required (compulsory) input is filled.
    const missing = (mod.inputs || []).filter((f) => f.required && !String(vals[f.id] ?? '').trim());
    if (missing.length) {
      setInputError(`Please fill in: ${missing.map((f) => f.label).join(', ')}`);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setInputError('');

    setSaving(true);
    const estimateSeconds = (day.estimatedMinutes || 35) * 60;
    const actualMinutes = Math.max(0, Math.round((estimateSeconds - remaining) / 60));

    const inputs = {};                 // keyed by input id — the server maps to labels/variables
    for (const f of mod.inputs || []) {
      const v = vals[f.id];
      if (v != null && String(v).trim()) inputs[f.id] = v;
    }

    const body = { action: 'complete-module', moduleId: mod.id, inputs, actualMinutes };
    if (isLast) {
      body.reflection = reflection;
      body.kpis = (day.kpiFields || [])
        .map((f) => ({ key: f.key, label: f.label, unit: f.unit, value: kpiValues[f.key] }))
        .filter((k) => k.value !== '' && k.value !== undefined && k.value !== null);
    }

    const res = await fetch(`/api/practice-os/day/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await res.json();

    if (data.missionComplete) {
      try { window.localStorage.removeItem(`pos-focus-${id}`); } catch { /* ignore */ }
      setResult(data.completion);
      setFinalMinutes(actualMinutes);
      const st = await (await fetch(`/api/practice-os/state?pack=${packId}`)).json();
      setTomorrow(st.allComplete ? null : st.today);
      setPackTitle(st.pack?.title || '');
      setPhase('celebrate');
    } else {
      setIndex((i) => i + 1);
    }
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
    setSaving(false);
  }, [mod, inputVals, remaining, isLast, reflection, kpiValues, day, id, packId]);

  const setItAndGo = async () => {
    // Save the doctor's schedule for the next task (same day up to 2 days out).
    await fetch(`/api/practice-os/day/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set-schedule', dayOffset: commit.dayOffset, window: commit.window, exactTime: commit.exactTime }),
    });
    router.push(`/app/zero-to-practice-builder/track?pack=${packId}`);
  };

  if (!day || !mod) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;
  }

  // ---------- Today's Mission (overview / gate) ----------
  if (phase === 'intro') {
    const missionXp = modules.reduce((s, m) => s + (m.xp || 0), 0) || day.reward?.points || 0;
    return (
      <div className="min-h-screen px-4 sm:px-6 lg:px-10 py-6">
        <div className="max-w-6xl mx-auto">
          <Link href={`/app/zero-to-practice-builder/track?pack=${packId}`} className="pos-link text-sm">← Back to pack</Link>
          <p className="pos-label mt-3 mb-2">{day.category || 'Practice building'} · Day {day.missionNumber}</p>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-8">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="pos-label" style={{ background: 'var(--green)', color: '#fff', padding: '6px 14px', borderRadius: 99 }}>Day {day.missionNumber}</span>
                <span className="pos-label" style={{ background: 'var(--green-soft)', color: 'var(--green)', padding: '6px 14px', borderRadius: 99 }}>Today&apos;s mission</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {day.category && <Chip>{day.category}</Chip>}
                <Chip>⏱ {day.estimatedMinutes || 35} min</Chip>
                {day.difficulty && <Chip>◆ {day.difficulty}</Chip>}
                {missionXp > 0 && <Chip green>+{missionXp} XP</Chip>}
                <Chip>{modules.length} {modules.length === 1 ? 'module' : 'modules'}</Chip>
              </div>

              {/* Objective */}
              <div className="rounded-2xl p-6 mb-4" style={{ background: 'linear-gradient(150deg, var(--green), #05300f)', color: '#fff' }}>
                <p className="pos-label mb-2" style={{ color: 'rgba(255,255,255,.65)' }}>The objective</p>
                <p className="text-[22px] md:text-[26px] leading-snug" style={{ fontFamily: 'var(--font-serif, Georgia), serif', fontStyle: 'italic' }}>{day.missionText || day.objective}</p>
              </div>

              {/* Why it matters */}
              {(day.purpose || day.briefDescription) && (
                <div className="pos-card p-6 mb-4">
                  <p className="pos-label mb-2">Why this matters</p>
                  <p className="text-[15px] text-[var(--muted)] leading-relaxed">{day.purpose || day.briefDescription}</p>
                </div>
              )}

              {/* Module list */}
              <div className="pos-card p-5 mb-5">
                <p className="pos-label mb-3">What you&apos;ll do — {modules.length} {modules.length === 1 ? 'module' : 'modules'}</p>
                <div className="space-y-1">
                  {modules.map((m, i) => (
                    <div key={m.id} className="flex items-center gap-3 py-1.5">
                      <span className="pos-num text-sm w-6 text-[var(--muted)]">{i + 1}</span>
                      <span className="text-[14px] text-[var(--ink)] flex-1">{m.title}</span>
                      {m.xp > 0 && <span className="text-[12px] text-[var(--muted)]">+{m.xp} XP</span>}
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => setPhase('work')} className="pos-action pos-focusable inline-flex items-center gap-2" style={{ background: 'var(--orange)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"><path d="M7 5l12 7-12 7V5Z" fill="#fff" /></svg>
                Start mission
              </button>
              <p className="text-[12px] text-[var(--muted)] mt-2">Starting opens the guided modules and your timer.</p>
            </div>

            {/* Chat on the overview too */}
            <div className="min-w-0">
              <div className="lg:sticky lg:top-6">
                <ChatAssistant missionId={id} moduleId={mod.id} moduleTitle={mod.title} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Celebration ----------
  if (phase === 'celebrate') {
    const before = (result?.newTotal || 0) - (result?.scoreDelta || 0);
    const est = day.estimatedMinutes || 35;
    const actual = finalMinutes;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
        {result?.celebration && <Confetti />}
        <div className="w-full max-w-lg">
          {result?.celebration && <Celebration data={result.celebration} />}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3" style={{ background: 'var(--green)' }}>
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="pos-label" style={{ color: 'var(--green)' }}>Mission complete</p>
            <h1 className="text-[26px] font-semibold text-[var(--ink)] mt-1" style={{ letterSpacing: '-0.02em' }}>
              Day {day.missionNumber} — all {modules.length} {modules.length === 1 ? 'module' : 'modules'} done.
            </h1>
            {result?.performance && (
              <p className="text-[13px] text-[var(--muted)] mt-2">
                Performance <span className="pos-num text-[var(--ink)]">{result.performance.overall}</span>
                {result.performance.currentStreak > 1 && <> · <span className="pos-num text-[var(--ink)]">{result.performance.currentStreak}</span> in a row</>}
              </p>
            )}
          </div>

          {result?.scoreDelta > 0 && (
            <div className="pos-card p-5 mb-4 text-center">
              <p className="pos-label mb-1">Visibility Score</p>
              <p className="text-[var(--ink)]">
                <span className="pos-num text-2xl text-[var(--muted)]">{before}</span>
                <span className="mx-2 text-[var(--muted)]">→</span>
                <span className="pos-num text-3xl text-[var(--green)]">{result.newTotal}</span>
              </p>
              <p className="text-[13px] text-[var(--muted)] mt-1">+{result.scoreDelta} {SCORE_LABELS[result.component] || ''}</p>
            </div>
          )}

          <div className="flex justify-center gap-8 text-center mb-6">
            <div><p className="pos-label">Estimated</p><p className="pos-num text-xl text-[var(--ink)]">{est}m</p></div>
            <div><p className="pos-label">Actual</p><p className="pos-num text-xl text-[var(--ink)]">{actual}m</p></div>
          </div>

          <LeaderboardPrompt />

          {tomorrow ? (
            <div className="pos-card p-5 mb-6">
              <p className="pos-label mb-1">Tomorrow · Day {tomorrow.missionNumber}</p>
              <p className="text-[var(--ink)] font-medium">{tomorrow.title}</p>

              <p className="pos-label mt-5 mb-2">When will you do it?</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[{ o: 0, l: 'Today' }, { o: 1, l: 'Tomorrow' }, { o: 2, l: 'In 2 days' }].map((d) => (
                  <button key={d.o} onClick={() => setCommit((c) => ({ ...c, dayOffset: d.o }))}
                    className="rounded-lg py-2 text-center border transition-colors"
                    style={{ borderColor: commit.dayOffset === d.o ? 'var(--green)' : 'var(--rule)', background: commit.dayOffset === d.o ? 'var(--green-soft)' : 'transparent' }}>
                    <span className="block text-[13px] font-medium text-[var(--ink)]">{d.l}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {WINDOWS.map((w) => (
                  <button key={w.id} onClick={() => setCommit((c) => ({ ...c, window: w.id }))}
                    className="rounded-lg py-2 text-center border transition-colors"
                    style={{ borderColor: commit.window === w.id ? 'var(--green)' : 'var(--rule)', background: commit.window === w.id ? 'var(--green-soft)' : 'transparent' }}>
                    <span className="block text-[13px] font-medium text-[var(--ink)]">{w.label}</span>
                    <span className="block text-[10px] text-[var(--muted)]">{w.hint}</span>
                  </button>
                ))}
              </div>
              <input type="time" value={commit.exactTime} onChange={(e) => setCommit((c) => ({ ...c, exactTime: e.target.value }))} className="mt-3 pos-card p-2 text-sm" />
              <p className="text-[11px] text-[var(--muted)] mt-3">You can reschedule anytime from your Schedule — up to 2 days out.</p>
            </div>
          ) : (
            <div className="pos-card p-5 mb-6 text-center text-[var(--muted)]">That was your last mission in this pack. See your record.</div>
          )}

          <div className="flex items-center justify-center gap-5">
            <button onClick={setItAndGo} className="pos-action">{tomorrow ? 'Set my schedule' : 'Back to pack'}</button>
            {tomorrow && <button onClick={() => downloadIcs(tomorrow, commit, packTitle)} className="pos-link text-sm">Add to my calendar</button>}
          </div>
        </div>
      </div>
    );
  }

  // ---------- Workspace (module stepper) ----------
  const over = remaining < 0;
  const absR = Math.abs(remaining);
  const mm = String(Math.floor(absR / 60)).padStart(2, '0');
  const ss = String(absR % 60).padStart(2, '0');
  const modulePct = Math.round((index / modules.length) * 100);

  // Variables entered so far this session (earlier modules) → fill any {{token}}
  // still left in this module's ready-to-copy prompt so the doctor pastes real values.
  const sessionVars = {};
  for (const m of modules) {
    for (const f of m.inputs || []) {
      if (!f.variable) continue;
      const v = inputVals[m.id]?.[f.id];
      if (v != null && String(v).trim()) sessionVars[f.variable] = v;
    }
  }
  // Ready-to-copy prompts (multi). Legacy single prompt falls back into the array.
  const promptList = (mod.aiPrompts && mod.aiPrompts.length ? mod.aiPrompts : (mod.aiPrompt ? [mod.aiPrompt] : []))
    .map((p) => fillVars(p, sessionVars));

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-10 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Top: exit + module progress */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <Link href={`/app/zero-to-practice-builder/track?pack=${packId}`} className="pos-link text-sm">← Exit mission</Link>
          <div className="flex-1 min-w-[180px] max-w-[520px]">
            <div className="flex justify-between text-[11px] text-[var(--muted)] mb-1">
              <span>Module <span className="pos-num">{index + 1}/{modules.length}</span></span>
              <span className="truncate ml-3">{mod.title}</span>
            </div>
            <div className="pos-meter"><span style={{ width: `${modulePct}%` }} /></div>
          </div>
        </div>

        <p className="pos-label mb-1">{day.category || 'Practice building'} · Day {day.missionNumber} · Mission</p>
        <h1 className="text-[22px] md:text-[28px] font-semibold text-[var(--ink)] mb-5" style={{ letterSpacing: '-0.02em' }}>{day.missionText}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-8">
          {/* Left — the module */}
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <span className="pos-label" style={{ background: 'var(--green)', color: '#fff', padding: '6px 12px', borderRadius: 8 }}>Module {index + 1}</span>
              <span className="font-semibold text-[17px] text-[var(--ink)]">{mod.title}</span>
              {mod.xp > 0 && <span className="pos-label ml-auto" style={{ background: 'var(--green-soft)', color: 'var(--green)', padding: '6px 12px', borderRadius: 99 }}>+{mod.xp} XP</span>}
            </div>

            {/* Outcome + prerequisites */}
            {(mod.expectedOutcome || mod.prerequisites) && (
              <div className="space-y-2.5 mb-4">
                {mod.expectedOutcome && (
                  <div className="pos-card p-4 flex items-start gap-3" style={{ background: 'var(--green-soft)', borderColor: 'var(--green)' }}>
                    <span className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center" style={{ background: 'var(--green)' }}>
                      <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </span>
                    <div className="min-w-0">
                      <p className="pos-label mb-0.5" style={{ color: 'var(--green)' }}>What you&apos;ll walk away with</p>
                      <p className="text-[14px] text-[var(--ink)] leading-relaxed">{mod.expectedOutcome}</p>
                    </div>
                  </div>
                )}
                {mod.prerequisites && (
                  <div className="flex items-start gap-2 px-1 text-[13px] text-[var(--muted)] leading-relaxed">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--green)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span><span className="font-medium text-[var(--ink)]">Before you start:</span> {mod.prerequisites}</span>
                  </div>
                )}
              </div>
            )}

            {/* Lecture notes for this module */}
            {mod.lecture && (
              <div className="pos-card p-5 mb-4">
                <p className="pos-label mb-2">Lecture</p>
                <p className="text-[14.5px] text-[var(--ink)] leading-relaxed whitespace-pre-wrap">{mod.lecture}</p>
              </div>
            )}

            {/* Walkthrough video — plays automatically as soon as the module opens. */}
            {mod.hasVideo && (
              <div className="mb-4"><VideoPlayer key={mod.id} url={mod.videoUrl} /></div>
            )}

            {/* Step-by-step — a numbered checklist: ticking a step gives a sense of
                progress and keeps the doctor from jumping ahead. (#19) */}
            {mod.steps?.length > 0 && (
              <StepChecklist steps={mod.steps} sessionVars={sessionVars} checked={stepChecks[mod.id] || {}} onToggle={(i) => toggleStep(mod.id, i)} />
            )}

            {/* Education / reference material for this module */}
            {mod.education?.length > 0 && (
              <div className="pos-card p-5 mb-4">
                <p className="pos-label mb-3">Learn more</p>
                <div className="space-y-2">
                  {mod.education.map((e, i) => (
                    <a key={i} href={e.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13.5px] text-[var(--green)] hover:underline">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--green)' }} />
                      {e.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Ready-to-copy AI prompt(s) — one card per prompt, with the doctor's
                real variables filled in. */}
            {promptList.map((p, i) => (
              <AiPromptCard key={i} prompt={p} index={promptList.length > 1 ? i + 1 : 0} total={promptList.length} />
            ))}

            {/* Action buttons — {{variables}} in the URL/label are filled from the
                doctor's values (server-side, plus anything typed this session). */}
            {mod.buttons?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {mod.buttons.map((b, i) => (
                  <a key={i} href={fillVars(b.url, sessionVars)} target="_blank" rel="noopener noreferrer" className="pos-card px-4 py-2.5 text-[13.5px] font-medium text-[var(--ink)] hover:shadow-sm transition-shadow inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} />
                    {fillVars(b.label, sessionVars)}
                    <svg className="w-3.5 h-3.5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </a>
                ))}
              </div>
            )}

            {/* Add to your record — its own distinct box (CLAUDE.md §4: "Your record", not "evidence"). */}
            {mod.inputs?.length > 0 && (
              <div className="pos-card p-5 mb-4" style={{ borderColor: 'var(--green)', background: 'var(--green-soft)' }}>
                <p className="pos-label mb-1" style={{ color: 'var(--green)' }}>Add to your record</p>
                <p className="text-[12.5px] text-[var(--muted)] mb-3">Keep proof of what you built — it becomes part of your record and your Day 30 completion.</p>
                <div className="space-y-3">
                  {mod.inputs.map((f) => (
                    <div key={f.id}>
                      <label className="block text-[13px] font-medium text-[var(--ink)] mb-1">{f.label}{f.required && <span style={{ color: 'var(--orange)' }}> *</span>}</label>
                      <input
                        value={inputVals[mod.id]?.[f.id] || ''}
                        onChange={(e) => setInput(mod.id, f.id, e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full pos-card p-2.5 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Final-module extras: reflection + KPIs */}
            {isLast && <FinalExtras day={day} reflection={reflection} setReflection={setReflection} kpiValues={kpiValues} setKpiValues={setKpiValues} />}

            {inputError && (
              <p className="text-[13px] mb-2" style={{ color: 'var(--orange)' }}>{inputError}</p>
            )}

            <div className="flex items-center gap-5 mt-2 flex-wrap">
              <button onClick={finishModule} disabled={saving} className="pos-action pos-focusable" style={{ background: 'var(--green)' }}>
                {saving ? 'Saving…' : (isLast ? '✓ Finish mission' : 'Finish module →')}
              </button>
              <a
                href={supportLink(`Hi, I need help with the module "${mod.title}" in my mission "${day.missionText}".`)}
                target="_blank" rel="noopener noreferrer"
                className="pos-link text-sm inline-flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35zM12 2a10 10 0 00-8.6 15.05L2 22l5.1-1.34A10 10 0 1012 2z" /></svg>
                Request assistance
              </a>
              <Link href={`/app/zero-to-practice-builder/track?pack=${packId}`} className="pos-link text-sm">Leave for now</Link>
            </div>
          </div>

          {/* Right — timer + module-aware chat */}
          <div className="min-w-0">
            <div className="lg:sticky lg:top-6 space-y-4">
              <div className="pos-card p-5 text-center">
                <p className="pos-label mb-1">Mission timer</p>
                <p className="pos-num text-4xl" style={{ color: over ? 'var(--orange)' : 'var(--ink)' }}>{over ? '+' : ''}{mm}:{ss}</p>
                <button onClick={() => setPaused((p) => !p)} className="pos-link text-sm mt-2 inline-flex items-center gap-1.5">
                  {paused ? '▶ Resume' : '⏸ Pause'}
                </button>
                <p className="text-[11px] text-[var(--muted)] mt-1">{over ? 'Over the estimate — no rush' : (paused ? 'Paused' : 'Counting down · running long is fine')}</p>
              </div>
              <ChatAssistant missionId={id} moduleId={mod.id} moduleTitle={mod.title} />
            </div>
          </div>
        </div>
      </div>

      <WorkspaceDrawer />
    </div>
  );
}

export default function FocusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>}>
      <FocusSession />
    </Suspense>
  );
}

function Chip({ children, green }) {
  return (
    <span className="pos-label" style={{
      background: green ? 'var(--green-soft)' : 'var(--rule-soft)',
      color: green ? 'var(--green)' : 'var(--muted)',
      padding: '6px 12px', borderRadius: 8,
    }}>{children}</span>
  );
}

// Step-by-step rendered as a numbered checklist. Ticking a step strikes it through
// and fills the progress bar — a sense of completion without punishing skips.
// {{variables}} entered earlier this session are filled inline. (#19, #30)
// A step line that is a Markdown heading (## …) or wholly bold (**…**) is a
// section header, not an action — render it as a sub-heading, never a checkbox. (#44)
function stepHeading(step) {
  const s = String(step || '').trim();
  const md = /^#{1,6}\s+(.*)$/.exec(s);
  if (md) return md[1].trim();
  const bold = /^\*\*(.+)\*\*$/.exec(s);
  if (bold) return bold[1].trim();
  return null;
}

function StepChecklist({ steps, sessionVars, checked, onToggle }) {
  // Only real (non-heading) steps count toward progress.
  const total = steps.reduce((n, s) => n + (stepHeading(s) ? 0 : 1), 0);
  const doneCount = steps.reduce((n, s, i) => n + (!stepHeading(s) && checked[i] ? 1 : 0), 0);
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  // Number only the actionable steps (headings don't get a number).
  let stepNo = 0;
  return (
    <div className="pos-card p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="pos-label">Step-by-step</p>
        <span className="text-[11px] text-[var(--muted)]"><span className="pos-num">{doneCount}</span>/{total} done</span>
      </div>
      <div className="pos-meter mb-4"><span style={{ width: `${pct}%` }} /></div>
      <div className="space-y-1.5">
        {steps.map((step, i) => {
          const heading = stepHeading(step);
          if (heading) {
            return (
              <p key={i} className="pos-label pt-3 pb-0.5" style={{ color: 'var(--ink)' }}>{fillVars(heading, sessionVars)}</p>
            );
          }
          stepNo += 1;
          const on = !!checked[i];
          return (
            <button
              key={i}
              type="button"
              onClick={() => onToggle(i)}
              className="w-full flex gap-3 items-start text-left rounded-lg p-2 -mx-2 transition-colors hover:bg-[var(--rule-soft)]"
            >
              <span
                className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[12px] font-semibold border transition-colors"
                style={{
                  background: on ? 'var(--green)' : 'transparent',
                  borderColor: on ? 'var(--green)' : 'var(--rule)',
                  color: on ? '#fff' : 'var(--muted)',
                }}
              >
                {on ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : stepNo}
              </span>
              <span className="text-[14px] leading-relaxed pt-0.5" style={{ color: on ? 'var(--muted)' : 'var(--ink)', textDecoration: on ? 'line-through' : 'none' }}>
                {fillVars(step, sessionVars)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// A ready-to-use AI prompt the doctor can copy into any AI tool (distinct from the chat).
function AiPromptCard({ prompt, index = 0, total = 1 }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard?.writeText(prompt); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--ink)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="pos-label" style={{ color: 'var(--leaf, #8Fe6ae)' }}>{index ? `AI prompt ${index} of ${total} · ready to use` : 'AI prompt · ready to use'}</p>
        <button onClick={copy} className="text-[12px] font-medium text-white/90 hover:text-white inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5" style={{ background: 'rgba(255,255,255,.12)' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-[12.5px] leading-relaxed font-mono rounded-lg p-3 whitespace-pre-wrap" style={{ background: 'rgba(0,0,0,.28)', color: 'rgba(255,255,255,.88)' }}>{prompt}</p>
    </div>
  );
}

// Optional reflection + KPI entry shown on the last module before finishing.
function FinalExtras({ day, reflection, setReflection, kpiValues, setKpiValues }) {
  const kpiFields = day.kpiFields || [];
  return (
    <div className="space-y-3 mb-4">
      <details className="pos-card p-4">
        <summary className="pos-label cursor-pointer">Reflection (optional)</summary>
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-[13px] text-[var(--muted)] mb-1">How confident do you feel? (1–5)</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setReflection((r) => ({ ...r, confidence: n }))}
                  className="w-9 h-9 rounded-lg border text-sm font-medium transition-colors"
                  style={{ borderColor: reflection.confidence === n ? 'var(--green)' : 'var(--rule)', background: reflection.confidence === n ? 'var(--green-soft)' : 'transparent', color: 'var(--ink)' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <textarea value={reflection.learning} onChange={(e) => setReflection((r) => ({ ...r, learning: e.target.value }))} placeholder="Biggest learning today…" className="w-full pos-card p-3 text-sm" rows={2} />
          <textarea value={reflection.challenge} onChange={(e) => setReflection((r) => ({ ...r, challenge: e.target.value }))} placeholder="Biggest challenge…" className="w-full pos-card p-3 text-sm" rows={2} />
        </div>
      </details>

      {kpiFields.length > 0 && (
        <div className="pos-card p-4">
          <p className="pos-label mb-2">Update your numbers</p>
          <div className="space-y-2">
            {kpiFields.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-3">
                <label className="text-sm text-[var(--ink)]">{f.label || f.key}{f.unit ? ` (${f.unit})` : ''}</label>
                <input type="number" value={kpiValues[f.key] ?? ''} onChange={(e) => setKpiValues((v) => ({ ...v, [f.key]: e.target.value }))} placeholder="0" className="pos-card p-2 text-sm w-28" />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-2">These become your progress graphs over time.</p>
        </div>
      )}
    </div>
  );
}

// Renders a YouTube embed for youtube URLs, otherwise a native <video> (e.g. GCS-hosted mp4).
function VideoPlayer({ url }) {
  const yt = toYouTubeEmbed(url);
  return (
    <div className="rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
      {yt ? (
        // autoplay + rel=0 so the walkthrough starts as soon as the module opens.
        <iframe src={`${yt}?autoplay=1&rel=0&modestbranding=1`} title="Walkthrough" className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      ) : (
        <video src={url} controls autoPlay playsInline className="w-full h-full" />
      )}
    </div>
  );
}

function toYouTubeEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

// Confetti pieces — computed once, deterministically (pure; no Math.random in render).
const CONFETTI_COLORS = ['#096B17', '#F26A1B', '#5E6B5F', '#8Fbf9a'];
const CONFETTI_PIECES = Array.from({ length: 40 }, (_, i) => {
  const rand = (n) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
  return {
    left: rand(1) * 100,
    delay: rand(2) * 0.6,
    dur: 2.2 + rand(3) * 1.6,
    size: 6 + rand(4) * 8,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  };
});

// Brief celebratory confetti burst (§13). Decorative; disabled under reduced motion.
function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 50 }}>
      <style>{`@keyframes pos-fall{0%{transform:translateY(-10vh) rotate(0);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}@media (prefers-reduced-motion: reduce){.pos-confetti{display:none}}`}</style>
      {CONFETTI_PIECES.map((p, i) => (
        <span key={i} className="pos-confetti" style={{
          position: 'absolute', left: `${p.left}%`, top: 0, width: p.size, height: p.size * 0.6,
          background: p.color, borderRadius: 2,
          animation: `pos-fall ${p.dur}s ${p.delay}s ease-in forwards`,
        }} />
      ))}
    </div>
  );
}

function Celebration({ data }) {
  return (
    <div className="pos-card p-5 mb-5 text-center" style={{ borderColor: 'var(--green)', background: 'var(--green-soft)' }}>
      <p className="pos-label" style={{ color: 'var(--green)' }}>{data.title}</p>
      {data.message && <p className="text-[var(--ink)] mt-1" style={{ maxWidth: '40ch', margin: '4px auto 0' }}>{data.message}</p>}
      {data.badge && <p className="text-2xl mt-2">{data.badge}</p>}
      {data.xp > 0 && <p className="text-[13px] text-[var(--muted)] mt-1">+{data.xp} XP</p>}
    </div>
  );
}

// .ics generated client-side — works with Google, Apple, Outlook, no OAuth (§4.4).
// The event is named after the Builder Pack (not "Practice OS").
function downloadIcs(tomorrow, commit, packTitle) {
  if (!tomorrow) return;
  const d = new Date(); d.setDate(d.getDate() + (commit.dayOffset ?? 1));
  const [h, m] = (commit.exactTime || { morning: '09:00', afternoon: '14:00', evening: '19:30', night: '21:30' }[commit.window] || '19:30').split(':');
  d.setHours(Number(h) || 19, Number(m) || 30, 0, 0);
  const dt = (x) => x.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const end = new Date(d.getTime() + 45 * 60000);
  const prefix = packTitle ? `${packTitle} — ` : '';
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `DTSTART:${dt(d)}`, `DTEND:${dt(end)}`, `SUMMARY:${prefix}${tomorrow.title}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = document.createElement('a'); a.href = url; a.download = 'curago-task.ics'; a.click(); URL.revokeObjectURL(url);
}
