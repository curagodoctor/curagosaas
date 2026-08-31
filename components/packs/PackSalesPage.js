'use client';

import { useEffect, useRef, useState } from 'react';
import { Schibsted_Grotesk, Newsreader, IBM_Plex_Mono } from 'next/font/google';

// Fonts from the supplied design — scoped to this page via CSS variables, NOT
// loaded globally into the marketing layout.
const psSans = Schibsted_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--ps-sans', display: 'swap' });
const psSerif = Newsreader({ subsets: ['latin'], style: ['italic'], weight: ['300', '400', '500'], variable: '--ps-serif', display: 'swap' });
const psMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--ps-mono', display: 'swap' });

const MONO = 'var(--ps-mono),ui-monospace,monospace';
const SERIF = 'var(--ps-serif),Georgia,serif';

// Small helpers ------------------------------------------------------------
const has = (v) => typeof v === 'string' && v.trim().length > 0;
const hasList = (v) => Array.isArray(v) && v.length > 0;
const on = (s) => !s || s.enabled !== false; // section shows unless explicitly disabled

function Eyebrow({ n, label }) {
  return (
    <div data-reveal style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 24 }}>
      <span style={{ fontFamily: MONO, fontSize: 11.5, color: 'var(--orange)', letterSpacing: '.14em' }}>{n}</span>
      <span style={{ fontFamily: MONO, fontSize: 11.5, color: 'var(--ink-30)', letterSpacing: '.14em' }}>{label}</span>
    </div>
  );
}

export default function PackSalesPage({ pack, onBuy }) {
  const rootRef = useRef(null);
  const [openFaq, setOpenFaq] = useState(0);
  const [openMission, setOpenMission] = useState(-1);
  const [showAll, setShowAll] = useState(false);

  const sp = pack?.salesPage || {};
  const price = pack?.price || { total: 0, pct: 0, free: true };
  const priceLabel = price.free ? 'Free' : `₹${(price.total || 0).toLocaleString('en-IN')}`;

  // Reveal-on-scroll — same behaviour as the source design, reduced-motion aware.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    const els = Array.from(root.querySelectorAll('[data-reveal]'));
    if (reduce) { els.forEach((el) => { el.style.opacity = '1'; }); return; }
    els.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(22px)';
      el.style.transition = 'opacity .6s cubic-bezier(.2,.7,.2,1), transform .6s cubic-bezier(.2,.7,.2,1)';
    });
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'none'; io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pack]);

  // ---- Section data with fallbacks --------------------------------------
  const hero = sp.hero || {};
  const heroTitle = has(hero.title) ? hero.title : pack.title;
  const heroSub = has(hero.subtitle) ? hero.subtitle : pack.tagline;
  const heroDesc = has(hero.description) ? hero.description : pack.summary;
  const heroImages = hasList(hero.images) ? hero.images : (has(pack.coverImage) ? [pack.coverImage] : []);
  const heroBadges = hasList(hero.badges) ? hero.badges : [pack.category, price.free ? 'FREE' : 'LIFETIME ACCESS'].filter(Boolean);
  const heroCta = has(sp.offer?.ctaLabel) ? sp.offer.ctaLabel : (price.free ? 'Get it free' : `Start ${pack.title}`);

  const problem = sp.problem || {};
  const bigIdea = sp.bigIdea || {};
  const video = sp.videoDemo || {};
  const promise = sp.honestPromise || {};
  const curriculum = sp.curriculum || {};
  const offer = sp.offer || {};
  const faq = sp.faq || {};
  const finalCta = sp.finalCta || {};
  const founder = sp.founder || {};

  const items = Array.isArray(pack.items) ? pack.items : [];
  const previewCount = Math.max(1, Number(curriculum.previewCount) || 5);
  const shownItems = showAll ? items : items.slice(0, previewCount);

  const offerBenefits = hasList(offer.benefits) ? offer.benefits : (hasList(pack.outcomes) ? pack.outcomes.slice(0, 3) : []);
  const promiseNegs = hasList(promise.negatives) ? promise.negatives : [];

  const cardH1 = { fontSize: 'clamp(26px,3.6vw,42px)', lineHeight: 1.08, letterSpacing: '-.025em', margin: '0 0 10px', fontWeight: 800, maxWidth: 660 };
  const secPad = { padding: 'clamp(40px,5.5vw,80px) 0', borderBottom: '1px solid var(--border)' };
  const wrap = { maxWidth: 1080, margin: '0 auto', padding: '0 clamp(16px,4vw,40px)' };

  const CTA = ({ label, big }) => (
    <button
      onClick={onBuy}
      style={{
        background: 'var(--orange)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer',
        fontSize: big ? 17 : 15.5, padding: big ? '16px 34px' : '14px 26px', borderRadius: 12,
        boxShadow: '0 10px 26px rgba(232,114,46,.35)',
      }}
    >
      {label} →
    </button>
  );

  return (
    <div ref={rootRef} className={`packsales ${psSans.variable} ${psSerif.variable} ${psMono.variable}`} style={{ fontFamily: 'var(--ps-sans),system-ui,sans-serif', color: 'var(--ink)' }}>
      <style>{`
        .packsales{
          --forest:#0A4D18;--forest-2:#083b13;--forest-3:#05300f;
          --cream-2:#F7F8F6;--paper:#FCFCFA;--card:#fff;--border:#E4E7E2;
          --orange:#FF7A1A;--orange-2:#E86A0A;--leaf:#53CD81;--leaf-2:#8FE6AE;--leaf-ink:#09B117;
          --ink:#111827;--ink-70:#4B5563;--ink-50:#6B7280;--ink-30:#9CA3AF;
          background:var(--paper);
        }
        .packsales *{box-sizing:border-box}
        .packsales img{max-width:100%;display:block}
        @keyframes ps-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.8)}}
      `}</style>

      {/* Thin parent-site bar */}
      <div style={{ background: 'var(--forest-3)', color: 'rgba(255,255,255,.7)', fontFamily: MONO, fontSize: 11.5, letterSpacing: '.1em' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '9px clamp(16px,4vw,40px)', display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--leaf)', animation: 'ps-pulse 2s infinite' }} />
            A CURAGO BUILDER PACK · SOLD SEPARATELY
          </span>
        </div>
      </div>

      {/* 01 · HERO */}
      {on(hero) && (
        <section style={{ background: 'var(--paper)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(36px,5vw,68px) clamp(16px,4vw,40px) 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 'clamp(28px,4vw,56px)', alignItems: 'start' }}>
            <div>
              {hasList(heroBadges) && (
                <div data-reveal style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 26 }}>
                  {heroBadges.map((b, i) => (
                    <span key={i} style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.16em', background: i === 0 ? 'var(--forest)' : 'transparent', color: i === 0 ? 'var(--leaf-2)' : 'var(--ink-50)', border: i === 0 ? 'none' : '1px solid var(--border)', padding: '6px 11px', borderRadius: 7, fontWeight: 600 }}>{b}</span>
                  ))}
                </div>
              )}
              <h1 data-reveal style={{ fontWeight: 800, fontSize: 'clamp(34px,5.2vw,60px)', lineHeight: 1, letterSpacing: '-.035em', margin: '0 0 6px' }}>{heroTitle}</h1>
              {has(heroSub) && <p data-reveal style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(24px,3.4vw,40px)', lineHeight: 1.05, margin: '0 0 24px', color: 'var(--leaf-ink)' }}>{heroSub}</p>}
              {has(heroDesc) && <p data-reveal style={{ fontSize: 'clamp(16px,1.35vw,18px)', lineHeight: 1.6, color: 'var(--ink-70)', maxWidth: 520, margin: '0 0 22px' }}>{heroDesc}</p>}
              {has(hero.supportingLine) && <p data-reveal style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--ink)', margin: '0 0 30px', paddingLeft: 16, borderLeft: '2px solid var(--orange)', fontWeight: 500, whiteSpace: 'pre-line' }}>{hero.supportingLine}</p>}
              <div data-reveal style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 30 }}>
                <CTA label={heroCta} big />
                <span style={{ fontFamily: MONO, fontSize: 12, color: 'var(--ink-50)' }}>{priceLabel}{!price.free && ' · incl. GST'}</span>
              </div>
              {hasList(hero.specs) && (
                <div data-reveal style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', maxWidth: 520 }}>
                  {hero.specs.map((s, i) => (
                    <div key={i} style={{ background: 'var(--card)', padding: '16px 18px' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.1 }}>{s.value}</div>
                      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '.1em', color: 'var(--ink-50)', marginTop: 5 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {hasList(heroImages) && (
              <div data-reveal style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: 20, background: 'var(--card)', padding: 12, boxShadow: '0 20px 50px rgba(17,24,39,.07)' }}>
                  <img src={heroImages[0]} alt={heroTitle} style={{ borderRadius: 12, width: '100%' }} />
                </div>
                {heroImages.length > 1 && (
                  <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                    {heroImages.slice(1).map((src, i) => (
                      <img key={i} src={src} alt="" style={{ flex: '0 0 auto', height: 96, borderRadius: 12, border: '1px solid var(--border)' }} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {hasList(hero.ticker) && (
            <div style={{ maxWidth: 1240, margin: 'clamp(30px,4vw,48px) auto 0', padding: '0 clamp(16px,4vw,40px)' }}>
              <div style={{ borderTop: '1px solid var(--border)', padding: '18px 0', display: 'flex', flexWrap: 'wrap', gap: '20px 34px', alignItems: 'center', fontFamily: MONO, fontSize: 11.5, letterSpacing: '.12em', color: 'var(--ink-50)' }}>
                {hero.ticker.map((t, i) => <span key={i}>{t}</span>)}
              </div>
            </div>
          )}
        </section>
      )}

      <div style={wrap}>
        {/* 02 · PROBLEM */}
        {on(problem) && (has(problem.title) || hasList(problem.bullets)) && (
          <section style={secPad}>
            <Eyebrow n="02" label="THE GAP" />
            {has(problem.title) && <h2 data-reveal style={cardH1}>{problem.title}</h2>}
            {has(problem.subtitle) && <p data-reveal style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(20px,2.4vw,28px)', lineHeight: 1.25, color: 'var(--ink-70)', margin: '0 0 32px' }}>{problem.subtitle}</p>}
            {hasList(problem.bullets) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                {problem.bullets.map((t, i) => (
                  <div key={i} data-reveal style={{ background: 'var(--card)', padding: '20px', display: 'flex', gap: 12, alignItems: 'baseline' }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--orange)', flex: 'none' }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ fontSize: 16.5, fontWeight: 600, letterSpacing: '-.01em' }}>{t}</span>
                  </div>
                ))}
              </div>
            )}
            {has(problem.conclusion) && <p data-reveal style={{ margin: '28px 0 0', fontSize: 'clamp(18px,2.2vw,24px)', lineHeight: 1.4, color: 'var(--ink)', maxWidth: 640, fontWeight: 500 }}>{problem.conclusion}</p>}
          </section>
        )}

        {/* 03 · BIG IDEA */}
        {on(bigIdea) && (has(bigIdea.title) || hasList(bigIdea.bullets)) && (
          <section style={secPad}>
            <Eyebrow n="03" label="HOW IT WORKS" />
            {has(bigIdea.title) && <h2 data-reveal style={cardH1}>{bigIdea.title}</h2>}
            {has(bigIdea.subtitle1) && <p data-reveal style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(20px,2.4vw,28px)', lineHeight: 1.25, color: 'var(--leaf-ink)', margin: '0 0 30px' }}>{bigIdea.subtitle1}</p>}
            {hasList(bigIdea.loop) && (
              <div data-reveal style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
                {bigIdea.loop.map((t, i) => (
                  <div key={i} style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: 6, padding: '18px', borderRadius: 14, border: `1px solid ${i === 0 ? 'rgba(9,177,23,.35)' : 'var(--border)'}`, background: i === 0 ? 'rgba(9,177,23,.06)' : 'var(--card)' }}>
                    <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '.12em', color: 'var(--ink-30)' }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.01em' }}>{t}</span>
                  </div>
                ))}
              </div>
            )}
            {hasList(bigIdea.bullets) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginBottom: 30 }}>
                {bigIdea.bullets.map((b, i) => (
                  <div key={i} data-reveal style={{ border: '1px solid var(--border)', borderRadius: 16, background: 'var(--card)', padding: 22 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(9,177,23,.1)', border: '1px solid rgba(9,177,23,.35)', display: 'grid', placeItems: 'center', color: 'var(--leaf-ink)', fontSize: 13, fontWeight: 800, marginBottom: 14 }}>✓</div>
                    {has(b.title) && <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.01em', marginBottom: 6 }}>{b.title}</div>}
                    {has(b.desc) && <div style={{ fontSize: 14, color: 'var(--ink-70)', lineHeight: 1.55 }}>{b.desc}</div>}
                  </div>
                ))}
              </div>
            )}
            {has(bigIdea.conclusion) && (
              <div data-reveal style={{ background: 'var(--forest)', color: '#fff', borderRadius: 20, padding: 'clamp(24px,3.4vw,40px)' }}>
                <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(20px,2.6vw,30px)', lineHeight: 1.3, margin: 0, whiteSpace: 'pre-line' }}>{bigIdea.conclusion}</p>
              </div>
            )}
          </section>
        )}

        {/* 04 · VIDEO DEMO — only when a video URL is set */}
        {on(video) && has(video.videoUrl) && (
          <section style={secPad}>
            <Eyebrow n="04" label="WALKTHROUGH" />
            {has(video.title) && <h2 data-reveal style={cardH1}>{video.title}</h2>}
            {has(video.description) && <p data-reveal style={{ fontSize: 17, color: 'var(--ink-70)', margin: '0 0 24px' }}>{video.description}</p>}
            <div data-reveal style={{ border: '1px solid var(--border)', borderRadius: 22, overflow: 'hidden', background: 'var(--card)', boxShadow: '0 20px 50px rgba(17,24,39,.08)' }}>
              <div style={{ aspectRatio: '16/9', background: '#000' }}>
                <video src={video.videoUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {hasList(video.flow) && (
                <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                  {video.flow.map((t, i) => (
                    <span key={i} style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.12em', color: i === 0 ? 'var(--leaf-ink)' : 'var(--ink-50)', border: `1px solid ${i === 0 ? 'rgba(9,177,23,.35)' : 'var(--border)'}`, borderRadius: 8, padding: '7px 12px' }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
            {has(video.caption) && <p data-reveal style={{ fontFamily: MONO, fontSize: 11.5, color: 'var(--ink-30)', textAlign: 'center', marginTop: 12, letterSpacing: '.08em' }}>{video.caption}</p>}
          </section>
        )}

        {/* 05 · HONEST PROMISE */}
        {on(promise) && (has(promise.title) || hasList(promiseNegs) || has(promise.highlight)) && (
          <section style={secPad}>
            <Eyebrow n="05" label="HONEST PROMISE" />
            {has(promise.title) && <h2 data-reveal style={cardH1}>{promise.title}</h2>}
            {has(promise.intro) && <p data-reveal style={{ fontSize: 17, color: 'var(--ink-70)', margin: '0 0 24px' }}>{promise.intro}</p>}
            {hasList(promiseNegs) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
                {promiseNegs.map((t, i) => (
                  <div key={i} data-reveal style={{ background: 'var(--card)', padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
                    <span style={{ flex: 'none', color: 'var(--ink-30)', fontSize: 15, fontWeight: 700 }}>✕</span>
                    <span style={{ fontSize: 16.5, fontWeight: 600, color: 'var(--ink-70)', textDecoration: 'line-through', textDecorationColor: 'var(--ink-30)' }}>{t}</span>
                  </div>
                ))}
              </div>
            )}
            {(has(promise.highlight) || has(promise.conclusion)) && (
              <div data-reveal style={{ border: '1px solid rgba(9,177,23,.3)', background: 'rgba(9,177,23,.05)', borderRadius: 20, padding: 'clamp(24px,3.4vw,38px)' }}>
                {has(promise.highlight) && <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(20px,2.6vw,30px)', lineHeight: 1.3, margin: '0 0 12px', color: 'var(--leaf-ink)' }}>{promise.highlight}</p>}
                {has(promise.conclusion) && <p style={{ fontSize: 16.5, color: 'var(--ink)', margin: 0, maxWidth: 620, lineHeight: 1.6 }}>{promise.conclusion}</p>}
              </div>
            )}
          </section>
        )}

        {/* 06 · CURRICULUM — from the pack's missions/tasks */}
        {on(curriculum) && hasList(items) && (
          <section style={secPad}>
            <Eyebrow n="06" label="CURRICULUM" />
            <div data-reveal style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ ...cardH1, margin: 0 }}>{has(curriculum.title) ? curriculum.title : `${items.length} ${pack.itemLabel}. One complete workflow.`}</h2>
              <span style={{ fontFamily: MONO, fontSize: 11.5, color: 'var(--ink-30)', letterSpacing: '.12em' }}>{shownItems.length} / {items.length} SHOWN</span>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', background: 'var(--card)' }}>
              {shownItems.map((m, i) => {
                const open = openMission === i;
                return (
                  <div key={i} style={{ borderBottom: '1px solid var(--border)', background: open ? 'var(--cream-2)' : 'transparent', transition: 'background .25s' }}>
                    <button onClick={() => setOpenMission(open ? -1 : i)} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'inherit' }}>
                      <span style={{ flex: 'none', fontFamily: MONO, fontSize: 11.5, color: 'var(--orange)', width: 24 }}>{String(m.n).padStart(2, '0')}</span>
                      <span style={{ flex: 1, fontSize: 16.5, fontWeight: 650, letterSpacing: '-.01em', color: 'var(--ink)' }}>{m.title}</span>
                      {has(m.desc) && <span style={{ flex: 'none', fontSize: 20, color: 'var(--leaf-ink)', lineHeight: 1, transition: 'transform .3s', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>}
                    </button>
                    {has(m.desc) && (
                      <div style={{ overflow: 'hidden', transition: 'max-height .35s ease, opacity .3s', maxHeight: open ? 260 : 0, opacity: open ? 1 : 0 }}>
                        <p style={{ fontSize: 14.5, color: 'var(--ink-70)', margin: 0, padding: '0 20px 20px 60px', lineHeight: 1.6 }}>{m.desc}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              {items.length > previewCount && (
                <button onClick={() => { setShowAll(!showAll); setOpenMission(-1); }} style={{ width: '100%', background: 'var(--cream-2)', border: 'none', borderTop: '1px solid var(--border)', padding: 18, cursor: 'pointer', fontFamily: MONO, fontSize: 11.5, letterSpacing: '.14em', fontWeight: 600, color: showAll ? 'var(--ink-50)' : 'var(--leaf-ink)' }}>
                  {showAll ? 'SHOW FEWER ↑' : `SHOW ALL ${items.length} ${pack.itemLabel.toUpperCase()} ↓`}
                </button>
              )}
            </div>
          </section>
        )}

        {/* 07 · OFFER */}
        {on(offer) && (
          <section style={secPad}>
            <Eyebrow n="07" label="THE OFFER" />
            <div data-reveal style={{ background: 'var(--forest)', color: '#fff', borderRadius: 24, padding: 'clamp(26px,4vw,48px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 'clamp(24px,3vw,44px)', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 'clamp(26px,3.4vw,40px)', lineHeight: 1.05, letterSpacing: '-.03em', margin: '0 0 22px', fontWeight: 800 }}>{has(offer.title) ? offer.title : `Master ${pack.title}.`}</h2>
                {hasList(offerBenefits) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {offerBenefits.map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 2px', borderBottom: '1px solid rgba(255,255,255,.13)' }}>
                        <span style={{ flex: 'none', width: 22, height: 22, borderRadius: '50%', background: 'rgba(83,205,129,.2)', border: '1px solid var(--leaf)', display: 'grid', placeItems: 'center', color: 'var(--leaf-2)', fontSize: 11.5, fontWeight: 800 }}>✓</span>
                        <span style={{ fontSize: 16, fontWeight: 600 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ background: 'rgba(0,0,0,.22)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 18, padding: 'clamp(22px,3vw,32px)', textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(38px,6vw,54px)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1 }}>{priceLabel}</div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: 'var(--leaf-2)', marginTop: 6, marginBottom: 22 }}>{price.free ? 'No payment' : 'Including GST'}</div>
                <button onClick={onBuy} style={{ display: 'block', width: '100%', background: 'var(--orange)', color: '#fff', fontWeight: 700, fontSize: 16.5, padding: 16, borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 10px 26px rgba(232,114,46,.35)' }}>{heroCta} →</button>
                {has(offer.supportingLine) && <p style={{ fontFamily: MONO, fontSize: 11.5, color: 'rgba(255,255,255,.55)', margin: '16px 0 0' }}>{offer.supportingLine}</p>}
              </div>
            </div>
          </section>
        )}

        {/* 08 · FAQ */}
        {on(faq) && hasList(faq.items) && (
          <section style={secPad}>
            <Eyebrow n="08" label="FAQ" />
            <h2 data-reveal style={{ ...cardH1, marginBottom: 28 }}>{has(faq.title) ? faq.title : 'Frequently asked questions'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {faq.items.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={i} data-reveal style={{ borderBottom: '1px solid var(--border)' }}>
                    <button onClick={() => setOpenFaq(open ? -1 : i)} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '20px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, fontFamily: 'inherit' }}>
                      <span style={{ fontSize: 'clamp(16px,1.5vw,18px)', fontWeight: 700, color: 'var(--ink)' }}>{f.q}</span>
                      <span style={{ flex: 'none', fontSize: 23, color: 'var(--leaf-ink)', lineHeight: 1, transition: 'transform .3s', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
                    </button>
                    <div style={{ overflow: 'hidden', transition: 'max-height .35s ease, opacity .3s', maxHeight: open ? 320 : 0, opacity: open ? 1 : 0 }}>
                      <p style={{ fontSize: 15.5, color: 'var(--ink-70)', margin: 0, padding: '0 2px 22px', lineHeight: 1.65, maxWidth: 660 }}>{f.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* 09 · FINAL CTA */}
      {on(finalCta) && (
        <section style={{ background: 'radial-gradient(120% 100% at 50% 0%,#0E6B25,var(--forest-2) 62%,var(--forest-3))', color: '#fff', padding: 'clamp(56px,8vw,110px) clamp(16px,4vw,40px)', textAlign: 'center' }}>
          <div style={{ maxWidth: 780, margin: '0 auto' }}>
            <h2 data-reveal style={{ fontSize: 'clamp(30px,5vw,58px)', lineHeight: 1, letterSpacing: '-.03em', margin: '0 0 14px', fontWeight: 800 }}>{has(finalCta.title) ? finalCta.title : `Master ${pack.title}.`}</h2>
            {has(finalCta.subtitle) && <p data-reveal style={{ fontSize: 'clamp(17px,1.6vw,21px)', color: 'rgba(255,255,255,.8)', margin: '0 auto 30px' }}>{finalCta.subtitle}</p>}
            <div data-reveal style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 'clamp(28px,3.8vw,40px)', fontWeight: 800, letterSpacing: '-.03em' }}>{priceLabel} {!price.free && <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 400, color: 'var(--leaf-2)' }}>incl. GST</span>}</div>
              <CTA label={has(finalCta.ctaLabel) ? finalCta.ctaLabel : heroCta} big />
              {has(finalCta.supportingLine) && <span style={{ fontFamily: MONO, fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{finalCta.supportingLine}</span>}
            </div>
          </div>
        </section>
      )}

      {/* FOUNDER — only when filled */}
      {on(founder) && (has(founder.body) || has(founder.name)) && (
        <section style={{ background: 'var(--cream-2)', padding: 'clamp(44px,6vw,84px) clamp(16px,4vw,40px)', borderTop: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 980, margin: '0 auto', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 'clamp(26px,4vw,48px)', display: 'flex', flexWrap: 'wrap', gap: 'clamp(24px,4vw,44px)', alignItems: 'center' }}>
            {has(founder.photo) && (
              <div data-reveal style={{ flex: '0 0 auto' }}>
                <div style={{ width: 'clamp(130px,18vw,180px)', aspectRatio: 1, borderRadius: 22, overflow: 'hidden', background: 'var(--cream-2)', border: '1px solid var(--border)' }}>
                  <img src={founder.photo} alt={founder.name || 'Founder'} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} />
                </div>
              </div>
            )}
            <div data-reveal style={{ flex: '1 1 360px', minWidth: 270 }}>
              {has(founder.eyebrow) && <div style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: '.16em', color: 'var(--leaf-ink)', marginBottom: 14 }}>{founder.eyebrow}</div>}
              {has(founder.intro) && <p style={{ fontSize: 'clamp(17px,1.5vw,20px)', lineHeight: 1.6, color: 'var(--ink)', margin: '0 0 14px' }}>{founder.intro}</p>}
              {has(founder.body) && <p style={{ fontSize: 'clamp(15.5px,1.35vw,17.5px)', lineHeight: 1.65, color: 'var(--ink-70)', margin: '0 0 18px' }}>{founder.body}</p>}
              {has(founder.name) && <div style={{ fontWeight: 800, fontSize: 17 }}>{founder.name}</div>}
              {has(founder.credential) && <div style={{ fontFamily: MONO, fontSize: 12.5, color: 'var(--ink-50)' }}>{founder.credential}</div>}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
