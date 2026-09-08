'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PosNav from '@/components/practice-os/PosNav';

function toYouTubeEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function Player({ url }) {
  const yt = toYouTubeEmbed(url);
  return (
    <div className="rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
      {yt ? (
        <iframe src={`${yt}?rel=0&modestbranding=1`} title="Orientation video" className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      ) : (
        <video src={url} controls playsInline className="w-full h-full" />
      )}
    </div>
  );
}

function Orientation() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/app/zero-to-practice-builder';

  const [videos, setVideos] = useState(null); // null = loading
  const [consent, setConsent] = useState(null);
  const [active, setActive] = useState(0);
  const [viewed, setViewed] = useState(() => new Set());
  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/practice-os/orientation', { credentials: 'include' });
      const data = await res.json();
      setVideos(data.videos || []);
      setConsent(data.consent || { acknowledgedAt: null, videoCount: 0 });
    } catch {
      setVideos([]);
      setConsent({ acknowledgedAt: null, videoCount: 0 });
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Mark the opening video viewed once the list loads.
  useEffect(() => {
    if (videos && videos.length) setViewed((v) => new Set(v).add(0));
  }, [videos]);

  const alreadyAcked = !!(consent?.acknowledgedAt && videos && consent.videoCount >= videos.length);
  const allViewed = videos && videos.length > 0 && viewed.size >= videos.length;
  const canAck = (allViewed && agree) || alreadyAcked;

  const select = (i) => { setActive(i); setViewed((v) => new Set(v).add(i)); };

  const acknowledge = async () => {
    if (!canAck) return;
    setSaving(true); setError('');
    try {
      if (!alreadyAcked) {
        const res = await fetch('/api/practice-os/orientation', { method: 'POST', credentials: 'include' });
        if (!res.ok) throw new Error();
      }
      router.replace(next);
    } catch {
      setError('Could not save. Please try again.');
      setSaving(false);
    }
  };

  const hasVideos = videos && videos.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-5 pt-[64px] pb-10">
      <PosNav breadcrumb="Orientation" />

      <div className="mt-8 mb-6">
        <p className="pos-label mb-1">Before you optimize</p>
        <h1 className="text-[26px] font-semibold text-[var(--ink)]" style={{ letterSpacing: '-0.02em' }}>
          Watch these short lessons
        </h1>
        <p className="text-sm text-[var(--muted)] mt-2" style={{ maxWidth: '52ch' }}>
          While Google verifies your Business Profile (this can take a little time and is out of our hands),
          get across the essentials of building your organic presence — and the mistakes that get a profile suspended.
        </p>
      </div>

      {videos === null && <p className="text-sm text-[var(--muted)]">Loading…</p>}

      {videos !== null && !hasVideos && (
        <div className="pos-card p-5 mb-6">
          <p className="text-sm text-[var(--ink)]">No orientation videos have been added yet. You can continue for now.</p>
          <button onClick={() => router.replace(next)} className="pos-action mt-4">Continue</button>
        </div>
      )}

      {hasVideos && (
        <>
          <Player key={active} url={videos[active]?.videoUrl} />

          <div className="mt-3 mb-6">
            <p className="text-[17px] font-semibold text-[var(--ink)]">{videos[active]?.title}</p>
            {videos[active]?.description && (
              <p className="text-sm text-[var(--muted)] mt-1 whitespace-pre-line" style={{ lineHeight: 1.6 }}>
                {videos[active].description}
              </p>
            )}
          </div>

          {/* Playlist — choose one, or step through the whole set */}
          <p className="pos-label mb-2">All lessons ({viewed.size}/{videos.length} opened)</p>
          <ul className="pos-card divide-y" style={{ borderColor: 'var(--rule)', padding: 0, overflow: 'hidden' }}>
            {videos.map((v, i) => {
              const isActive = i === active;
              const seen = viewed.has(i);
              return (
                <li key={i}>
                  <button
                    onClick={() => select(i)}
                    className="w-full text-left flex items-center gap-3 px-4 py-3"
                    style={{ background: isActive ? 'var(--green-soft)' : 'transparent' }}
                  >
                    <span
                      className="pos-num flex items-center justify-center rounded-full shrink-0"
                      style={{ width: 26, height: 26, fontSize: 12, background: seen ? 'var(--green)' : 'var(--rule-soft)', color: seen ? '#fff' : 'var(--muted)' }}
                    >
                      {seen ? '✓' : i + 1}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-[var(--ink)] truncate">{v.title}</span>
                    </span>
                    {isActive && <span className="pos-label" style={{ color: 'var(--green)' }}>Now playing</span>}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Step controls to "play the whole set" */}
          <div className="flex items-center justify-between mt-3">
            <button onClick={() => select(Math.max(0, active - 1))} disabled={active === 0} className="pos-link disabled:opacity-40" style={{ fontSize: 14 }}>← Previous</button>
            <button onClick={() => select(Math.min(videos.length - 1, active + 1))} disabled={active >= videos.length - 1} className="pos-link disabled:opacity-40" style={{ fontSize: 14 }}>Next →</button>
          </div>

          {/* Acknowledgement / consent */}
          <div className="pos-card p-5 mt-8" style={{ borderColor: allViewed || alreadyAcked ? 'var(--green)' : 'var(--rule)' }}>
            {alreadyAcked ? (
              <p className="text-sm text-[var(--ink)]">
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>✓ Acknowledged.</span> You can re-watch any lesson above anytime.
              </p>
            ) : (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  disabled={!allViewed}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1 shrink-0"
                  style={{ width: 18, height: 18, accentColor: 'var(--green)' }}
                />
                <span className="text-sm text-[var(--ink)]" style={{ lineHeight: 1.6 }}>
                  I have viewed all the videos and I understand the use cases, and the risks of account
                  <b> suspension or re-verification</b> if my profile details are changed carelessly.
                  {!allViewed && <span className="block text-[13px] text-[var(--muted)] mt-1">Open every lesson above to enable this.</span>}
                </span>
              </label>
            )}

            {error && <p className="text-[13px] mt-3" style={{ color: '#B42318' }}>{error}</p>}

            <button onClick={acknowledge} disabled={!canAck || saving} className="pos-action mt-4" style={{ opacity: !canAck || saving ? 0.5 : 1 }}>
              {saving ? 'Saving…' : alreadyAcked ? 'Continue' : 'I understand — continue'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Orientation />
    </Suspense>
  );
}
