'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Schibsted_Grotesk, Newsreader, IBM_Plex_Mono } from 'next/font/google';

const sans = Schibsted_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--dos-sans', display: 'swap' });
const serif = Newsreader({ subsets: ['latin'], style: 'italic', weight: ['300', '400'], variable: '--dos-serif', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--dos-mono', display: 'swap' });

const SEARCHES = [
  { kind: 'SYMPTOM', text: 'knee pain when climbing stairs' },
  { kind: 'DISEASE', text: 'is fatty liver reversible' },
  { kind: 'TREATMENT', text: 'best treatment for varicose veins' },
  { kind: 'PROCEDURE', text: 'laparoscopic surgery recovery time' },
  { kind: 'QUESTION', text: 'which doctor treats this' },
];
const SEARCH_TYPES = [
  { word: 'Symptoms', note: 'The first thing a worried patient types.' },
  { word: 'Diseases', note: 'They want to understand before they book.' },
  { word: 'Treatments', note: 'Comparing options, not doctors.' },
  { word: 'Procedures', note: 'Recovery, risk, cost.' },
  { word: 'Questions', note: 'Everything in between.' },
];
const WE_DO = [
  { who: 'CURAGO', what: 'We prepare the strategy.', accent: false },
  { who: 'CURAGO', what: 'We build the pages for the website.', accent: false },
  { who: 'CURAGO', what: 'We create the content for your Google Business Profile.', accent: false },
  { who: 'CURAGO', what: 'We keep expanding the foundation.', accent: false },
  { who: 'YOU', what: 'You review and approve.', accent: true },
];
const GRAPH = [
  { tag: 'ROOT', title: 'Your specialty', sub: 'Everything downstream grows from this one answer.', root: true },
  { tag: 'LAYER 1', title: 'Your expertise', sub: 'What you actually do, in your words.' },
  { tag: 'LAYER 2', title: 'Diseases you treat', sub: 'Reviewed and approved by you.' },
  { tag: 'LAYER 3', title: 'Treatments and procedures', sub: 'Mapped to each disease you treat.' },
  { tag: 'LAYER 4', title: 'Symptoms and questions', sub: 'The language patients actually search with.' },
  { tag: 'OUTPUT', title: 'Pages, blogs, GBP content', sub: 'Published on a schedule, month after month.', output: true },
];
const FREE_ITEMS = [
  { title: 'Your CuraGo website', body: 'Built automatically from your profile and practice information.' },
  { title: 'Your practice information', body: 'Structured once, then reused everywhere we publish.' },
  { title: 'Your first content', body: 'A blog page created from your own expertise, not a template.' },
  { title: 'Your Google foundation', body: 'The groundwork for your Google Business Profile presence.' },
];
const STEPS = [
  { n: '1', who: 'YOU', title: 'Tell us about your practice.', body: 'Answer a few questions. CuraGo turns your answers into structured information.', accent: true },
  { n: '2', who: 'CURAGO', title: 'We build your website.', body: 'Your website is created automatically from your profile and practice information.' },
  { n: '3', who: 'CURAGO', title: 'We build around your expertise.', body: 'Your expertise becomes the foundation around which your practice is built.' },
  { n: '4', who: 'CURAGO', title: 'CuraGo prepares the work.', body: 'Content is created for your website and your Google Business Profile.' },
  { n: '5', who: 'YOU', title: 'You review and approve.', body: "You don't need to write, research or figure out what to do next.", accent: true },
  { n: '6', who: 'RESULT', title: 'Your organic presence keeps growing.', body: 'Month after month, your digital practice becomes deeper and easier for patients to discover.', result: true },
];
const JOURNEY = [
  { n: '01', title: 'Appear', body: 'Build the foundation so patients can find you.', accent: 'var(--dos-orange)' },
  { n: '02', title: 'Compete', body: 'Build depth around your expertise.', accent: 'var(--dos-leaf)' },
  { n: '03', title: 'Dominate', body: 'Keep expanding your organic presence until your practice becomes a meaningful source of information for the patients you want to reach.', accent: 'var(--dos-forest)' },
];

export default function DominateOrganicSearch() {
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const start = () => router.push('/signup?entry=practice-os');

  return (
    <div className={`dos ${sans.variable} ${serif.variable} ${mono.variable}`}>
      <style>{CSS}</style>

      {/* HEADER */}
      <header className="dos-header">
        <nav className="dos-nav">
          <a href="#top" onClick={() => setNavOpen(false)} className="dos-logo">
            <img src="/curago-logo.png" alt="CuraGo" style={{ height: 42, width: 'auto', objectFit: 'contain' }} />
          </a>
          <div className="dos-nav-links">
            <a href="#problem">The problem</a>
            <a href="#built">What gets built</a>
            <a href="#how">How it works</a>
            <a href="#journey">The journey</a>
            <button onClick={start} className="dos-btn-orange">Get Early Access</button>
          </div>
          <button className="dos-burger" aria-label="Menu" onClick={() => setNavOpen((v) => !v)}>
            <span /><span /><span />
          </button>
        </nav>
        {navOpen && (
          <div className="dos-mobile-menu">
            {[['#problem', 'The problem'], ['#built', 'What gets built'], ['#how', 'How it works'], ['#journey', 'The journey']].map(([h, t]) => (
              <a key={h} href={h} onClick={() => setNavOpen(false)}>{t}</a>
            ))}
            <button onClick={start} className="dos-btn-orange" style={{ marginTop: 10 }}>Get Early Access</button>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="top" className="dos-hero">
        <div className="dos-wrap dos-hero-inner">
          <div style={{ flex: '1 1 500px', minWidth: 290 }}>
            <div className="dos-eyebrow-light"><span className="dos-dot" /> ONE PRODUCT · FREE TO START</div>
            <h1 className="dos-h1">Dominate<br />Organic Search.</h1>
            <p className="dos-hero-serif">Be found by the patients who are looking for you.</p>
            <p className="dos-hero-lead">CuraGo helps doctors build and continuously strengthen their organic presence on Google — starting with your own website first, then your Google Business Profile, and growing from there.</p>
            <p className="dos-hero-mono">APPEAR. COMPETE. DOMINATE.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
              <button onClick={start} className="dos-btn-orange dos-btn-lg">Start Now</button>
              <a href="#how" className="dos-btn-ghost">See how it works</a>
            </div>
            <p className="dos-hero-fine">No subscription. No payment required to build the foundation.</p>
          </div>
          <div style={{ flex: '1 1 360px', minWidth: 280 }}>
            <div className="dos-search-card">
              <div className="dos-mono-label">WHAT PATIENTS ACTUALLY SEARCH</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SEARCHES.map((q) => (
                  <div key={q.text} className="dos-search-row">
                    <span className="dos-search-kind">{q.kind}</span>
                    <span style={{ fontSize: 14.5, color: 'var(--dos-ink)', lineHeight: 1.35 }}>{q.text}</span>
                  </div>
                ))}
              </div>
              <div className="dos-search-note">None of these searches include your name. All of them could end at your practice.</div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problem" className="dos-sec" style={{ background: 'var(--dos-paper)' }}>
        <div className="dos-wrap dos-split">
          <div style={{ flex: '1 1 440px', minWidth: 290 }}>
            <div className="dos-eyebrow">01 · THE PROBLEM</div>
            <h2 className="dos-h2">Your patients are searching. Are they finding you?</h2>
            <p className="dos-p">Patients don&apos;t only search for doctors by name. They search for symptoms. Diseases. Treatments. Procedures. Questions.</p>
            <p className="dos-p" style={{ color: 'var(--dos-ink)', fontWeight: 600 }}>Your opportunity is to become the doctor whose expertise appears when those searches happen.</p>
          </div>
          <div className="dos-grid" style={{ flex: '1 1 380px', minWidth: 280, '--min': '150px' }}>
            {SEARCH_TYPES.map((t) => (
              <div key={t.word} className="dos-card">
                <div className="dos-serif-word">{t.word}</div>
                <div style={{ fontSize: 13, color: 'var(--dos-ink-50)', marginTop: 7, lineHeight: 1.5 }}>{t.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MID CTA */}
      <section className="dos-midcta">
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="dos-h2" style={{ color: '#fff', margin: '0 0 12px' }}>Ready to be found?</h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,.8)', lineHeight: 1.6, margin: '0 0 22px' }}>Build your foundation with CuraGo. It&apos;s free to start.</p>
          <button onClick={start} className="dos-btn-orange dos-btn-lg">Start Now</button>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.58)', margin: '16px 0 0' }}>You can start with a subdomain and connect your custom domain when you&apos;re ready.</p>
        </div>
      </section>

      {/* THE ANSWER */}
      <section className="dos-sec" style={{ background: '#fff' }}>
        <div className="dos-wrap dos-split">
          <div style={{ flex: '1 1 430px', minWidth: 290 }}>
            <div className="dos-eyebrow">02 · THE CURAGO ANSWER</div>
            <h2 className="dos-h2">Build your organic presence around what you actually know.</h2>
            <p className="dos-p">CuraGo understands your specialty, expertise and practice, and turns them into a structured digital presence that keeps growing over time.</p>
          </div>
          <div style={{ flex: '1 1 400px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {WE_DO.map((w, i) => (
              <div key={i} className="dos-wedo" style={{ background: w.accent ? 'var(--dos-orange-soft)' : 'var(--dos-leaf-soft)', borderColor: w.accent ? '#FFD9BC' : 'var(--dos-leaf-bd)' }}>
                <span className="dos-wedo-tag" style={{ background: w.accent ? 'var(--dos-orange)' : '#fff', color: w.accent ? '#fff' : '#0A4D18' }}>{w.who}</span>
                <span style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--dos-ink)', lineHeight: 1.35 }}>{w.what}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT GETS BUILT */}
      <section id="built" className="dos-sec" style={{ background: 'var(--dos-forest)', color: '#fff' }}>
        <div className="dos-wrap">
          <div style={{ maxWidth: 760, marginBottom: 'clamp(26px,3.6vw,44px)' }}>
            <div className="dos-eyebrow" style={{ color: 'var(--dos-leaf-2)' }}>03 · WHAT GETS BUILT</div>
            <h2 className="dos-h2" style={{ color: '#fff' }}>Your digital practice grows from your expertise.</h2>
            <p className="dos-p" style={{ color: 'rgba(255,255,255,.78)' }}>Your website isn&apos;t a collection of pages. It&apos;s built around your practice graph — and the graph keeps expanding.</p>
          </div>
          <div className="dos-grid" style={{ '--min': '190px' }}>
            {GRAPH.map((g) => (
              <div key={g.tag} className="dos-graph-card" style={{ background: g.root ? 'rgba(255,122,26,.16)' : g.output ? 'rgba(83,205,129,.17)' : 'rgba(255,255,255,.07)', borderColor: g.root ? 'rgba(255,122,26,.5)' : g.output ? 'rgba(143,230,174,.55)' : 'rgba(255,255,255,.17)' }}>
                <div className="dos-mono-tag" style={{ color: g.root ? 'var(--dos-orange)' : 'var(--dos-leaf-2)' }}>{g.tag}</div>
                <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>{g.title}</div>
                <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,.68)', lineHeight: 1.55 }}>{g.sub}</div>
              </div>
            ))}
          </div>
          <p className="dos-serif-quote">Every layer feeds the next. Content is written from the layer above it — never invented around a keyword.</p>
        </div>
      </section>

      {/* FREE */}
      <section className="dos-sec" style={{ background: 'var(--dos-paper)' }}>
        <div className="dos-wrap">
          <div style={{ maxWidth: 720, marginBottom: 'clamp(24px,3.4vw,40px)' }}>
            <div className="dos-eyebrow">04 · FREE</div>
            <h2 className="dos-h2">Start with the foundation. It&apos;s free.</h2>
            <p className="dos-p">Build your CuraGo website, establish your practice information, create your first content and set up the foundation for your Google presence. No subscription. No payment required to build the foundation.</p>
          </div>
          <div className="dos-grid" style={{ '--min': '230px' }}>
            {FREE_ITEMS.map((f) => (
              <div key={f.title} className="dos-free-card">
                <div className="dos-mono-tag" style={{ color: 'var(--dos-leaf-ink)', marginBottom: 10 }}>INCLUDED</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 7px', letterSpacing: '-.01em' }}>{f.title}</h3>
                <p style={{ fontSize: 14.5, color: 'var(--dos-ink-70)', lineHeight: 1.58, margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="dos-sec" style={{ background: '#fff', borderTop: '1px solid var(--dos-border)' }}>
        <div className="dos-wrap">
          <div style={{ maxWidth: 760, marginBottom: 'clamp(26px,3.6vw,44px)' }}>
            <div className="dos-eyebrow">05 · HOW IT WORKS</div>
            <h2 className="dos-h2">You provide the expertise.<br /><span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400 }}>CuraGo builds the presence.</span></h2>
          </div>
          <div className="dos-grid" style={{ '--min': '290px' }}>
            {STEPS.map((s) => (
              <div key={s.n} className="dos-step" style={{ background: s.accent ? 'var(--dos-orange-soft)' : s.result ? 'var(--dos-leaf-soft)' : '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span className="dos-mono-tag" style={{ color: 'var(--dos-ink-50)' }}>STEP {s.n}</span>
                  <span className="dos-step-who" style={{ background: s.accent ? 'var(--dos-orange)' : '#fff', color: s.accent ? '#fff' : '#0A4D18' }}>{s.who}</span>
                </div>
                <h3 style={{ fontSize: 18.5, fontWeight: 700, margin: 0, letterSpacing: '-.015em', lineHeight: 1.22 }}>{s.title}</h3>
                <p style={{ fontSize: 14.5, color: 'var(--dos-ink-70)', lineHeight: 1.6, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMITMENT */}
      <section className="dos-sec" style={{ background: 'var(--dos-forest-2)', color: '#fff' }}>
        <div className="dos-wrap dos-split" style={{ alignItems: 'center' }}>
          <div style={{ flex: '1 1 440px', minWidth: 290 }}>
            <div className="dos-eyebrow" style={{ color: 'var(--dos-leaf-2)' }}>06 · THE ONGOING COMMITMENT</div>
            <h2 className="dos-h2" style={{ color: '#fff' }}>You don&apos;t need to spend hours doing this.</h2>
            <p className="dos-p" style={{ color: 'rgba(255,255,255,.8)' }}>CuraGo prepares the work for you. Your role is to review and approve what represents you.</p>
            <p className="dos-p" style={{ color: '#fff', fontWeight: 600, margin: 0 }}>Do it weekly, or ten minutes daily. Your choice.</p>
          </div>
          <div style={{ flex: '1 1 340px', minWidth: 270, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['10', 'min', 'a day, reviewing what we prepared'], ['60', 'min', "a week if you'd rather batch it — flexible either way"]].map(([n, u, t]) => (
              <div key={n} className="dos-stat">
                <span className="dos-stat-num">{n}<span style={{ fontSize: 19, fontWeight: 600 }}> {u}</span></span>
                <span style={{ fontSize: 14.5, color: 'rgba(255,255,255,.75)', lineHeight: 1.45 }}>{t}</span>
              </div>
            ))}
            <div className="dos-stat-orange">Review → Approve → Learn → Continue. That&apos;s the whole job.</div>
          </div>
        </div>
      </section>

      {/* JOURNEY */}
      <section id="journey" className="dos-sec" style={{ background: 'var(--dos-paper)' }}>
        <div className="dos-wrap">
          <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto clamp(26px,3.6vw,44px)' }}>
            <div className="dos-eyebrow">07 · THE JOURNEY</div>
            <h2 className="dos-h2" style={{ fontSize: 'clamp(30px,4.4vw,54px)' }}>Appear. Compete. Dominate.</h2>
          </div>
          <div className="dos-grid" style={{ '--min': '270px' }}>
            {JOURNEY.map((j) => (
              <div key={j.n} className="dos-journey" style={{ borderTop: `4px solid ${j.accent}` }}>
                <div className="dos-mono-tag" style={{ color: 'var(--dos-ink-50)', marginBottom: 12 }}>PHASE {j.n}</div>
                <h3 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.025em', margin: '0 0 10px' }}>{j.title}</h3>
                <p style={{ fontSize: 15, color: 'var(--dos-ink-70)', lineHeight: 1.6, margin: 0 }}>{j.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="dos-final">
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(32px,5vw,62px)', fontWeight: 800, letterSpacing: '-.035em', lineHeight: 1, margin: '0 0 16px' }}>Ready to be found?</h2>
          <p style={{ fontSize: 'clamp(17px,1.6vw,20px)', color: 'rgba(255,255,255,.82)', lineHeight: 1.55, margin: '0 0 28px' }}>Build your foundation with CuraGo. It&apos;s free to start.</p>
          <button onClick={start} className="dos-btn-orange dos-btn-xl">Start Now</button>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.62)', margin: '20px 0 0', lineHeight: 1.6 }}>You can start with a subdomain and connect your custom domain when you&apos;re ready.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="dos-footer">
        <div className="dos-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <img src="/curago-logo.png" alt="CuraGo" style={{ height: 34, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, letterSpacing: '.1em' }}>DOMINATE ORGANIC SEARCH</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, fontSize: 14 }}>
            <a href="#problem">The problem</a>
            <a href="#built">What gets built</a>
            <a href="#how">How it works</a>
            <a href="#journey">The journey</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const CSS = `
.dos{
  --dos-forest:#0A4D18; --dos-forest-2:#083b13; --dos-forest-3:#05300f;
  --dos-paper:#fbfcfb; --dos-border:#e5e7eb;
  --dos-orange:#FF7A1A; --dos-orange-2:#E86A0A; --dos-orange-soft:#FFF3E9;
  --dos-leaf:#53CD81; --dos-leaf-2:#8FE6AE; --dos-leaf-ink:#09B117; --dos-leaf-soft:#F2FAF5; --dos-leaf-bd:#CDEBD7;
  --dos-ink:#111827; --dos-ink-70:#4B5563; --dos-ink-50:#6B7280;
  --sans:var(--dos-sans),system-ui,-apple-system,sans-serif;
  --serif:var(--dos-serif),Georgia,serif;
  --mono:var(--dos-mono),ui-monospace,Menlo,monospace;
  font-family:var(--sans); color:var(--dos-ink); line-height:1.5; background:#fff; -webkit-font-smoothing:antialiased;
}
.dos *{box-sizing:border-box}
.dos a{color:var(--dos-leaf-ink);text-decoration:none}
.dos ::selection{background:var(--dos-orange);color:#fff}
.dos img{max-width:100%;display:block}
@keyframes dos-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.85)}}
.dos-wrap{max-width:1220px;margin:0 auto;padding-left:clamp(16px,4vw,40px);padding-right:clamp(16px,4vw,40px)}
.dos-sec{padding-top:clamp(48px,6vw,92px);padding-bottom:clamp(48px,6vw,92px);padding-left:clamp(16px,4vw,40px);padding-right:clamp(16px,4vw,40px)}
.dos-split{display:flex;flex-wrap:wrap;gap:clamp(28px,4vw,60px);align-items:flex-start}
.dos-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,var(--min,190px)),1fr));gap:12px}
/* header */
.dos-header{position:sticky;top:0;z-index:60;background:#fff;border-bottom:1px solid var(--dos-border)}
.dos-nav{max-width:1220px;margin:0 auto;padding:12px clamp(16px,4vw,40px);display:flex;align-items:center;justify-content:space-between;gap:16px}
.dos-nav-links{display:flex;align-items:center;gap:clamp(10px,1.7vw,24px)}
.dos-nav-links a{color:#096B17;font-size:14.5px;font-weight:500}
.dos-burger{display:none;background:#fff;border:1px solid var(--dos-border);border-radius:10px;width:42px;height:42px;flex-direction:column;align-items:center;justify-content:center;gap:5px;cursor:pointer}
.dos-burger span{display:block;width:18px;height:2px;background:var(--dos-forest);border-radius:2px}
.dos-mobile-menu{padding:6px clamp(16px,4vw,40px) 18px;display:flex;flex-direction:column;gap:2px;border-top:1px solid var(--dos-border)}
.dos-mobile-menu a{color:var(--dos-ink);padding:12px 2px;font-size:16px;border-bottom:1px solid var(--dos-border)}
@media(max-width:900px){.dos-nav-links{display:none}.dos-burger{display:flex}}
/* buttons */
.dos-btn-orange{background:var(--dos-orange);color:#fff;border:0;font-family:var(--sans);font-weight:700;font-size:14.5px;padding:12px 22px;border-radius:11px;cursor:pointer;box-shadow:0 6px 18px rgba(255,122,26,.3);transition:background .15s,transform .15s}
.dos-btn-orange:hover{background:var(--dos-orange-2);transform:translateY(-1px)}
.dos-btn-lg{font-size:16.5px;padding:17px 30px;border-radius:13px;box-shadow:0 10px 30px rgba(232,114,46,.4)}
.dos-btn-xl{font-weight:800;font-size:17.5px;padding:19px 42px;border-radius:14px;box-shadow:0 14px 38px rgba(232,114,46,.45)}
.dos-btn-ghost{border:1px solid rgba(255,255,255,.34);color:#fff;font-weight:600;font-size:15.5px;padding:16px 24px;border-radius:13px;transition:background .15s}
.dos-btn-ghost:hover{background:rgba(255,255,255,.09)}
/* hero */
.dos-hero{background:radial-gradient(120% 92% at 82% -12%,#0E6B25 0%,var(--dos-forest) 46%,var(--dos-forest-2) 100%);color:#fff;overflow:hidden}
.dos-hero-inner{padding-top:clamp(44px,6vw,90px);padding-bottom:clamp(46px,6vw,92px);align-items:center}
.dos-eyebrow-light{font-family:var(--mono);font-size:12.5px;letter-spacing:.2em;color:#B4EBC2;margin-bottom:20px;display:flex;align-items:center;gap:10px;font-weight:600}
.dos-dot{width:8px;height:8px;border-radius:50%;background:var(--dos-orange);animation:dos-pulse 1.8s infinite}
.dos-h1{font-weight:800;font-size:clamp(38px,6vw,72px);line-height:.98;letter-spacing:-.035em;margin:0 0 14px}
.dos-hero-serif{font-family:var(--serif);font-style:italic;font-size:clamp(24px,3.4vw,38px);line-height:1.16;color:var(--dos-leaf-2);margin:0 0 22px}
.dos-hero-lead{font-size:clamp(16px,1.3vw,19px);line-height:1.62;color:rgba(255,255,255,.82);max-width:560px;margin:0 0 12px}
.dos-hero-mono{font-family:var(--mono);font-size:13px;letter-spacing:.16em;color:var(--dos-orange);font-weight:600;margin:0 0 30px}
.dos-hero-fine{font-size:13.5px;color:rgba(255,255,255,.6);margin:16px 0 0}
.dos-search-card{background:#fff;border-radius:20px;padding:22px;box-shadow:0 28px 70px rgba(0,0,0,.34)}
.dos-mono-label{font-family:var(--mono);font-size:11px;letter-spacing:.14em;color:var(--dos-ink-50);margin-bottom:14px}
.dos-search-row{border:1px solid var(--dos-border);border-radius:11px;padding:12px 14px;display:flex;align-items:center;gap:10px}
.dos-search-kind{flex:0 0 auto;font-family:var(--mono);font-size:10px;letter-spacing:.1em;color:var(--dos-ink-50);background:var(--dos-paper);border:1px solid var(--dos-border);padding:4px 7px;border-radius:6px}
.dos-search-note{margin-top:14px;background:var(--dos-leaf-soft);border:1px solid var(--dos-leaf-bd);border-radius:12px;padding:13px 14px;font-size:13.5px;color:#0A4D18;line-height:1.55}
/* type */
.dos-eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.2em;color:var(--dos-orange-2);font-weight:600;margin-bottom:14px}
.dos-h2{font-size:clamp(28px,3.8vw,46px);font-weight:800;letter-spacing:-.03em;line-height:1.05;margin:0 0 16px}
.dos-p{font-size:17px;color:var(--dos-ink-70);line-height:1.62;margin:0 0 14px}
.dos-mono-tag{font-family:var(--mono);font-size:10.5px;letter-spacing:.14em}
.dos-card{background:#fff;border:1px solid var(--dos-border);border-radius:14px;padding:18px}
.dos-serif-word{font-family:var(--serif);font-style:italic;font-size:22px;color:var(--dos-forest);line-height:1.1}
.dos-serif-quote{font-family:var(--serif);font-style:italic;font-size:clamp(19px,2.2vw,26px);color:var(--dos-leaf-2);margin:clamp(24px,3vw,34px) 0 0;max-width:760px;line-height:1.4}
/* mid + final cta */
.dos-midcta{background:var(--dos-forest-3);color:#fff;padding:clamp(36px,4.6vw,64px) clamp(16px,4vw,40px)}
.dos-final{background:radial-gradient(110% 120% at 50% -20%,#0E6B25 0%,var(--dos-forest) 50%,var(--dos-forest-3) 100%);color:#fff;padding:clamp(52px,7vw,110px) clamp(16px,4vw,40px);text-align:center}
/* wedo */
.dos-wedo{display:flex;align-items:center;gap:14px;border:1px solid;border-radius:13px;padding:15px 17px}
.dos-wedo-tag{flex:0 0 auto;font-family:var(--mono);font-size:10px;letter-spacing:.12em;padding:5px 8px;border-radius:6px;font-weight:600}
/* graph + free + steps + journey */
.dos-graph-card{border:1px solid;border-radius:15px;padding:20px;display:flex;flex-direction:column;gap:8px}
.dos-free-card{background:#fff;border:1px solid var(--dos-border);border-radius:16px;padding:22px;transition:border-color .15s,box-shadow .15s}
.dos-free-card:hover{border-color:var(--dos-leaf-bd);box-shadow:0 12px 30px rgba(10,77,24,.07)}
.dos-step{border:1px solid var(--dos-border);border-radius:16px;padding:22px;display:flex;flex-direction:column;gap:9px}
.dos-step-who{font-family:var(--mono);font-size:10px;letter-spacing:.1em;padding:4px 8px;border-radius:6px;font-weight:600}
.dos-journey{background:#fff;border:1px solid var(--dos-border);border-radius:16px;padding:26px}
/* commitment stats */
.dos-stat{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);border-radius:16px;padding:22px;display:flex;align-items:baseline;gap:14px}
.dos-stat-num{font-size:44px;font-weight:800;letter-spacing:-.04em;color:var(--dos-leaf-2);line-height:1}
.dos-stat-orange{background:rgba(255,122,26,.14);border:1px solid rgba(255,122,26,.45);border-radius:16px;padding:18px 22px;font-size:14.5px;color:#fff;line-height:1.55}
/* footer */
.dos-footer{background:#05300f;color:rgba(255,255,255,.7);padding:clamp(30px,4vw,52px) clamp(16px,4vw,40px)}
.dos-footer a{color:rgba(255,255,255,.72)}
@media (prefers-reduced-motion:reduce){.dos *{animation:none!important;transition:none!important}}
`;
