'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SCORE_LABELS } from '../../_score';

const WINDOWS = [
  { id: 'morning', label: 'Morning', hint: '6–12' },
  { id: 'afternoon', label: 'Afternoon', hint: '12–5' },
  { id: 'evening', label: 'Evening', hint: '5–9' },
  { id: 'night', label: 'Night', hint: '9–12' },
];

export default function FocusSession() {
  const { id } = useParams();
  const router = useRouter();
  const quick = useSearchParams().get('quick') === '1';

  const [day, setDay] = useState(null);
  const [phase, setPhase] = useState('focus'); // 'focus' | 'complete'
  const [checked, setChecked] = useState({});
  const [seconds, setSeconds] = useState(0);
  const [notes, setNotes] = useState('');
  const [links, setLinks] = useState('');
  const [evidence, setEvidence] = useState([]);          // [{ url, name }]
  const [reflection, setReflection] = useState({ confidence: 0, learning: '', challenge: '' });
  const [kpiValues, setKpiValues] = useState({});         // { [key]: value }
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);   // { scoreDelta, newTotal, component, celebration, performance }
  const [tomorrow, setTomorrow] = useState(null);
  const [commit, setCommit] = useState({ window: 'evening', exactTime: '' });
  const startedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/practice-os/day/${id}`);
      const data = await res.json();
      if (data.success) setDay(data.day);
      if (!startedRef.current) { startedRef.current = true; fetch(`/api/practice-os/day/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start' }) }); }
    })();
  }, [id]);

  // Overtime timer — counts up, never stops (CLAUDE.md §4.2).
  useEffect(() => {
    if (phase !== 'focus') return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const finish = useCallback(async () => {
    setSaving(true);
    const record = {
      screenshots: evidence.map((e) => e.url),
      links: links.split('\n').map((l) => l.trim()).filter(Boolean),
      notes,
    };
    const kpis = (day.kpiFields || [])
      .map((f) => ({ key: f.key, label: f.label, unit: f.unit, value: kpiValues[f.key] }))
      .filter((k) => k.value !== '' && k.value !== undefined && k.value !== null);
    const res = await fetch(`/api/practice-os/day/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', record, actualMinutes: Math.round(seconds / 60), reflection, kpis }),
    });
    const data = await res.json();
    setResult(data);
    // Reveal tomorrow's task (now the current day).
    const st = await (await fetch('/api/practice-os/state')).json();
    setTomorrow(st.allComplete ? null : st.today);
    setPhase('complete');
    setSaving(false);
  }, [id, links, notes, seconds, evidence, reflection, kpiValues, day]);

  const setItAndGo = async () => {
    await fetch(`/api/practice-os/day/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', nextCommitment: commit }),
    });
    router.push('/app/practice-os');
  };

  if (!day) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;

  // ---------- Focus phase ----------
  if (phase === 'focus') {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    const over = day.estimatedMinutes && seconds > day.estimatedMinutes * 60;
    const steps = (day.subSteps && day.subSteps.length ? day.subSteps : [day.missionText]);
    const shown = quick ? steps.slice(0, 1) : steps;

    return (
      <div className="min-h-screen px-4 sm:px-6 lg:px-10 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-10">
          {/* Left — the task */}
          <div className="min-w-0 w-full max-w-2xl mx-auto lg:mx-0">
          <p className="pos-label mb-2">Focus session · Day {day.missionNumber}</p>
          <div className="mb-8">
            <span className="pos-num text-6xl" style={{ color: over ? 'var(--muted)' : 'var(--ink)' }}>{mm}:{ss}</span>
            {over && <p className="text-[11px] text-[var(--muted)] mt-1">over the estimate — no rush, running long is fine</p>}
          </div>

          <h1 className="text-2xl font-semibold text-[var(--ink)] mb-6" style={{ letterSpacing: '-0.02em' }}>{day.missionText}</h1>

          <MissionResources day={day} />

          <div className="space-y-2 mb-7">
            {shown.map((step, i) => (
              <label key={i} className="flex items-start gap-3 pos-card p-3 cursor-pointer">
                <input type="checkbox" checked={!!checked[i]} onChange={(e) => setChecked((c) => ({ ...c, [i]: e.target.checked }))} className="mt-0.5 accent-[var(--green)]" style={{ width: 18, height: 18 }} />
                <span className={`text-[15px] ${checked[i] ? 'text-[var(--muted)] line-through' : 'text-[var(--ink)]'}`}>{step}</span>
              </label>
            ))}
          </div>

          {/* Your record — his logbook, saved as he goes */}
          <details className="mb-6">
            <summary className="pos-label cursor-pointer">Add to your record (optional)</summary>
            <div className="mt-3 space-y-3">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="A note to yourself…" className="w-full pos-card p-3 text-sm" rows={2} />
              <textarea value={links} onChange={(e) => setLinks(e.target.value)} placeholder="Links (one per line) — your GBP, your website…" className="w-full pos-card p-3 text-sm" rows={2} />
            </div>
          </details>

          <CompletionExtras
            day={day}
            evidence={evidence} setEvidence={setEvidence}
            reflection={reflection} setReflection={setReflection}
            kpiValues={kpiValues} setKpiValues={setKpiValues}
          />

          <div className="flex items-center gap-5">
            <button onClick={finish} disabled={saving} className="pos-action pos-focusable">{saving ? 'Saving…' : "I've finished this"}</button>
            <Link href="/app/practice-os" className="pos-link text-sm">Leave for now</Link>
          </div>
          </div>

          {/* Right — the mission chat assistant */}
          <div className="min-w-0">
            <div className="lg:sticky lg:top-6">
              <ChatAssistant missionId={id} missionTitle={day.missionText} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Complete phase ----------
  const before = (result?.newTotal || 0) - (result?.scoreDelta || 0);
  const est = day.estimatedMinutes || 35;
  const actual = Math.round(seconds / 60);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      {result?.celebration && <Confetti />}
      <div className="w-full max-w-lg">
        {result?.celebration && <Celebration data={result.celebration} />}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: 'var(--green-soft)' }}>
            <svg className="w-6 h-6 text-[var(--green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          </div>
          <p className="pos-label">Day {day.missionNumber} — done</p>
          {result?.performance && (
            <p className="text-[13px] text-[var(--muted)] mt-1">
              Performance <span className="pos-num text-[var(--ink)]">{result.performance.overall}</span>
              {result.performance.currentStreak > 1 && <> · <span className="pos-num text-[var(--ink)]">{result.performance.currentStreak}</span> in a row</>}
            </p>
          )}
        </div>

        {/* Score movement, component named */}
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

        {/* Est vs actual — flat */}
        <div className="flex justify-center gap-8 text-center mb-6">
          <div><p className="pos-label">Estimated</p><p className="pos-num text-xl text-[var(--ink)]">{est}m</p></div>
          <div><p className="pos-label">Actual</p><p className="pos-num text-xl text-[var(--ink)]">{actual}m</p></div>
        </div>

        {/* Tomorrow revealed before the commitment is asked */}
        {tomorrow ? (
          <div className="pos-card p-5 mb-6">
            <p className="pos-label mb-1">Tomorrow · Day {tomorrow.missionNumber}</p>
            <p className="text-[var(--ink)] font-medium">{tomorrow.title}</p>

            <p className="pos-label mt-5 mb-2">When tomorrow?</p>
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
            <p className="text-[11px] text-[var(--muted)] mt-3">We&apos;ll send one WhatsApp message tomorrow. Nothing else.</p>
          </div>
        ) : (
          <div className="pos-card p-5 mb-6 text-center text-[var(--muted)]">That was your last day. See your record.</div>
        )}

        <div className="flex items-center justify-center gap-5">
          <button onClick={setItAndGo} className="pos-action">{tomorrow ? `Set it — ${WINDOWS.find((w) => w.id === commit.window)?.label.toLowerCase()} tomorrow` : 'Done'}</button>
          <button onClick={() => downloadIcs(tomorrow, commit)} className="pos-link text-sm">Add to my calendar</button>
        </div>
      </div>
    </div>
  );
}

// Lecture, video, action buttons and education resources for the mission.
function MissionResources({ day }) {
  const hasVideo = !!day.lectureVideoUrl;
  const buttons = day.buttons || [];
  const resources = (day.education || []).filter((r) => r.type !== 'video' || r.url !== day.lectureVideoUrl);
  if (!day.lecture && !hasVideo && !buttons.length && !resources.length) return null;

  return (
    <div className="mb-7 space-y-4">
      {day.lecture && <p className="text-[14.5px] text-[var(--muted)] leading-relaxed" style={{ maxWidth: '52ch', margin: '0 auto' }}>{day.lecture}</p>}
      {hasVideo && <VideoPlayer url={day.lectureVideoUrl} />}

      {buttons.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {buttons.map((b, i) => (
            <a key={i} href={b.url} target="_blank" rel="noopener noreferrer"
              className="pos-card px-4 py-2 text-sm font-medium text-[var(--ink)] hover:shadow-sm transition-shadow inline-flex items-center gap-2">
              {b.label}
              <svg className="w-3.5 h-3.5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </a>
          ))}
        </div>
      )}

      {resources.length > 0 && (
        <div className="pos-card p-3">
          <p className="pos-label mb-2">Resources</p>
          <ul className="space-y-1.5">
            {resources.map((r, i) => (
              <li key={i}>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="pos-link text-sm inline-flex items-center gap-2">
                  <span className="pos-label" style={{ background: 'var(--rule-soft)', padding: '2px 6px', borderRadius: '5px' }}>{r.type}</span>
                  {r.label || r.url}
                </a>
              </li>
            ))}
          </ul>
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
        <iframe src={yt} title="Lecture" className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      ) : (
        <video src={url} controls playsInline className="w-full h-full" />
      )}
    </div>
  );
}

function toYouTubeEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

// Per-mission chat assistant — full conversation with history + context (PRD §8).
// 10 credits/day, 1 credit per message. Context is maintained server-side.
function ChatAssistant({ missionId, missionTitle }) {
  const [messages, setMessages] = useState([]);   // [{ role, content }]
  const [meta, setMeta] = useState(null);          // { creditsRemaining, dailyLimit, configured }
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  // Load saved conversation + credits once.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/practice-os/day/${missionId}/ai`);
        if (res.ok) {
          const d = await res.json();
          setMeta(d);
          setMessages((d.messages || []).map((m) => ({ role: m.role, content: m.content })));
        }
      } catch { /* ignore */ }
    })();
  }, [missionId]);

  // Auto-scroll to the latest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const credits = meta?.creditsRemaining;
  const noCredits = credits === 0;

  async function send() {
    const p = input.trim();
    if (!p || busy || noCredits) return;
    setError(''); setInput('');
    setMessages((m) => [...m, { role: 'user', content: p }]);
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-os/day/${missionId}/ai`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((m) => [...m, { role: 'assistant', content: data.text }]);
        setMeta((mt) => ({ ...mt, creditsRemaining: data.creditsRemaining }));
      } else {
        setError(data.error || 'Something went wrong.');
        if (typeof data.creditsRemaining === 'number') setMeta((mt) => ({ ...mt, creditsRemaining: data.creditsRemaining }));
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pos-card flex flex-col overflow-hidden" style={{ height: 'min(74vh, 660px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--rule)' }}>
        <div>
          <p className="pos-label">Mission assistant</p>
          <p className="text-[11px] text-[var(--muted)]">Drafts using your CV knowledge base</p>
        </div>
        {typeof credits === 'number' && <span className="pos-label" style={{ color: 'var(--muted)' }}>{credits}/{meta?.dailyLimit || 10}</span>}
      </div>

      {/* Thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !busy && (
          <div className="text-center text-sm text-[var(--muted)] py-10 px-2">
            Ask for help with this mission — e.g.<br />&ldquo;Draft an NMC-compliant Instagram bio for me.&rdquo;
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[14px] whitespace-pre-wrap leading-relaxed"
              style={{ background: m.role === 'user' ? 'var(--green)' : 'var(--rule-soft)', color: m.role === 'user' ? '#fff' : 'var(--ink)' }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-3.5 py-2.5 text-[14px] text-[var(--muted)]" style={{ background: 'var(--rule-soft)' }}>Thinking…</div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t px-3 py-3 shrink-0" style={{ borderColor: 'var(--rule)' }}>
        {meta && meta.configured === false && <p className="text-[12px] text-[var(--orange)] mb-2 px-1">The assistant isn&apos;t configured yet.</p>}
        {error && <p className="text-[12px] text-red-600 mb-2 px-1">{error}</p>}
        {noCredits && <p className="text-[12px] text-[var(--muted)] mb-2 px-1">You&apos;ve used today&apos;s credits — they reset tomorrow.</p>}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Message the assistant…"
            rows={1}
            disabled={busy || noCredits}
            className="flex-1 pos-card px-3 py-2 text-sm resize-none"
            style={{ maxHeight: 120 }}
          />
          <button onClick={send} disabled={busy || noCredits || !input.trim()} className="pos-action pos-focusable disabled:opacity-50 shrink-0">Send</button>
        </div>
        <p className="text-[10.5px] text-[var(--muted)] mt-2 px-1">1 credit per message · Enter to send · remembers this chat</p>
      </div>
    </div>
  );
}

// Evidence upload + reflection + KPI entry, gathered before completing (§5, §11, §12).
function CompletionExtras({ day, evidence, setEvidence, reflection, setReflection, kpiValues, setKpiValues }) {
  const kpiFields = day.kpiFields || [];
  const required = day.evidence?.required;
  return (
    <div className="space-y-3 mb-6">
      <div className="pos-card p-4">
        <p className="pos-label mb-2">Evidence {required ? '' : '(optional)'}</p>
        <EvidenceUploader evidence={evidence} setEvidence={setEvidence} />
      </div>

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

function EvidenceUploader({ evidence, setEvidence }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handle(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setError(''); setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('kind', 'record');
      try {
        const res = await fetch('/api/practice-os/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) setEvidence((ev) => [...ev, { url: data.url, name: file.name }]);
        else setError(data.error || 'Upload failed');
      } catch { setError('Upload failed'); }
    }
    setUploading(false);
  }

  return (
    <div>
      {evidence.length > 0 && (
        <ul className="space-y-1 mb-2">
          {evidence.map((e, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <a href={e.url} target="_blank" rel="noopener noreferrer" className="pos-link truncate max-w-[220px]">{e.name}</a>
              <button type="button" onClick={() => setEvidence((ev) => ev.filter((_, idx) => idx !== i))} className="text-[var(--muted)] hover:text-red-500 text-xs">remove</button>
            </li>
          ))}
        </ul>
      )}
      <label className="pos-link text-sm cursor-pointer">
        {uploading ? 'Uploading…' : '+ Add a screenshot, photo or document'}
        <input type="file" accept="image/*,.pdf,.doc,.docx" multiple className="hidden" onChange={handle} disabled={uploading} />
      </label>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
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
function downloadIcs(tomorrow, commit) {
  if (!tomorrow) return;
  const d = new Date(); d.setDate(d.getDate() + 1);
  const [h, m] = (commit.exactTime || { morning: '09:00', afternoon: '14:00', evening: '19:30', night: '21:30' }[commit.window] || '19:30').split(':');
  d.setHours(Number(h) || 19, Number(m) || 30, 0, 0);
  const dt = (x) => x.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const end = new Date(d.getTime() + 45 * 60000);
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `DTSTART:${dt(d)}`, `DTEND:${dt(end)}`, `SUMMARY:Practice OS — ${tomorrow.title}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = document.createElement('a'); a.href = url; a.download = 'practice-os-task.ics'; a.click(); URL.revokeObjectURL(url);
}
