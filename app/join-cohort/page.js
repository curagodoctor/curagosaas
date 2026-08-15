'use client';

import { useState, useRef, useEffect } from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Questionnaire from '@/components/cohort/Questionnaire';

// The "Join the first cohort" onboarding flow:
//   Intro video (autoplay, streamed from GCS) → Proceed to the demo →
//   Demo video → Proceed to the questionnaire → Questionnaire (to be added).
const STEPS = ['intro', 'demo', 'questionnaire'];
const STEP_LABELS = { intro: 'Welcome', demo: 'Demo', questionnaire: 'A few questions' };

export default function JoinCohortPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#05130a' }} />}>
      <JoinCohortFlow />
    </Suspense>
  );
}

function JoinCohortFlow() {
  const params = useSearchParams();
  const source = params.get('source') || 'landing';
  const [step, setStep] = useState('intro');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#05130a', color: '#fff' }}>
      {/* Progress header */}
      <header className="px-5 sm:px-8 py-5 flex items-center justify-between">
        <span className="text-[13px] font-mono tracking-widest" style={{ color: 'rgba(255,255,255,.55)' }}>
          ZERO TO PRACTICE BUILDER · FIRST COHORT
        </span>
        <ol className="hidden sm:flex items-center gap-2">
          {STEPS.map((s, i) => {
            const active = s === step;
            const done = STEPS.indexOf(step) > i;
            return (
              <li key={s} className="flex items-center gap-2">
                <span className="text-[12px] flex items-center gap-1.5" style={{ color: active ? '#fff' : done ? '#8fe6ae' : 'rgba(255,255,255,.4)' }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold"
                    style={{ background: active ? '#F26A1B' : done ? '#0E6B25' : 'rgba(255,255,255,.12)' }}>
                    {done ? '✓' : i + 1}
                  </span>
                  {STEP_LABELS[s]}
                </span>
                {i < STEPS.length - 1 && <span style={{ color: 'rgba(255,255,255,.2)' }}>·</span>}
              </li>
            );
          })}
        </ol>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-10">
        {step === 'intro' && (
          <VideoStep
            key="intro"
            src="/api/cohort/video/1"
            eyebrow="Welcome"
            title="Start here — a short welcome."
            proceedLabel="Proceed to the demo video →"
            onProceed={() => setStep('demo')}
          />
        )}
        {step === 'demo' && (
          <VideoStep
            key="demo"
            src="/api/cohort/video/2"
            eyebrow="The demo"
            title="See how the programme works, end to end."
            proceedLabel="Proceed to the questionnaire →"
            onProceed={() => setStep('questionnaire')}
          />
        )}
        {step === 'questionnaire' && <Questionnaire source={source} />}
      </main>
    </div>
  );
}

// A single autoplaying video with a "proceed" CTA that unlocks when it ends.
function VideoStep({ src, eyebrow, title, proceedLabel, onProceed }) {
  const videoRef = useRef(null);
  const [ended, setEnded] = useState(false);
  const [needsTap, setNeedsTap] = useState(false); // autoplay-with-sound blocked

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => setNeedsTap(true)); // browser blocked autoplay — show a tap-to-play overlay
    }
  }, []);

  const tapPlay = () => {
    setNeedsTap(false);
    videoRef.current?.play().catch(() => setNeedsTap(true));
  };

  return (
    <div className="w-full max-w-4xl">
      <p className="text-[12px] font-mono tracking-widest mb-2" style={{ color: '#8fe6ae' }}>{eyebrow.toUpperCase()}</p>
      <h1 className="text-[22px] sm:text-[28px] font-bold mb-5 leading-tight" style={{ letterSpacing: '-0.02em' }}>{title}</h1>

      <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '16 / 9', border: '1px solid rgba(255,255,255,.12)' }}>
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full"
          autoPlay
          playsInline
          controls
          preload="auto"
          onEnded={() => setEnded(true)}
        />
        {needsTap && (
          <button
            onClick={tapPlay}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: 'rgba(0,0,0,.55)' }}
            aria-label="Play video"
          >
            <span className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: '#F26A1B', boxShadow: '0 10px 30px rgba(232,114,46,.5)' }}>
              <span style={{ borderLeft: '22px solid #fff', borderTop: '14px solid transparent', borderBottom: '14px solid transparent', marginLeft: 6 }} />
            </span>
            <span className="text-[15px] font-semibold">Tap to play</span>
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,.55)' }}>
          {ended ? 'Video finished — you can continue.' : 'Watch the video, then continue below.'}
        </p>
        <div className="flex items-center gap-4">
          {!ended && (
            <button onClick={onProceed} className="text-[13px] underline" style={{ color: 'rgba(255,255,255,.5)' }}>
              Skip
            </button>
          )}
          <button
            onClick={onProceed}
            disabled={!ended}
            className="font-semibold text-[15px] px-6 py-3 rounded-xl transition-opacity"
            style={{ background: '#F26A1B', color: '#fff', opacity: ended ? 1 : 0.45, cursor: ended ? 'pointer' : 'not-allowed', boxShadow: ended ? '0 10px 30px rgba(232,114,46,.4)' : 'none' }}
          >
            {proceedLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

