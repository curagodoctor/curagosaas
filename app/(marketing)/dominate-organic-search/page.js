'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800', '900'], display: 'swap' });

// "Dominate Organic Search" landing — ported from the founder's September
// prototype. All CSS is scoped under `.dos` so it can't leak into other pages.
export default function DominateOrganicSearch() {
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const start = () => router.push('/signup?entry=practice-os');
  const closeNav = () => setNavOpen(false);

  return (
    <div className="dos" style={{ fontFamily: inter.style.fontFamily }}>
      <style>{CSS}</style>

      <nav className="nav">
        <a href="#top"><img className="logo" src="/curago-logo.png" alt="CuraGo" /></a>
        <div className={`navlinks ${navOpen ? 'open' : ''}`}>
          <a href="#why" onClick={closeNav}>Why Google</a>
          <a href="#google" onClick={closeNav}>How Google works</a>
          <a href="#system" onClick={closeNav}>How to work on Google</a>
          <a href="#roadmap" onClick={closeNav}>Roadmap</a>
          <a href="#offer" onClick={closeNav}>CuraGo</a>
        </div>
        <button className="btn btn-orange navbtn" onClick={start}>Start Free</button>
        <button className="menu" aria-label="Menu" onClick={() => setNavOpen((v) => !v)}>☰</button>
      </nav>

      <header className="hero" id="top">
        <div className="container hero-grid">
          <div className="reveal">
            <div className="kicker">FREE TO START · ~20 MINUTES</div>
            <h1>Get found<br /><span>on Google.</span></h1>
            <p className="hero-copy">Appear. Compete. Dominate.<br />Made for surgeons and specialists building practices in Tier 2 cities and smaller cities — and designed for all doctors, including dentists and dental surgeons.</p>
            <div className="hero-actions">
              <button className="btn btn-orange" onClick={start}>Start Now →</button>
              <a className="hero-secondary" href="#google">See how it works</a>
            </div>
            <div className="micro">No subscription. No payment required to build the foundation.</div>
          </div>
          <div className="hero-art reveal">
            <div className="search-card">
              <div className="googlebar"><span className="gdot" /> surgical specialist near me</div>
              <div className="search-result">
                <small>GOOGLE · LOCAL PRACTICE</small>
                <h3>Dr. YourName — Surgical Specialist</h3>
                <p>Expertise · Services · Location · Reviews</p>
                <div className="tags"><span className="tag">Relevant</span><span className="tag">Local</span><span className="tag">Trusted</span></div>
              </div>
              <div className="search-result">
                <small>PATIENT QUESTION</small>
                <h3>Can you help me?</h3>
                <p>Useful answers + connected practice information help the right patient find you.</p>
              </div>
            </div>
            <div className="patient-card"><small>DISCOVERY</small><strong>One question.<br />One patient.</strong></div>
          </div>
        </div>
      </header>

      <div className="dos-marquee"><div className="track">
        BUILD YOUR PRESENCE <b>✦</b> GET DISCOVERED <b>✦</b> BUILD TRUST <b>✦</b> KEEP BUILDING <b>✦</b>
        BUILD YOUR PRESENCE <b>✦</b> GET DISCOVERED <b>✦</b> BUILD TRUST <b>✦</b> KEEP BUILDING <b>✦</b>
      </div></div>

      <section className="section reveal" id="why">
        <div className="container">
          <div className="eyebrow">01 · WHY GOOGLE</div>
          <h2 className="section-title">Google is<br />opportunity.</h2>
          <p className="section-intro">Google is the front door of your clinical practice. And unlike something you have to pay for every time a patient sees it, organic presence can keep getting stronger.</p>
          <div className="stats">
            <div className="stat"><b>77%</b><h3>Search before booking</h3><p>Google / Think with Google research reported that 77% of patients used search before scheduling a hospital appointment.</p></div>
            <div className="stat"><b>LOW</b><h3>Cost per discovery</h3><p>Organic visibility doesn&apos;t require paying for every individual click.</p></div>
            <div className="stat"><b>BUILD</b><h3>Not restart</h3><p>Keep strengthening the foundation instead of starting from zero every day.</p></div>
            <div className="stat"><b>∞</b><h3>Compounds</h3><p>The work you do today can continue contributing to tomorrow&apos;s presence.</p></div>
          </div>
        </div>
      </section>

      <section className="section google-section reveal" id="google">
        <div className="container">
          <div className="google-intro">
            <div>
              <div className="eyebrow">02 · HOW GOOGLE WORKS</div>
              <h2 className="section-title">One practice.<br />Two different clinics.</h2>
            </div>
            <p className="section-intro">Google doesn&apos;t see your clinic as a single webpage. It builds an understanding from connected pieces of information about <b>who you are, what you do, where you are and how relevant you are.</b></p>
          </div>

          <div className="diagram">
            <div className="diagram-top">
              <div className="node green">
                <div className="node-label">GLOBAL CLINIC</div>
                <h3>Global Clinic</h3>
                <p>Your website — the global version of your practice, accessible wherever a patient is searching from.</p>
                <div className="chips"><span className="chip">Experience</span><span className="chip">Expertise</span><span className="chip">Knowledge</span><span className="chip">Treatments</span><span className="chip">Procedures</span><span className="chip">Booking</span></div>
              </div>
              <div>
                <div className="big-arrow">↔</div>
                <div className="connector-caption">connected</div>
              </div>
              <div className="node">
                <div className="node-label">LOCAL CLINIC</div>
                <h3>Local Clinic</h3>
                <p>Your Google Business Profile — the local version of your practice, tied to where the patient is searching.</p>
                <div className="chips"><span className="chip">Location</span><span className="chip">Services</span><span className="chip">Reviews</span><span className="chip">Posts</span><span className="chip">Products</span><span className="chip">Timing</span><span className="chip">Categories</span></div>
              </div>
            </div>

            <div className="signals">
              <div className="signal"><strong>Prominence</strong><span>How established and recognised you are</span></div>
              <div className="signal"><strong>Proximity</strong><span>How close you are to the patient</span></div>
              <div className="signal"><strong>Relevance</strong><span>How well you match what they need</span></div>
            </div>

            <div className="discovery">
              <div className="patient"><div className="emoji">🧑‍💻</div><b>Patient searches</b><span style={{ fontSize: 9, color: '#776e49' }}>question → discovery → comparison</span></div>
              <div className="discovery-arrow">→</div>
              <div className="result-box">
                <div className="result-box-top"><span>GOOGLE RESULT</span><span>LOCAL + ORGANIC</span></div>
                <h4>Your practice appears with context.</h4>
                <p>Speciality · services · expertise · location · reviews · useful information</p>
                <div className="result-buttons"><span>Call</span><span>Book</span><span>Directions</span><span>Website</span></div>
              </div>
            </div>

            <div className="doors">
              <div className="door">
                <div className="label">AEO · ANSWER ENGINE OPTIMIZATION</div>
                <h3>Patients ask questions.</h3>
                <p>Structure your knowledge so answer-focused search experiences can better understand and use it.</p>
                <div className="question">“When do gallstones need surgery?”</div>
              </div>
              <div className="door">
                <div className="label">GEO · GENERATIVE ENGINE OPTIMIZATION</div>
                <h3>Search is becoming conversational.</h3>
                <p>Make your expertise, entities, relationships and knowledge easier for generative search systems to understand and connect.</p>
                <div className="question">“Which specialist should I see for this?”</div>
              </div>
            </div>

            <div style={{ marginTop: 25, textAlign: 'center', fontSize: 11, fontWeight: 900, color: 'var(--green)' }}>ONE PRACTICE · ONE CONNECTED PRESENCE · MULTIPLE DOORS FOR PATIENT DISCOVERY</div>
          </div>
        </div>
      </section>

      <section className="section dark reveal" id="system">
        <div className="container">
          <div className="eyebrow">03 · HOW TO WORK ON GOOGLE</div>
          <h2 className="section-title">Google has to<br /><span style={{ color: 'var(--lime)' }}>understand you.</span></h2>
          <p className="section-intro">So we don&apos;t chase a mysterious algorithm. We keep giving Google a clearer, more complete picture of your practice — then keep strengthening it.</p>

          <div className="work-v5">
            <div className="work-stage">
              <div className="work-topline">
                <span className="caption">THE WORK, VISUALLY</span>
                <span className="rule" />
                <span className="caption">BUILD → CONNECT → STRENGTHEN</span>
              </div>

              <div className="work-map">
                <div className="work-source">
                  <div className="work-source-card">
                    <small>GLOBAL CLINIC</small>
                    <strong>Website</strong>
                    <span>Expertise · knowledge · treatments · procedures</span>
                  </div>
                  <div className="work-source-card">
                    <small>LOCAL CLINIC</small>
                    <strong>Google Business Profile</strong>
                    <span>Location · services · reviews · posts · booking</span>
                  </div>
                </div>

                <div className="work-arrow">
                  <div className="line" />
                  <small>FEEDS</small>
                </div>

                <div className="google-brain">
                  <div className="tiny">GOOGLE&apos;S JOB</div>
                  <h3>Build a picture of your practice.</h3>
                  <p>The clearer the picture, the easier it is to understand where you fit when a patient searches.</p>
                  <div className="google-questions">
                    <div className="google-question"><b>01</b>Who are you?</div>
                    <div className="google-question"><b>02</b>Where are you?</div>
                    <div className="google-question"><b>03</b>How relevant are you?</div>
                  </div>
                </div>
              </div>

              <div className="work-intention">
                <div className="intention">
                  <div className="number">01 · BUILD DEPTH</div>
                  <h4>Give Google something useful.</h4>
                  <p>Build your website around your experience, expertise, knowledge, treatments and procedures.</p>
                </div>
                <div className="intention">
                  <div className="number">02 · BUILD LOCAL RELEVANCE</div>
                  <h4>Make the local clinic complete.</h4>
                  <p>Keep your Google Business Profile accurate, complete and active with the information patients need.</p>
                </div>
                <div className="intention">
                  <div className="number">03 · KEEP IT CONNECTED</div>
                  <h4>Make the picture stronger.</h4>
                  <p>Connect the website and local presence, answer real patient questions, and keep improving over time.</p>
                </div>
              </div>

              <div className="work-loop-v5">
                <span>BUILD</span><b>→</b><span>CONNECT</span><b>→</b><span>EVALUATE</span><b>→</b><span>IMPROVE</span><b>→</b><span>REPEAT ↻</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section reveal" id="found">
        <div className="container">
          <div className="cura">
            <div><div className="eyebrow">04 · BE FOUND</div><div className="cura-word">BE<br />FOUND.</div></div>
            <div className="cura-copy">
              <h3>Build a practice that Google can understand — and patients can find.</h3>
              <p>Your website is your <b>Global Clinic</b>. Your Google Business Profile is your <b>Local Clinic</b>. CuraGo helps connect the two, strengthen the signals between them, and keep building your presence over time.</p>
              <div className="found-flow"><span>GLOBAL CLINIC</span><b>↔</b><span>LOCAL CLINIC</span><b>→</b><span>BE FOUND</span></div>
              <p><b>Appear quickly. Build relevance. Keep becoming easier to find.</b></p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="offer">
        <div className="container reveal">
          <div className="eyebrow">05 · WHERE DOES CURAGO COME IN?</div>
          <h2 className="section-title">You build the practice.<br /><span style={{ color: 'var(--green)' }}>CuraGo helps build the presence.</span></h2>
          <p className="section-intro">Start free to build the foundation. Upgrade when you want CuraGo to take on the ongoing work.</p>

          <div className="offer-grid">
            <div className="offer">
              <div className="offer-label">STEP 1 · THE FOUNDATION</div>
              <div className="price">FREE <small>~20 min</small></div>
              <h3>Build your organic presence.</h3>
              <p>Get the infrastructure you need to start.</p>
              <div className="checks">
                <div className="check"><i>✓</i> AI-built practice website</div><div className="check"><i>✓</i> Subdomain or custom domain</div><div className="check"><i>✓</i> Blog &amp; page builder</div><div className="check"><i>✓</i> Multiple pages + dashboard</div>
                <div className="check"><i>✓</i> Booking management</div><div className="check"><i>✓</i> Multi-clinic / multi-location support</div><div className="check"><i>✓</i> Lightweight CRM + team login</div>
                <div className="check"><i>✓</i> Email automation + Razorpay connection</div><div className="check"><i>✓</i> GBP setup guidance + review request system</div>
              </div>
              <div className="approval"><b>No subscription. No expiry. No lock-in.</b></div>
              <button className="fullbtn" onClick={start}>Start Free →</button>
            </div>

            <div className="offer featured">
              <div className="offer-label">STEP 2 · DOMINATE ORGANIC SEARCH</div>
              <div className="price">₹5,000 <small>/ month</small></div>
              <h3>Let CuraGo do the ongoing work with you.</h3>
              <p>Everything in Free, plus the ongoing optimisation and workflow that keeps building.</p>
              <div className="checks">
                <div className="check"><i>✓</i> AI website &amp; blog page builders</div><div className="check"><i>✓</i> Website optimisation</div><div className="check"><i>✓</i> GBP optimisation</div>
                <div className="check"><i>✓</i> Monthly competitor progress report</div><div className="check"><i>✓</i> CuraGo workspace</div><div className="check"><i>✓</i> Content planner</div>
              </div>
              <div className="approval"><b>CURAGO</b> prepares → <b>YOU</b> review → <b>YOU</b> approve → <b>CURAGO</b> keeps building ↺</div>
              <p style={{ marginTop: 13, fontSize: 10, color: '#b9cdbd' }}>Your involvement is designed to be at least once a week, depending on how you choose to work.</p>
              <button className="fullbtn" onClick={start}>Start Now — ₹5,000/month →</button>
            </div>
          </div>
        </div>
      </section>

      <section className="section reveal" id="roadmap">
        <div className="container">
          <div className="eyebrow">06 · YOUR 12-MONTH ORGANIC GROWTH ROADMAP</div>
          <h2 className="section-title">You don&apos;t jump to domination.<br /><span style={{ color: 'var(--green)' }}>You climb towards it.</span></h2>
          <p className="section-intro">The mechanics stay behind the curtain. What you see is what your practice progressively becomes discoverable for.</p>

          <div className="roadmap-wrap">
            <div className="road">
              <div className="step"><div className="num">MONTHS 1–2</div><h3>Establish Your Identity</h3><p>Who are you? What do you specialise in?</p></div>
              <div className="step"><div className="num">MONTHS 3–4</div><h3>Become Relevant to Patients</h3><p>Can you help me with my problem?</p></div>
              <div className="step"><div className="num">MONTHS 5–6</div><h3>Establish Your Authority</h3><p>Why should I choose you?</p></div>
              <div className="step"><div className="num">MONTHS 7–8</div><h3>Become the Doctor for Difficult Cases</h3><p>Can you handle my complex case?</p></div>
              <div className="step"><div className="num">MONTHS 9–10</div><h3>Become Part of the Long-Term Journey</h3><p>Can I trust you beyond treatment?</p></div>
              <div className="step"><div className="num">MONTHS 11–12</div><h3>Establish Field Authority</h3><p>Are you an authority in this field?</p></div>
              <div className="road-label"><span>APPEAR</span><b>→</b><span>COMPETE</span><b>→</b><span>DOMINATE</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <div className="container">
          <div className="eyebrow">07 · OUR GUARANTEES</div>
          <h2 className="section-title">We build it.<br />You stay in control.</h2>
          <div className="guarantees">
            <div className="guarantee"><div className="icon">✦</div><h3>We do the boring work</h3><p>Strategy, content and ongoing work needed to build your organic presence.</p></div>
            <div className="guarantee"><div className="icon">◉</div><h3>You stay in control</h3><p>You review and approve the work before it moves forward.</p></div>
            <div className="guarantee"><div className="icon">↻</div><h3>Simple weekly involvement</h3><p>At least once a week, or whenever it fits your schedule.</p></div>
            <div className="guarantee"><div className="icon">⌁</div><h3>Cancel anytime</h3><p>Finish the running month. No long-term lock-in. Your work remains part of your practice.</p></div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 20 }}>₹5,000 charged monthly · No bulk payments.</p>
        </div>
      </section>

      <section className="final" id="start">
        <div className="container">
          <div className="eyebrow" style={{ color: 'var(--lime)' }}>CURAGO IN ONE SENTENCE</div>
          <h2>CuraGo helps doctors build and continuously strengthen their organic practice presence on <span>Google.</span></h2>
          <p>Start with a free foundation. Then decide how far you want to climb.</p>
          <button className="btn btn-orange" onClick={start}>Start Building My Organic Presence →</button>
          <div className="micro">Free to start. Most doctors finish the foundation in about 20 minutes.</div>
          <div className="footer"><img src="/curago-logo.png" alt="CuraGo" /><span>© CuraGo</span></div>
        </div>
      </section>
    </div>
  );
}

const CSS = String.raw`.dos{
  --green:#063d20; --green2:#0b5b2f; --green3:#118447;
  --lime:#b7ef73; --orange:#ff6b1a; --cream:#f5f1e8; --paper:#fffdf8;
  --ink:#101510; --muted:#657067; --line:#dfe4dc;
  --white:#fff; --shadow:0 20px 60px rgba(4,45,23,.12);
}
.dos *{box-sizing:border-box}
.dos{scroll-behavior:smooth}
.dos{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:var(--paper);overflow-x:hidden}
.dos a{color:inherit;text-decoration:none}
.dos button{font:inherit}
.dos .container{width:min(1180px,calc(100% - 40px));margin:auto}
.dos h1, .dos h2, .dos h3, .dos h4, .dos p{margin:0}
.dos h1, .dos h2, .dos h3, .dos h4{letter-spacing:-.055em}
.dos .btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:999px;padding:14px 20px;font-weight:800;font-size:13px;cursor:pointer;transition:.2s}
.dos .btn-orange{background:var(--orange);color:white;box-shadow:0 9px 24px rgba(255,107,26,.22)}
.dos .btn-white{background:white;border:1px solid var(--line)}
.dos .btn:hover{transform:translateY(-2px)}
.dos .eyebrow{font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:900;color:var(--orange);margin-bottom:15px}
.dos .nav{position:fixed;z-index:50;top:16px;left:50%;transform:translateX(-50%);width:min(1160px,calc(100% - 28px));height:60px;padding:8px 9px 8px 18px;background:rgba(255,253,248,.86);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.8);border-radius:999px;box-shadow:0 10px 35px rgba(0,0,0,.08);display:flex;align-items:center;justify-content:space-between}
.dos .logo{width:152px;height:auto;display:block}
.dos .navlinks{display:flex;gap:23px;font-size:12px;font-weight:700;color:#4b554e}
.dos .navlinks a:hover{color:var(--green)}
.dos .navbtn{padding:11px 17px}
.dos .menu{display:none;background:none;border:0;font-size:21px}
.dos .hero{min-height:790px;background:var(--green);color:white;position:relative;overflow:hidden;padding:158px 0 115px}
.dos .hero:before{content:"";position:absolute;width:700px;height:700px;border-radius:50%;right:-190px;top:-250px;background:radial-gradient(circle,rgba(183,239,115,.2),transparent 64%)}
.dos .hero:after{content:"";position:absolute;left:-8%;right:-8%;bottom:-290px;height:420px;background:var(--paper);border-radius:50% 50% 0 0/45% 45% 0 0}
.dos .hero-grid{position:relative;z-index:2;display:grid;grid-template-columns:1.04fr .96fr;gap:55px;align-items:center}
.dos .kicker{font-size:10px;letter-spacing:3px;font-weight:900;color:var(--lime);margin-bottom:21px}
.dos .hero h1{font-size:clamp(58px,8vw,103px);line-height:.84;letter-spacing:-6px;max-width:760px}
.dos .hero h1 span{color:var(--lime)}
.dos .hero-copy{font-size:18px;line-height:1.55;color:#d9e7dc;max-width:600px;margin-top:28px}
.dos .hero-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:32px}
.dos .hero-secondary{border:1px solid rgba(255,255,255,.3);color:white;padding:13px 19px;border-radius:999px;font-size:13px;font-weight:800;background:rgba(255,255,255,.06)}
.dos .micro{font-size:11px;color:#aebfb3;margin-top:14px}
.dos .hero-art{position:relative;height:460px}
.dos .search-card{position:absolute;top:22px;right:0;width:min(475px,100%);background:white;color:var(--ink);border-radius:25px;padding:14px;box-shadow:0 35px 80px rgba(0,0,0,.28);transform:rotate(2deg);animation:dos-float 5s ease-in-out infinite}
@keyframes dos-float{50%{transform:rotate(-1deg) translateY(-9px)}}
.dos .googlebar{height:44px;border:1px solid #ddd;border-radius:22px;display:flex;align-items:center;padding:0 15px;gap:10px;font-size:12px;color:#777}
.dos .gdot{width:9px;height:9px;border-radius:50%;background:var(--orange)}
.dos .search-result{border:1px solid #e8ece7;border-radius:17px;margin-top:11px;padding:17px}
.dos .search-result small{font-size:9px;color:#778078;font-weight:800;letter-spacing:1px}
.dos .search-result h3{font-size:20px;color:var(--green2);margin-top:8px}
.dos .search-result p{font-size:11px;color:#69736c;line-height:1.5;margin-top:6px}
.dos .tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:11px}
.dos .tag{font-size:9px;background:#edf6eb;color:var(--green2);padding:6px 8px;border-radius:999px;font-weight:800}
.dos .patient-card{position:absolute;left:0;bottom:35px;background:var(--lime);color:var(--green);border-radius:20px;padding:17px 19px;width:220px;box-shadow:0 22px 50px rgba(0,0,0,.2);transform:rotate(-5deg)}
.dos .patient-card small{font-size:9px;letter-spacing:2px;font-weight:900}
.dos .patient-card strong{display:block;font-size:24px;line-height:1.02;letter-spacing:-1px;margin-top:8px}
.dos .dos-marquee{border-top:1px solid var(--line);border-bottom:1px solid var(--line);overflow:hidden;white-space:nowrap;padding:17px 0;background:#f1eee5}
.dos .track{display:inline-flex;gap:31px;animation:dos-marquee 24s linear infinite;font-weight:900;letter-spacing:1.7px;font-size:10px;color:var(--green)}
.dos .track b{color:var(--orange)}
@keyframes dos-marquee{to{transform:translateX(-50%)}}
.dos .section{padding:112px 0}
.dos .section-head{max-width:820px}
.dos .section-title{font-size:clamp(42px,6vw,75px);line-height:.89;letter-spacing:-4px}
.dos .section-intro{font-size:17px;color:var(--muted);line-height:1.62;max-width:700px;margin-top:22px}
.dos .dark{background:var(--green);color:white}
.dos .dark .section-intro{color:#c6d8ca}
.dos .stats{display:grid;grid-template-columns:1.35fr 1fr 1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:25px;overflow:hidden;margin-top:55px}
.dos .stat{background:var(--paper);padding:31px;min-height:210px}
.dos .stat:first-child{background:var(--green);color:white}
.dos .stat b{font-size:42px;letter-spacing:-3px;display:block;color:var(--green)}
.dos .stat:first-child b{color:var(--lime);font-size:62px}
.dos .stat h3{font-size:17px;margin-top:12px;letter-spacing:-.8px}
.dos .stat p{font-size:12px;line-height:1.55;color:var(--muted);margin-top:7px}
.dos .stat:first-child p{color:#c7d9cb}
.dos .google-section{background:var(--cream)}
.dos .google-intro{display:grid;grid-template-columns:1fr 1fr;gap:35px;align-items:end}
.dos .google-intro .section-intro{margin-top:0}
.dos .diagram{margin-top:58px;background:var(--paper);border:1px solid #d9e0d8;border-radius:30px;padding:35px;box-shadow:0 14px 40px rgba(0,0,0,.04)}
.dos .diagram-top{display:grid;grid-template-columns:1fr 64px 1fr;align-items:center;gap:15px}
.dos .node{border:1px solid var(--line);border-radius:24px;padding:27px;min-height:250px;background:white}
.dos .node.green{background:var(--green);color:white;border-color:var(--green)}
.dos .node-label{font-size:9px;letter-spacing:2px;font-weight:900;opacity:.55}
.dos .node h3{font-size:27px;margin-top:27px}
.dos .node p{font-size:12px;color:var(--muted);line-height:1.55;margin-top:9px}
.dos .node.green p{color:#c8dacc}
.dos .chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:21px}
.dos .chip{font-size:9px;font-weight:800;padding:7px 9px;border-radius:999px;background:#eef3ed}
.dos .node.green .chip{background:#0b5b2f;color:#dceee0}
.dos .big-arrow{width:60px;height:60px;border-radius:50%;background:var(--orange);color:white;display:grid;place-items:center;font-size:22px;font-weight:900}
.dos .connector-caption{text-align:center;font-size:9px;text-transform:uppercase;letter-spacing:1.5px;font-weight:900;color:#7a847d;margin-top:7px}
.dos .signals{margin-top:22px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.dos .signal{padding:18px;border-radius:17px;background:white;border:1px solid var(--line);text-align:center}
.dos .signal strong{display:block;color:var(--green);font-size:15px}
.dos .signal span{font-size:10px;color:var(--muted)}
.dos .discovery{margin-top:25px;display:grid;grid-template-columns:250px 55px 1fr;align-items:center;gap:15px}
.dos .patient{background:#fff2c8;border:1px solid #eadfba;border-radius:20px;padding:20px;text-align:center}
.dos .patient .emoji{font-size:31px}
.dos .patient b{display:block;font-size:14px;margin-top:7px}
.dos .discovery-arrow{font-size:27px;text-align:center;color:var(--orange);font-weight:900}
.dos .result-box{background:white;border:1px solid var(--line);border-radius:20px;padding:20px}
.dos .result-box-top{display:flex;justify-content:space-between;font-size:9px;font-weight:900;color:#6f7971;letter-spacing:1px}
.dos .result-box h4{font-size:18px;color:var(--green2);margin-top:9px}
.dos .result-box p{font-size:11px;color:var(--muted);margin-top:5px}
.dos .result-buttons{display:flex;gap:6px;margin-top:12px;flex-wrap:wrap}
.dos .result-buttons span{background:var(--green);color:white;padding:6px 8px;border-radius:6px;font-size:9px;font-weight:800}
.dos .doors{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:22px}
.dos .door{padding:24px;border:1px solid var(--line);border-radius:22px;background:white}
.dos .door .label{font-size:9px;letter-spacing:2px;color:var(--orange);font-weight:900}
.dos .door h3{font-size:24px;margin:10px 0 7px}
.dos .door p{font-size:12px;color:var(--muted);line-height:1.55}
.dos .question{margin-top:13px;padding:11px 13px;border-left:3px solid var(--lime);background:#f5f8f3;border-radius:0 10px 10px 0;font-size:11px;font-style:italic}
.dos .how-grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:70px;align-items:start;margin-top:58px}
.dos .workboard{margin-top:55px;display:grid;grid-template-columns:290px 1fr;gap:18px;align-items:stretch}
.dos .work-side{display:flex;flex-direction:column;gap:12px}
.dos .work-badge{font-size:9px;letter-spacing:2px;font-weight:900;color:var(--lime);margin-bottom:2px}
.dos .work-clinic{padding:22px;border-radius:20px;border:1px solid rgba(255,255,255,.14);position:relative;overflow:hidden}
.dos .work-clinic:after{content:"";position:absolute;width:90px;height:90px;border-radius:50%;right:-35px;bottom:-35px;background:rgba(183,239,115,.09)}
.dos .work-clinic small{display:block;font-size:8px;letter-spacing:1.8px;font-weight:900;color:var(--lime)}
.dos .work-clinic strong{display:block;font-size:22px;margin-top:8px}
.dos .work-clinic span{display:block;font-size:10px;color:#b9ccbe;line-height:1.5;margin-top:8px}
.dos .work-loop{min-height:470px;border:1px solid rgba(255,255,255,.14);border-radius:28px;position:relative;background:rgba(255,255,255,.035);overflow:hidden}
.dos .loop-title{position:absolute;top:22px;left:25px;font-size:9px;letter-spacing:2px;font-weight:900;color:#8fa496}
.dos .loop-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:180px;height:180px;border-radius:50%;background:var(--lime);color:var(--green);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-shadow:0 0 0 14px rgba(183,239,115,.08)}
.dos .loop-center span{font-size:8px;letter-spacing:2px;font-weight:900}
.dos .loop-center strong{font-size:17px;line-height:1.05;margin-top:9px}
.dos .loop-center em{font-style:normal;font-size:20px;margin-top:8px}
.dos .work-node{position:absolute;width:170px;padding:14px 15px;border-radius:16px;background:#fff;color:var(--ink);box-shadow:0 12px 25px rgba(0,0,0,.12)}
.dos .work-node b{font-size:8px;color:var(--orange);letter-spacing:1px}
.dos .work-node strong{display:block;font-size:13px;margin-top:4px}
.dos .work-node span{display:block;font-size:9px;color:var(--muted);line-height:1.4;margin-top:4px}
.dos .work-node:after{content:"↗";position:absolute;right:13px;top:13px;color:var(--orange);font-weight:900}
.dos .n1{left:28px;top:100px}
.dos .n2{right:28px;top:100px}
.dos .n3{right:20px;bottom:45px}
.dos .n4{left:50%;bottom:20px;transform:translateX(-50%)}
.dos .n5{left:20px;bottom:45px}
.dos .found-flow{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:22px 0;padding:13px 14px;border:1px solid var(--line);border-radius:15px;background:#f6f8f4;font-size:9px;letter-spacing:1.1px;font-weight:900;color:var(--green)}
.dos .found-flow b{color:var(--orange);font-size:14px}
.dos .found-flow span:last-child{color:var(--orange)}
.dos .how-copy h3{font-size:28px;line-height:1.05}
.dos .how-copy p{font-size:14px;color:#bfd2c3;line-height:1.65;margin-top:14px;max-width:430px}
.dos .signal-stack{display:grid;gap:11px}
.dos .signal-row{display:grid;grid-template-columns:42px 1fr auto;gap:16px;align-items:center;padding:18px 20px;border:1px solid rgba(255,255,255,.15);border-radius:17px;background:rgba(255,255,255,.045)}
.dos .signal-row .num{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:var(--lime);color:var(--green);font-size:11px;font-weight:900}
.dos .signal-row h4{font-size:14px;letter-spacing:-.4px}
.dos .signal-row p{font-size:10px;color:#b7c9bc;margin-top:3px}
.dos .signal-row .side{font-size:10px;color:var(--lime);font-weight:900}
.dos .how-bottom{margin-top:40px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.dos .how-bottom div{padding:18px;border-radius:17px;background:rgba(183,239,115,.08);border:1px solid rgba(183,239,115,.12);text-align:center;font-size:11px;font-weight:800}
.dos .how-bottom span{display:block;color:var(--lime);font-size:17px;margin-bottom:5px}
.dos .work-v5{margin-top:55px;position:relative}
.dos .work-stage{background:#f8f6ee;border:1px solid rgba(255,255,255,.16);border-radius:32px;padding:28px;position:relative;overflow:hidden}
.dos .work-stage:before{content:"";position:absolute;width:360px;height:360px;border-radius:50%;right:-150px;top:-160px;background:rgba(183,239,115,.08)}
.dos .work-topline{display:flex;justify-content:space-between;gap:20px;align-items:center;margin-bottom:25px}
.dos .work-topline .caption{font-size:9px;letter-spacing:2px;font-weight:900;color:#7b897f}
.dos .work-topline .rule{height:1px;background:#d9ddd5;flex:1}
.dos .work-map{display:grid;grid-template-columns:1fr 80px 1.1fr;align-items:center;gap:14px}
.dos .work-source{display:grid;gap:10px}
.dos .work-source-card{background:white;border:1px solid #dce1d9;border-radius:21px;padding:19px 20px;position:relative;box-shadow:0 10px 25px rgba(0,0,0,.035)}
.dos .work-source-card:after{content:"";position:absolute;right:17px;top:17px;width:7px;height:7px;border-radius:50%;background:var(--orange)}
.dos .work-source-card small{display:block;font-size:8px;letter-spacing:1.7px;font-weight:900;color:var(--orange)}
.dos .work-source-card strong{display:block;font-size:20px;letter-spacing:-1px;margin-top:5px;color:var(--green)}
.dos .work-source-card span{display:block;font-size:10px;color:#737d75;margin-top:4px}
.dos .work-arrow{text-align:center;color:var(--orange)}
.dos .work-arrow .line{height:2px;background:#e0a88d;position:relative}
.dos .work-arrow .line:after{content:"→";position:absolute;right:-2px;top:-11px;font-size:20px}
.dos .work-arrow small{display:block;font-size:8px;letter-spacing:1px;font-weight:900;margin-top:10px;color:#8b786d}
.dos .google-brain{background:var(--green);border-radius:28px;padding:24px;color:white;position:relative;min-height:215px;box-shadow:0 20px 45px rgba(0,0,0,.12)}
.dos .google-brain .tiny{font-size:8px;letter-spacing:2px;color:var(--lime);font-weight:900}
.dos .google-brain h3{font-size:28px;margin-top:12px;max-width:400px}
.dos .google-brain p{font-size:11px;color:#c8d9cc;margin-top:8px;max-width:440px}
.dos .google-questions{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:20px}
.dos .google-question{padding:11px 10px;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:rgba(255,255,255,.05);font-size:9px;font-weight:800;color:white}
.dos .google-question b{display:block;color:var(--lime);font-size:8px;letter-spacing:1px;margin-bottom:4px}
.dos .work-intention{margin-top:18px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px}
.dos .intention{background:white;border:1px solid #dce1d9;border-radius:18px;padding:17px}
.dos .intention .number{font-size:8px;letter-spacing:1.5px;color:var(--orange);font-weight:900}
.dos .intention h4{font-size:16px;color:var(--green);margin-top:7px}
.dos .intention p{font-size:10px;color:#737d75;line-height:1.45;margin-top:5px}
.dos .work-loop-v5{margin-top:18px;padding:18px 20px;border-radius:18px;background:var(--lime);color:var(--green);display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;font-size:10px;font-weight:900;letter-spacing:.7px}
.dos .work-loop-v5 b{font-size:16px}
@media(max-width:900px){
.dos .work-map{grid-template-columns:1fr}
.dos .work-arrow{transform:rotate(90deg);margin:3px auto}
.dos .work-intention{grid-template-columns:1fr}
.dos .google-questions{grid-template-columns:1fr}
}
.dos .cura{display:grid;grid-template-columns:.85fr 1.15fr;gap:65px;align-items:center}
.dos .cura-word{font-size:clamp(75px,11vw,145px);line-height:.72;letter-spacing:-10px;font-weight:950;color:var(--green)}
.dos .cura-copy{border-left:5px solid var(--orange);padding-left:26px}
.dos .cura-copy h3{font-size:26px;line-height:1.2}
.dos .cura-copy p{font-size:13px;color:var(--muted);line-height:1.65;margin-top:18px}
.dos .offer-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:58px}
.dos .offer{border:1px solid var(--line);border-radius:28px;padding:34px;background:white}
.dos .offer.featured{background:var(--green);color:white;border-color:var(--green);box-shadow:var(--shadow)}
.dos .offer-label{font-size:9px;letter-spacing:2px;font-weight:900;color:var(--orange)}
.dos .featured .offer-label{color:var(--lime)}
.dos .price{font-size:52px;line-height:1;letter-spacing:-3px;font-weight:950;margin-top:17px}
.dos .price small{font-size:13px;letter-spacing:0;color:var(--muted)}
.dos .featured .price small{color:#bdd0c3}
.dos .offer h3{font-size:24px;margin-top:12px}
.dos .offer>p{font-size:12px;color:var(--muted);line-height:1.55;margin-top:7px}
.dos .featured>p{color:#c4d7c9}
.dos .checks{display:grid;gap:9px;margin:24px 0}
.dos .check{display:flex;gap:8px;font-size:11px;line-height:1.45}
.dos .check i{font-style:normal;color:var(--green);font-weight:900}
.dos .featured .check i{color:var(--lime)}
.dos .approval{border-radius:16px;padding:16px;background:#f4f8f3;border:1px solid #dce6dd;font-size:11px;line-height:1.8}
.dos .featured .approval{background:#ffffff0a;border-color:#ffffff1a}
.dos .approval b{color:var(--green)}
.dos .featured .approval b{color:var(--lime)}
.dos .fullbtn{display:block;text-align:center;padding:14px;border-radius:999px;background:var(--orange);color:white;font-size:12px;font-weight:900;margin-top:22px}
.dos .roadmap-wrap{margin-top:58px;overflow-x:auto;padding-bottom:10px}
.dos .road{min-width:940px;height:430px;display:grid;grid-template-columns:repeat(6,1fr);align-items:end;gap:9px;padding:0 10px 45px;position:relative}
.dos .road:after{content:"";position:absolute;left:10px;right:10px;bottom:43px;height:3px;background:#c8dfcc}
.dos .step{width:auto;border:1px solid var(--line);background:white;border-radius:19px 19px 6px 6px;padding:16px;position:relative;z-index:2;box-shadow:0 12px 28px rgba(0,0,0,.04)}
.dos .step:nth-child(1){height:120px}
.dos .step:nth-child(2){height:160px}
.dos .step:nth-child(3){height:205px}
.dos .step:nth-child(4){height:250px}
.dos .step:nth-child(5){height:300px}
.dos .step:nth-child(6){height:355px;background:var(--green);color:white;border-color:var(--green)}
.dos .step .num{font-size:8px;letter-spacing:1.5px;font-weight:900;opacity:.6}
.dos .step h3{font-size:15px;margin-top:9px}
.dos .step p{font-size:9px;color:var(--muted);line-height:1.45;margin-top:7px}
.dos .step:last-child p{color:#c9efd1}
.dos .road-label{position:absolute;left:10px;bottom:5px;font-size:9px;font-weight:900;letter-spacing:2px;color:var(--green);display:flex;gap:10px}
.dos .road-label b{color:var(--orange)}
.dos .road-destination{margin-top:24px;background:var(--green);color:white;border-radius:24px;padding:25px;display:grid;grid-template-columns:220px 1fr;gap:30px;align-items:center}
.dos .road-destination h3{font-size:55px;color:var(--lime);line-height:.8;letter-spacing:-4px}
.dos .questions{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.dos .questions div{padding:10px;border-left:2px solid var(--lime);font-size:10px;color:#d6e8da}
.dos .guarantees{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-top:55px}
.dos .guarantee{padding:24px;border:1px solid var(--line);border-radius:22px;background:white}
.dos .guarantee .icon{font-size:23px;color:var(--orange)}
.dos .guarantee h3{font-size:16px;margin-top:18px}
.dos .guarantee p{font-size:11px;color:var(--muted);line-height:1.55;margin-top:7px}
.dos .final{background:var(--green);color:white;padding:105px 0 55px;position:relative;overflow:hidden}
.dos .final:before{content:"";position:absolute;width:520px;height:520px;right:-190px;top:-240px;border-radius:50%;background:rgba(183,239,115,.12)}
.dos .final h2{font-size:clamp(48px,7.5vw,96px);line-height:.84;letter-spacing:-5px;max-width:940px;position:relative}
.dos .final h2 span{color:var(--lime)}
.dos .final p{font-size:16px;color:#c7d9cb;max-width:650px;line-height:1.6;margin-top:25px;position:relative}
.dos .final .btn{margin-top:28px;position:relative}
.dos .footer{display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,.13);padding-top:25px;margin-top:80px;color:#9fafa4;font-size:10px;position:relative}
.dos .footer img{width:135px;height:auto;filter:none}
@keyframes dos-revealIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
.dos .reveal{animation:dos-revealIn .7s ease both}
@media(max-width:900px){
.dos .navlinks, .dos .navbtn{display:none}
.dos .menu{display:block}
.dos .hero{padding-top:135px}
.dos .hero-grid, .dos .google-intro, .dos .how-grid, .dos .cura, .dos .offer-grid, .dos .workboard{grid-template-columns:1fr}
.dos .hero-art{height:410px;margin-top:15px}
.dos .stats{grid-template-columns:1fr 1fr}
.dos .how-grid{gap:35px}
.dos .offer.featured{transform:none}
.dos .guarantees{grid-template-columns:1fr 1fr}
}
@media(max-width:620px){
.dos .container{width:calc(100% - 28px)}
.dos .section{padding:78px 0}
.dos .hero h1{font-size:62px;letter-spacing:-4px}
.dos .hero{min-height:880px}
.dos .stats, .dos .guarantees{grid-template-columns:1fr}
.dos .diagram{padding:20px}
.dos .diagram-top, .dos .discovery{grid-template-columns:1fr}
.dos .big-arrow{margin:auto;transform:rotate(90deg)}
.dos .signals, .dos .doors, .dos .how-bottom{grid-template-columns:1fr}
.dos .work-loop{min-height:560px}
.dos .work-node{width:150px}
.dos .n1{left:15px;top:90px}
.dos .n2{right:15px;top:90px}
.dos .n3{right:12px;bottom:35px}
.dos .n4{bottom:12px}
.dos .n5{left:12px;bottom:35px}
.dos .patient{max-width:none}
.dos .road-destination{grid-template-columns:1fr}
.dos .questions{grid-template-columns:1fr}
.dos .cura-word{font-size:85px}
.dos .final h2{letter-spacing:-4px}
}
.dos, .dos{ max-width:100%; overflow-x:hidden; }
.dos img{ max-width:100%; }
@media (max-width: 900px){
.dos .container{ width: min(100% - 30px, 1180px); }
.dos .nav{
    top:10px;
    height:56px;
    padding:7px 8px 7px 15px;
  }
.dos .logo{ width:132px; }
.dos .navlinks{ display:none !important; }
.dos .navbtn{ display:none !important; }
.dos .menu{
    display:block;
    width:42px;
    height:42px;
    border-radius:50%;
    background:var(--green);
    color:white;
    font-size:18px;
    line-height:42px;
    padding:0;
  }
.dos .hero{
    min-height:auto;
    padding:130px 0 90px;
  }
.dos .hero:after{ bottom:-250px; }
.dos .hero-grid{
    display:flex;
    flex-direction:column;
    gap:45px;
  }
.dos .hero h1{
    font-size:clamp(54px,14vw,82px);
    letter-spacing:-4px;
  }
.dos .hero-copy{
    font-size:16px;
    max-width:100%;
  }
.dos .hero-art{
    width:100%;
    height:390px;
    min-height:0;
  }
.dos .search-card{
    width:min(100%,470px);
    left:50%;
    right:auto;
    transform:translateX(-50%) rotate(2deg);
  }
.dos .patient-card{
    left:4%;
    bottom:18px;
  }
.dos .section{ padding:78px 0; }
.dos .section-title{
    font-size:clamp(42px,11vw,65px);
    letter-spacing:-3px;
  }
.dos .section-intro{
    font-size:15px;
  }
.dos .stats{
    grid-template-columns:1fr 1fr;
    margin-top:35px;
  }
.dos .stat{
    min-height:175px;
    padding:22px;
  }
.dos .stat:first-child{ grid-column:1/-1; }
.dos .stat:first-child b{ font-size:55px; }
.dos .stat b{ font-size:34px; }
.dos .google-intro{
    display:flex;
    flex-direction:column;
    gap:18px;
  }
.dos .diagram{
    margin-top:35px;
    padding:18px;
    border-radius:24px;
  }
.dos .diagram-top{
    grid-template-columns:1fr;
    gap:10px;
  }
.dos .node{
    min-height:0;
    padding:22px;
  }
.dos .node h3{
    font-size:25px;
    margin-top:17px;
  }
.dos .big-arrow{
    width:48px;
    height:48px;
    margin:0 auto;
    transform:rotate(90deg);
  }
.dos .connector-caption{ margin-top:-3px; }
.dos .signals{
    grid-template-columns:1fr;
    gap:8px;
  }
.dos .signal{
    padding:14px;
  }
.dos .discovery{
    grid-template-columns:1fr;
    gap:9px;
  }
.dos .discovery-arrow{
    transform:rotate(90deg);
    height:32px;
    display:grid;
    place-items:center;
  }
.dos .doors{
    grid-template-columns:1fr;
  }
.dos .work-v5{ margin-top:35px; }
.dos .work-stage{
    padding:18px;
    border-radius:24px;
  }
.dos .work-topline{
    align-items:flex-start;
    flex-direction:column;
    gap:7px;
  }
.dos .work-topline .rule{ width:100%; flex:auto; }
.dos .work-map{
    grid-template-columns:1fr;
    gap:9px;
  }
.dos .work-source-card{
    padding:17px;
  }
.dos .work-arrow{
    transform:none;
    height:35px;
    display:flex;
    flex-direction:column;
    justify-content:center;
  }
.dos .work-arrow .line{ width:100%; }
.dos .work-arrow .line:after{
    right:-1px;
    top:-11px;
  }
.dos .google-brain{
    min-height:0;
    padding:20px;
  }
.dos .google-brain h3{ font-size:25px; }
.dos .google-questions{
    grid-template-columns:1fr;
    gap:6px;
  }
.dos .work-intention{
    grid-template-columns:1fr;
  }
.dos .work-loop-v5{
    gap:8px;
    padding:15px;
    line-height:1.8;
  }
.dos .cura{
    grid-template-columns:1fr;
    gap:35px;
  }
.dos .cura-word{
    font-size:clamp(78px,22vw,125px);
    letter-spacing:-7px;
  }
.dos .offer-grid{
    grid-template-columns:1fr;
    gap:15px;
    margin-top:35px;
  }
.dos .offer{
    padding:26px 22px;
    border-radius:24px;
  }
.dos .offer.featured{
    transform:none;
  }
.dos .price{ font-size:46px; }
.dos .roadmap-wrap{
    width:100%;
    overflow-x:auto;
    -webkit-overflow-scrolling:touch;
    scrollbar-width:thin;
  }
.dos .road{
    min-width:930px;
  }
.dos .road-destination{
    grid-template-columns:1fr;
    gap:18px;
  }
.dos .road-destination h3{
    font-size:50px;
  }
.dos .questions{
    grid-template-columns:1fr 1fr;
  }
.dos .guarantees{
    grid-template-columns:1fr 1fr;
    margin-top:35px;
  }
.dos .final{
    padding:80px 0 40px;
  }
.dos .final h2{
    font-size:clamp(48px,12vw,78px);
    letter-spacing:-4px;
  }
.dos .footer{
    flex-direction:column;
    align-items:flex-start;
    gap:12px;
    margin-top:60px;
  }
}
@media (max-width: 520px){
.dos .container{ width:calc(100% - 26px); }
.dos .hero{ padding-top:120px; padding-bottom:70px; }
.dos .hero h1{ font-size:57px; letter-spacing:-3.5px; }
.dos .hero-copy{ font-size:15px; }
.dos .hero-actions{ flex-direction:column; align-items:stretch; }
.dos .hero-actions .btn, .dos .hero-secondary{ width:100%; text-align:center; }
.dos .hero-art{ height:330px; }
.dos .search-card{
    width:96%;
    padding:10px;
    top:8px;
  }
.dos .search-result{ padding:13px; }
.dos .search-result h3{ font-size:17px; }
.dos .patient-card{
    width:185px;
    padding:14px;
    left:2%;
    bottom:3px;
  }
.dos .patient-card strong{ font-size:20px; }
.dos .stats{ grid-template-columns:1fr; }
.dos .stat:first-child{ grid-column:auto; }
.dos .stat{ min-height:auto; padding:20px; }
.dos .stat:first-child b{ font-size:50px; }
.dos .node{ padding:19px; }
.dos .node h3{ font-size:23px; }
.dos .chips{ gap:5px; }
.dos .chip{ font-size:8px; padding:6px 8px; }
.dos .work-stage{ padding:14px; }
.dos .work-source-card strong{ font-size:18px; }
.dos .google-brain h3{ font-size:23px; }
.dos .intention{ padding:15px; }
.dos .doors .door{ padding:20px; }
.dos .cura-word{ font-size:78px; letter-spacing:-6px; }
.dos .offer{ padding:24px 19px; }
.dos .price{ font-size:42px; }
.dos .checks{ gap:8px; }
.dos .questions{ grid-template-columns:1fr; }
.dos .guarantees{ grid-template-columns:1fr; }
.dos .final h2{ font-size:51px; }
.dos .final .btn{ width:100%; text-align:center; }
}
.dos .navlinks.open{display:flex!important;position:absolute;top:66px;left:0;right:0;padding:18px;background:rgba(255,253,248,.98);border:1px solid #dfe4dc;border-radius:22px;flex-direction:column;gap:16px;box-shadow:0 20px 40px rgba(0,0,0,.12);z-index:60}
.dos .found-flow{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin-top:18px;font-size:10px;font-weight:900;letter-spacing:1.4px;color:var(--green)}
.dos .found-flow span{background:#eef3ed;border-radius:999px;padding:8px 12px}
.dos .found-flow b{color:var(--orange)}
.dos{
  --forest:var(--green); --forest-2:#05311a; --forest-3:#042713; --forest-mid:var(--green3);
  --border:var(--line); --orange-2:#e65c0d; --orange-soft:#fff2e8;
  --leaf:#8fd77a; --leaf-2:var(--lime); --leaf-ink:#0b5b2f; --leaf-soft:#f2f8ef; --leaf-bd:#d8e6d2;
  --ink-70:#475049; --ink-50:var(--muted);
  --sans:Inter,ui-sans-serif,system-ui,sans-serif;
  --serif:Inter,ui-sans-serif,system-ui,sans-serif;
  --mono:Inter,ui-sans-serif,system-ui,sans-serif;
}
@keyframes dos-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes dos-pulse{0%,100%{opacity:1}50%{opacity:.4}}
@media (prefers-reduced-motion:reduce){
.dos *{animation:none!important;transition:none!important}
}`;
