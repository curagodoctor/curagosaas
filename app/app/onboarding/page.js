"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// §16 — "Do you already have a website?" branch. The first step of onboarding.
//  No  → straight into the free build, pitched as pure upside.
//  Yes → same build, reframed: we build your new site here, then help you point
//        your existing domain at it so you keep the domain and its SEO.
// Either way we land on the subdomain step; the answer (+ optional existing URL)
// is carried forward so the rest of the funnel and messaging can adapt.
function WebsiteBranch() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/app';

  const [choice, setChoice] = useState(null); // 'no' | 'yes'
  const [existing, setExisting] = useState('');
  const [going, setGoing] = useState(false);

  const proceed = () => {
    if (!choice) return;
    setGoing(true);
    const qs = new URLSearchParams({ next });
    if (choice === 'yes') {
      qs.set('hasWebsite', '1');
      const url = existing.trim();
      if (url) qs.set('existing', url);
    }
    router.push(`/app/onboarding/subdomain?${qs.toString()}`);
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <p style={eyebrow}>Getting started</p>
        <h1 style={h1}>Let&apos;s get your practice found online</h1>
        <p style={sub}>
          First, one quick question so we set things up the right way for you.
        </p>

        <p style={qLabel}>Do you already have a website?</p>

        <div style={{ display: 'grid', gap: 10 }}>
          <button type="button" onClick={() => setChoice('no')} style={optionStyle(choice === 'no')}>
            <span style={optTitle}>No, not yet</span>
            <span style={optDesc}>We&apos;ll build you one for free. No downside — give it a shot.</span>
          </button>
          <button type="button" onClick={() => setChoice('yes')} style={optionStyle(choice === 'yes')}>
            <span style={optTitle}>Yes, I have one</span>
            <span style={optDesc}>
              We&apos;ll build your new site here, then help you point your existing domain at it —
              you keep your domain and its SEO, we just upgrade what runs behind it.
            </span>
          </button>
        </div>

        {choice === 'yes' && (
          <div style={{ marginTop: 16 }}>
            <label style={fieldLabel}>Your current website (optional)</label>
            <input
              value={existing}
              onChange={(e) => setExisting(e.target.value)}
              placeholder="drrao.com"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              style={input}
            />
            <p style={hint}>You can add or change this later — it won&apos;t slow anything down now.</p>
          </div>
        )}

        <button type="button" onClick={proceed} disabled={!choice || going} style={cta(!choice || going)}>
          {going ? 'One moment…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

const wrap = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper, #F7F9F5)', padding: '24px' };
const card = { width: '100%', maxWidth: 480, background: 'var(--card, #fff)', border: '1px solid var(--rule, #DDE4D9)', borderRadius: 14, padding: '32px 24px' };
const eyebrow = { fontFamily: 'var(--font-mono, monospace)', fontSize: 11, letterSpacing: '0.11em', textTransform: 'uppercase', color: 'var(--muted, #5E6B5F)', margin: '0 0 14px' };
const h1 = { fontSize: 25, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--ink, #101A13)', margin: '0 0 8px' };
const sub = { fontSize: 15, lineHeight: 1.6, color: 'var(--muted, #5E6B5F)', margin: '0 0 26px' };
const qLabel = { fontSize: 16, fontWeight: 600, color: 'var(--ink, #101A13)', margin: '0 0 12px' };
const optTitle = { display: 'block', fontSize: 15.5, fontWeight: 600, color: 'var(--ink, #101A13)', marginBottom: 3 };
const optDesc = { display: 'block', fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted, #5E6B5F)' };
const fieldLabel = { display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--ink, #101A13)', margin: '0 0 6px' };
const hint = { fontSize: 12.5, color: 'var(--muted, #5E6B5F)', margin: '8px 2px 0' };
const input = { width: '100%', boxSizing: 'border-box', border: '1px solid var(--rule, #DDE4D9)', borderRadius: 9, padding: '13px 14px', fontSize: 15, color: 'var(--ink, #101A13)', outline: 'none', background: 'transparent' };

function optionStyle(active) {
  return {
    textAlign: 'left',
    padding: '15px 16px',
    borderRadius: 11,
    border: `1.5px solid ${active ? 'var(--green, #096B17)' : 'var(--rule, #DDE4D9)'}`,
    background: active ? 'rgba(9,107,23,0.05)' : 'var(--card, #fff)',
    cursor: 'pointer',
    transition: 'border-color .12s, background .12s',
  };
}
function cta(disabled) {
  return {
    width: '100%', marginTop: 24, padding: '14px 16px', fontSize: 15, fontWeight: 600,
    color: '#fff', background: disabled ? '#C9B8AE' : 'var(--orange, #F26A1B)',
    border: 'none', borderRadius: 9, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background .15s',
  };
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <WebsiteBranch />
    </Suspense>
  );
}
