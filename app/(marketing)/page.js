// Faithful port of the "CuraGo Landing Page Redesign 2" design-tool export.
// Server component (no client interactivity). The layout provides <html>/<head>/<body>
// and renders <WaitlistEnhancer/>, <RazorpayButtons/> and <RevealOnScroll/> after this.
//
// The source was a design-tool export whose runtime (support.js, ignored) expanded
// <sc-for>/<sc-if>/{{ }} templates and <dc-import> components. That runtime is not
// used, so every loop below has been statically expanded from the export's data
// arrays, and the "dc-dashboard" component is inlined (see DASHBOARD).
//
// CTA wiring: the founding-cohort + final email forms carry class="btn" text
// "Join the waitlist" so WaitlistEnhancer binds them (email -> /api/waitlist,
// empty -> /signup?entry=practice-os). Book/masterclass/bundle buy buttons all
// become Razorpay payment-button placeholders. Free-site CTA is a plain link.

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800&family=Newsreader:ital,opsz,wght@1,18..72,300;1,18..72,400;1,18..72,500&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

:root{
  --forest:#0A4D18; --forest-2:#083b13; --forest-3:#05300f; --forest-mid:#0E6B25;
  --cream:#ffffff; --cream-2:#f8faf8; --card:#ffffff; --border:#e5e7eb;
  --orange:#FF7A1A; --orange-2:#E86A0A;
  --leaf:#53CD81; --leaf-2:#8FE6AE; --leaf-ink:#09B117; --primary:#09B117;
  --ink:#111827; --ink-70:#4B5563; --ink-50:#6B7280;
  --sans:'Schibsted Grotesk',system-ui,-apple-system,sans-serif;
  --serif:'Newsreader',Georgia,'Times New Roman',serif;
  --mono:'IBM Plex Mono',ui-monospace,'SF Mono',Menlo,monospace;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--cream);color:var(--ink);font-family:var(--sans);line-height:1.5;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overflow-x:hidden}
a{color:var(--leaf-ink);text-decoration:none}
a:hover{color:var(--orange-2)}
img{max-width:100%;display:block}
::selection{background:var(--orange);color:#fff}
::-webkit-scrollbar{height:10px;width:10px}
::-webkit-scrollbar-thumb{background:rgba(0,0,0,.18);border-radius:8px}
@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.85)}}
@keyframes sheen{0%{background-position:-140% 0}100%{background-position:240% 0}}
@keyframes barfill{from{width:0}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

/* nav links: hide on small screens (mobile menu runtime is not ported) */
.dc-navlinks{display:flex;align-items:center;gap:clamp(12px,1.8vw,24px)}
@media (max-width:860px){.dc-navlinks{display:none}}

/* native <details> FAQ styling to match the design's + toggle */
.faq summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:22px 4px}
.faq summary::-webkit-details-marker{display:none}
.faq summary::marker{content:''}
.faq .faq-plus{flex:none;font-size:24px;color:var(--leaf-ink);font-weight:400;line-height:1;transition:transform .3s}
.faq[open] .faq-plus{transform:rotate(45deg)}`;

// The "dc-dashboard" imported component, statically expanded (Day 12 / 28 mock).
const DASHBOARD = `<div style="font-family:var(--sans);background:#fbfaf6;border-radius:16px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.35);border:1px solid rgba(0,0,0,.08);color:#191b16;max-width:640px;margin:0 auto">
  <div style="background:#0e2c15;padding:12px 16px;display:flex;align-items:center;gap:10px">
    <div style="display:flex;gap:6px"><span style="width:10px;height:10px;border-radius:50%;background:#ff6b5c"></span><span style="width:10px;height:10px;border-radius:50%;background:#ffce4f"></span><span style="width:10px;height:10px;border-radius:50%;background:#5aa96f"></span></div>
    <div style="color:#fff;font-weight:800;font-size:13px;margin-left:6px">CuraGo</div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;color:#7cc48f">PRACTICE BUILDER</div>
    <div style="margin-left:auto;display:flex;gap:3px;align-items:center">
      <span style="width:12px;height:5px;border-radius:2px;background:#5aa96f"></span>
      <span style="width:12px;height:5px;border-radius:2px;background:#5aa96f"></span>
      <span style="width:12px;height:5px;border-radius:2px;background:#5aa96f"></span>
      <span style="width:12px;height:5px;border-radius:2px;background:#5aa96f"></span>
      <span style="width:12px;height:5px;border-radius:2px;background:#5aa96f"></span>
      <span style="width:12px;height:5px;border-radius:2px;background:#5aa96f"></span>
      <span style="width:12px;height:5px;border-radius:2px;background:#e8722e"></span>
      <span style="width:12px;height:5px;border-radius:2px;background:rgba(255,255,255,.2)"></span>
      <span style="width:12px;height:5px;border-radius:2px;background:rgba(255,255,255,.2)"></span>
      <span style="width:12px;height:5px;border-radius:2px;background:rgba(255,255,255,.2)"></span>
      <span style="width:12px;height:5px;border-radius:2px;background:rgba(255,255,255,.2)"></span>
      <span style="width:12px;height:5px;border-radius:2px;background:rgba(255,255,255,.2)"></span>
      <span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#7cc48f;margin-left:6px">Day 12 / 28</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:150px 1fr 128px;min-height:280px">
    <div style="border-right:1px solid rgba(0,0,0,.07);padding:14px 12px;background:#f4f1ea">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.1em;color:#8a8577;margin-bottom:10px">WEEK 2 · LOOK CREDIBLE</div>
      <div style="display:flex;flex-direction:column;gap:2px">
        <div style="display:flex;gap:7px;align-items:flex-start;padding:6px 7px;border-radius:7px"><span style="flex:none;width:14px;height:14px;border-radius:50%;display:grid;place-items:center;font-size:8px;font-weight:800;margin-top:1px;background:#1f7a3d;color:#fff">✓</span><span style="font-size:10.5px;line-height:1.25;color:#8a8577;text-decoration:line-through">Set up your CuraGo site</span></div>
        <div style="display:flex;gap:7px;align-items:flex-start;padding:6px 7px;border-radius:7px"><span style="flex:none;width:14px;height:14px;border-radius:50%;display:grid;place-items:center;font-size:8px;font-weight:800;margin-top:1px;background:#1f7a3d;color:#fff">✓</span><span style="font-size:10.5px;line-height:1.25;color:#8a8577;text-decoration:line-through">Add your qualifications</span></div>
        <div style="display:flex;gap:7px;align-items:flex-start;padding:6px 7px;border-radius:7px"><span style="flex:none;width:14px;height:14px;border-radius:50%;display:grid;place-items:center;font-size:8px;font-weight:800;margin-top:1px;background:#1f7a3d;color:#fff">✓</span><span style="font-size:10.5px;line-height:1.25;color:#8a8577;text-decoration:line-through">Write your about section</span></div>
        <div style="display:flex;gap:7px;align-items:flex-start;padding:6px 7px;border-radius:7px"><span style="flex:none;width:14px;height:14px;border-radius:50%;display:grid;place-items:center;font-size:8px;font-weight:800;margin-top:1px;background:#1f7a3d;color:#fff">✓</span><span style="font-size:10.5px;line-height:1.25;color:#8a8577;text-decoration:line-through">Publish your services page</span></div>
        <div style="display:flex;gap:7px;align-items:flex-start;padding:6px 7px;border-radius:7px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.08)"><span style="flex:none;width:14px;height:14px;border-radius:50%;display:grid;place-items:center;font-size:8px;font-weight:800;margin-top:1px;background:#e8722e"></span><span style="font-size:10.5px;line-height:1.25;color:#191b16;font-weight:700">Add three clinic photos</span></div>
        <div style="display:flex;gap:7px;align-items:flex-start;padding:6px 7px;border-radius:7px"><span style="flex:none;width:14px;height:14px;border-radius:50%;display:grid;place-items:center;font-size:8px;font-weight:800;margin-top:1px;border:1.5px solid rgba(0,0,0,.25);background:transparent"></span><span style="font-size:10.5px;line-height:1.25;color:#5c5a51">Write your profile description</span></div>
        <div style="display:flex;gap:7px;align-items:flex-start;padding:6px 7px;border-radius:7px"><span style="flex:none;width:14px;height:14px;border-radius:50%;display:grid;place-items:center;font-size:8px;font-weight:800;margin-top:1px;border:1.5px solid rgba(0,0,0,.25);background:transparent"></span><span style="font-size:10.5px;line-height:1.25;color:#5c5a51">Week two review</span></div>
      </div>
    </div>
    <div style="padding:20px 22px">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.12em;color:#e8722e;margin-bottom:12px">TODAY'S MISSION · DAY 12</div>
      <h3 style="font-size:20px;font-weight:800;line-height:1.15;letter-spacing:-.02em;margin:0 0 10px">Add three clinic photos to your Google profile</h3>
      <p style="font-size:11.5px;color:#5c5a51;line-height:1.5;margin:0 0 16px">Patients decide whether to book before they ever call. A profile with photos of the real room roughly doubles booking clicks.</p>
      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:9px;background:#eef0ea;color:#5c5a51;padding:5px 9px;border-radius:6px">⏱ 30 min</span>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:9px;background:#eef0ea;color:#5c5a51;padding:5px 9px;border-radius:6px">4 tasks</span>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:9px;background:#eef0ea;color:#1f7a3d;padding:5px 9px;border-radius:6px">+1 Google Profile</span>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button style="background:#e8722e;color:#fff;border:none;font-weight:700;font-size:12px;padding:10px 16px;border-radius:9px;cursor:pointer;font-family:inherit">Start focus session</button>
        <span style="font-size:10.5px;color:#8a8577">Just do step one.</span>
      </div>
    </div>
    <div style="border-left:1px solid rgba(0,0,0,.07);padding:16px 12px;background:#f4f1ea;text-align:center">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:.1em;color:#8a8577;margin-bottom:10px">VISIBILITY SCORE</div>
      <div style="position:relative;width:78px;height:78px;margin:0 auto 6px">
        <svg viewBox="0 0 80 80" style="width:100%;height:100%;transform:rotate(-90deg)">
          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="8"></circle>
          <circle cx="40" cy="40" r="34" fill="none" stroke="#1f7a3d" stroke-width="8" stroke-linecap="round" stroke-dasharray="100.41 213.63"></circle>
        </svg>
        <div style="position:absolute;inset:0;display:grid;place-items:center">
          <div><span style="font-size:24px;font-weight:800">47</span><span style="font-size:11px;color:#8a8577">/100</span></div>
        </div>
      </div>
      <div style="font-size:9px;color:#8a8577;line-height:1.4;margin-bottom:14px">Google, website,<br>reviews, social</div>
      <div style="border-top:1px solid rgba(0,0,0,.08);padding-top:12px">
        <div style="font-size:22px;font-weight:800;color:#1f7a3d">11</div>
        <div style="font-size:8.5px;color:#8a8577">of 28 days done</div>
      </div>
    </div>
  </div>
</div>`;

const BODY = `<div style="font-family:var(--sans)">

<!-- ============ NAV ============ -->
<header style="position:sticky;top:0;z-index:60;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(0,0,0,.06);background-color:#FFFFFF">
  <nav style="max-width:1220px;margin:0 auto;padding:14px clamp(16px,4vw,40px);display:flex;align-items:center;justify-content:space-between;gap:16px">
    <a href="#top" style="display:flex;align-items:center;gap:10px">
      <span style="display:grid;place-items:center;border-radius:10px;padding:5px"><img src="/landing/logo.png" alt="CuraGo" style="width:219px;height:53px;object-fit:contain"></span>
    </a>
    <div class="dc-navlinks">
      <a href="#builder" style="color:#096B17;font-size:14.5px;font-weight:500">Practice Builder</a>
      <a href="#how" style="color:#096B17;font-size:14.5px;font-weight:500">How it works</a>
      <a href="#cohort" style="color:#096B17;font-size:14.5px;font-weight:500">Pricing</a>
      <a href="#books" style="color:#096B17;font-size:14.5px;font-weight:500">Buy books/masterclass</a>
      <a href="#free" style="color:#096B17;font-size:14.5px;font-weight:500">Free website builder</a>
      <a href="#cohort" style="background:var(--orange);color:#fff;font-weight:700;font-size:14.5px;padding:11px 20px;border-radius:11px;box-shadow:0 6px 18px rgba(255,122,26,.35)">Join the cohort</a>
    </div>
  </nav>
</header>

<!-- ============ HERO ============ -->
<section id="top" style="background:radial-gradient(120% 90% at 80% -10%,#0E6B25 0%,var(--forest) 45%,var(--forest-2) 100%);color:#fff;position:relative;overflow:hidden">
  <div style="max-width:1220px;margin:0 auto;padding:clamp(48px,7vw,96px) clamp(16px,4vw,40px) clamp(56px,7vw,104px);display:flex;flex-wrap:wrap;gap:clamp(32px,5vw,64px);align-items:center">
    <div style="flex:1 1 460px;min-width:300px">
      <div data-reveal="" style="font-family:var(--mono);font-size:24px;letter-spacing:.22em;color:#B4EBC2;margin-bottom:22px;display:flex;align-items:center;gap:10px;font-weight:700">
        <span style="width:8px;height:8px;border-radius:50%;background:var(--orange);animation:pulse 1.8s infinite"></span>
        ZERO TO PRACTICE BUILDER · FIRST COHORT
      </div>
      <h1 data-reveal="" style="font-weight:800;font-size:clamp(38px,6.4vw,74px);line-height:.98;letter-spacing:-.03em;margin:0 0 8px">
        You know you're<br>a good doctor.
      </h1>
      <h1 data-reveal="" data-reveal-delay="80" style="font-family:var(--serif);font-style:italic;font-weight:400;font-size:clamp(38px,6.4vw,74px);line-height:1;letter-spacing:-.01em;margin:0 0 26px;color:var(--leaf-2)">
        Patients don't.
      </h1>
      <p data-reveal="" data-reveal-delay="140" style="font-size:clamp(16px,1.4vw,19px);line-height:1.6;color:rgba(255,255,255,.8);max-width:520px;margin:0 0 34px">
        Most doctors don't struggle because they aren't skilled. They struggle because patients never discover them. <strong style="color:#fff;font-weight:600"><br>28 days, one task a day</strong> — from zero digital presence to a real, discoverable practice.
      </p>
      <div data-reveal="" data-reveal-delay="200" style="display:flex;flex-wrap:wrap;align-items:center;gap:16px">
        <a href="#cohort" style="background:var(--orange);color:#fff;font-weight:700;font-size:16px;padding:16px 28px;border-radius:13px;box-shadow:0 10px 30px rgba(232,114,46,.4)">Join the first cohort of Zero to Practice Builder</a>
      </div>
      <span style="display:inline-block;margin-top:12px;font-family:var(--mono);font-size:12.5px;color:var(--leaf-2)">₹5000/-, limited to 10 doctors</span>
      <div data-reveal="" data-reveal-delay="260" style="display:flex;flex-wrap:wrap;gap:26px;margin-top:40px;padding-top:26px;border-top:1px solid rgba(255,255,255,.14)">
        <div><div style="font-size:26px;font-weight:800;letter-spacing:-.02em">28</div><div style="font-size:12.5px;color:rgba(255,255,255,.6)">days, one mission each</div></div>
        <div><div style="font-size:26px;font-weight:800;letter-spacing:-.02em">around 60<span style="font-size:15px;font-weight:600;">mins</span></div><div style="font-size:12.5px;color:rgba(255,255,255,.6)">a day, between OPD &amp; dinner</div></div>
        <div><div style="font-size:26px;font-weight:800;letter-spacing:-.02em">7</div><div style="font-size:12.5px;color:rgba(255,255,255,.6)">assets you keep forever</div></div>
      </div>
    </div>
    <div data-reveal="" data-reveal-delay="120" style="flex:1 1 420px;min-width:290px;animation:floaty 7s ease-in-out infinite">
      ${DASHBOARD}
    </div>
  </div>
</section>

<!-- ============ DECISION-REMOVAL BAND ============ -->
<section style="background:var(--forest-3);color:#fff;text-align:center;padding:clamp(40px,6vw,72px) clamp(16px,4vw,40px)">
  <p data-reveal="" style="max-width:900px;margin:0 auto;font-family:var(--serif);font-style:italic;font-size:clamp(22px,3vw,36px);line-height:1.35;color:rgba(255,255,255,.92)">
    You already know you should build your practice.<br>You just don't know what to do <span style="color:var(--orange);font-style:normal;font-weight:700;font-family:var(--sans)">first</span>.
  </p>
  <p data-reveal="" data-reveal-delay="120" style="font-family:var(--mono);font-size:13px;letter-spacing:.16em;color:var(--leaf-2);margin-top:22px">ZERO TO PRACTICE BUILDER DECIDES FOR YOU.</p>
</section>

<!-- ============ SECTION 2 — PROBLEMS ============ -->
<section style="background:var(--cream);padding:clamp(56px,8vw,110px) clamp(16px,4vw,40px)">
  <div style="max-width:1120px;margin:0 auto">
    <div data-reveal="" style="max-width:760px">
      <div style="font-family:var(--mono);font-size:12px;letter-spacing:.2em;color:var(--leaf-ink);margin-bottom:18px">WHAT ACTUALLY GETS IN THE WAY</div>
      <h2 style="font-size:clamp(30px,4.6vw,52px);line-height:1.04;letter-spacing:-.025em;margin:0 0 16px;font-weight:800">Knowing what to do isn't the problem. <span style="font-family:var(--serif);font-style:italic;font-weight:400">Doing it, day after day, is.</span></h2>
      <p style="font-size:clamp(16px,1.3vw,18px);color:var(--ink-70);max-width:600px;margin:0">Four things quietly stop every doctor who tries to build a practice on their own.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:18px;margin-top:44px">
      <div data-reveal="" data-reveal-delay="0" style="background:var(--card);border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:28px 26px;box-shadow:0 1px 2px rgba(0,0,0,.04)">
        <div style="font-family:var(--serif);font-size:40px;color:var(--leaf-ink);line-height:1;margin-bottom:14px">01</div>
        <h3 style="font-size:20px;font-weight:700;margin:0 0 10px;letter-spacing:-.01em">Awareness</h3>
        <p style="font-size:14.5px;color:var(--ink-70);margin:0;line-height:1.55">Not knowing where to start. The first step is invisible.</p>
      </div>
      <div data-reveal="" data-reveal-delay="70" style="background:var(--card);border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:28px 26px;box-shadow:0 1px 2px rgba(0,0,0,.04)">
        <div style="font-family:var(--serif);font-size:40px;color:var(--leaf-ink);line-height:1;margin-bottom:14px">02</div>
        <h3 style="font-size:20px;font-weight:700;margin:0 0 10px;letter-spacing:-.01em">Decision Fatigue</h3>
        <p style="font-size:14.5px;color:var(--ink-70);margin:0;line-height:1.55">Reel today? A website? Is this ethical? Is it even worth it? Every day you burn energy just deciding.</p>
      </div>
      <div data-reveal="" data-reveal-delay="140" style="background:var(--card);border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:28px 26px;box-shadow:0 1px 2px rgba(0,0,0,.04)">
        <div style="font-family:var(--serif);font-size:40px;color:var(--leaf-ink);line-height:1;margin-bottom:14px">03</div>
        <h3 style="font-size:20px;font-weight:700;margin:0 0 10px;letter-spacing:-.01em">Inertia</h3>
        <p style="font-size:14.5px;color:var(--ink-70);margin:0;line-height:1.55">You already know what you should do. You just never start.</p>
      </div>
      <div data-reveal="" data-reveal-delay="210" style="background:var(--card);border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:28px 26px;box-shadow:0 1px 2px rgba(0,0,0,.04)">
        <div style="font-family:var(--serif);font-size:40px;color:var(--leaf-ink);line-height:1;margin-bottom:14px">04</div>
        <h3 style="font-size:20px;font-weight:700;margin:0 0 10px;letter-spacing:-.01em">Accountability</h3>
        <p style="font-size:14.5px;color:var(--ink-70);margin:0;line-height:1.55">Nobody tells you today's task, tomorrow's, or next week's. Eventually everything stops.</p>
      </div>
    </div>
    <div data-reveal="" style="margin-top:40px;background:var(--forest);color:#fff;border-radius:22px;padding:clamp(30px,4vw,50px);display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:space-between">
      <div style="flex:1 1 420px;min-width:280px">
        <div style="font-family:var(--mono);font-size:11.5px;letter-spacing:.2em;color:var(--leaf-2);margin-bottom:12px">THE FIX</div>
        <h3 style="font-size:clamp(24px,3vw,36px);line-height:1.1;letter-spacing:-.02em;margin:0 0 12px;font-weight:800">Zero to Practice Builder removes all four.</h3>
        <p style="color:rgba(255,255,255,.8);font-size:16px;margin:0;max-width:560px">Structured, task-based building plus daily accountability — so <em style="font-family:var(--serif);color:var(--leaf-2)">decision fatigue</em> and <em style="font-family:var(--serif);color:var(--leaf-2)">inertia</em> never get a vote. You just open today's mission and do it.</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <span style="background:rgba(255,255,255,.1);border-radius:99px;padding:9px 16px;font-size:13px;font-weight:600">✓ Direction</span>
        <span style="background:rgba(255,255,255,.1);border-radius:99px;padding:9px 16px;font-size:13px;font-weight:600">✓ One decision</span>
        <span style="background:rgba(255,255,255,.1);border-radius:99px;padding:9px 16px;font-size:13px;font-weight:600">✓ Momentum</span>
        <span style="background:rgba(255,255,255,.1);border-radius:99px;padding:9px 16px;font-size:13px;font-weight:600">✓ Accountability</span>
      </div>
    </div>
  </div>
</section>

<!-- ============ SECTION 3 — INTRODUCE THE PRODUCT ============ -->
<section id="builder" style="background:linear-gradient(180deg,var(--forest) 0%,var(--forest-2) 100%);color:#fff;padding:clamp(60px,8vw,120px) clamp(16px,4vw,40px);scroll-margin-top:72px">
  <div style="max-width:1180px;margin:0 auto">
    <div data-reveal="" style="text-align:center;margin-bottom:clamp(40px,5vw,68px)">
      <div style="font-family:var(--mono);font-size:12px;letter-spacing:.2em;color:var(--leaf-2);margin-bottom:20px">THE FLAGSHIP</div>
      <h2 style="font-size:clamp(40px,8vw,96px);line-height:.94;letter-spacing:-.035em;margin:0 0 18px;font-weight:800">Zero to Practice<br><span style="font-family:var(--serif);font-style:italic;font-weight:400;color:var(--leaf-2)">Builder</span></h2>
      <div style="display:inline-flex;align-items:center;gap:10px;background:rgba(83,205,129,.16);border:1px solid rgba(83,205,129,.4);border-radius:99px;padding:8px 18px;font-size:14px;font-weight:600;margin-bottom:18px">
        <span style="width:7px;height:7px;border-radius:50%;background:var(--leaf-2)"></span>Digital Foundation Builder · Builder Pack 01
      </div>
      <p style="font-size:clamp(18px,1.8vw,24px);max-width:640px;margin:0 auto;color:rgba(255,255,255,.85);line-height:1.4">Build the complete digital foundation of your practice in 28 days.</p>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:clamp(28px,4vw,52px);align-items:center">
      <div data-reveal="" style="flex:1 1 500px;min-width:300px">${DASHBOARD}</div>
      <div data-reveal="" data-reveal-delay="120" style="flex:1 1 360px;min-width:280px">
        <div style="font-family:var(--mono);font-size:12px;letter-spacing:.18em;color:var(--leaf-2);margin-bottom:20px">BY DAY 28 YOU'LL HAVE</div>
        <div style="display:grid;grid-template-columns:1fr;gap:2px">
          <div data-reveal="" data-reveal-delay="0" style="display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:1px solid rgba(255,255,255,.1)"><span style="flex:none;width:24px;height:24px;border-radius:50%;background:rgba(83,205,129,.2);border:1px solid var(--leaf);display:grid;place-items:center;color:var(--leaf-2);font-size:13px;font-weight:800">✓</span><span style="font-size:16px;font-weight:500">Google Business Profile</span></div>
          <div data-reveal="" data-reveal-delay="45" style="display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:1px solid rgba(255,255,255,.1)"><span style="flex:none;width:24px;height:24px;border-radius:50%;background:rgba(83,205,129,.2);border:1px solid var(--leaf);display:grid;place-items:center;color:var(--leaf-2);font-size:13px;font-weight:800">✓</span><span style="font-size:16px;font-weight:500">Professional Website</span></div>
          <div data-reveal="" data-reveal-delay="90" style="display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:1px solid rgba(255,255,255,.1)"><span style="flex:none;width:24px;height:24px;border-radius:50%;background:rgba(83,205,129,.2);border:1px solid var(--leaf);display:grid;place-items:center;color:var(--leaf-2);font-size:13px;font-weight:800">✓</span><span style="font-size:16px;font-weight:500">Service Pages</span></div>
          <div data-reveal="" data-reveal-delay="135" style="display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:1px solid rgba(255,255,255,.1)"><span style="flex:none;width:24px;height:24px;border-radius:50%;background:rgba(83,205,129,.2);border:1px solid var(--leaf);display:grid;place-items:center;color:var(--leaf-2);font-size:13px;font-weight:800">✓</span><span style="font-size:16px;font-weight:500">Disease Pages</span></div>
          <div data-reveal="" data-reveal-delay="180" style="display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:1px solid rgba(255,255,255,.1)"><span style="flex:none;width:24px;height:24px;border-radius:50%;background:rgba(83,205,129,.2);border:1px solid var(--leaf);display:grid;place-items:center;color:var(--leaf-2);font-size:13px;font-weight:800">✓</span><span style="font-size:16px;font-weight:500">Social Media Strategy</span></div>
          <div data-reveal="" data-reveal-delay="225" style="display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:1px solid rgba(255,255,255,.1)"><span style="flex:none;width:24px;height:24px;border-radius:50%;background:rgba(83,205,129,.2);border:1px solid var(--leaf);display:grid;place-items:center;color:var(--leaf-2);font-size:13px;font-weight:800">✓</span><span style="font-size:16px;font-weight:500">Review System</span></div>
          <div data-reveal="" data-reveal-delay="270" style="display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:1px solid rgba(255,255,255,.1)"><span style="flex:none;width:24px;height:24px;border-radius:50%;background:rgba(83,205,129,.2);border:1px solid var(--leaf);display:grid;place-items:center;color:var(--leaf-2);font-size:13px;font-weight:800">✓</span><span style="font-size:16px;font-weight:500">Brand Identity</span></div>
          <div data-reveal="" data-reveal-delay="315" style="display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:1px solid rgba(255,255,255,.1)"><span style="flex:none;width:24px;height:24px;border-radius:50%;background:rgba(83,205,129,.2);border:1px solid var(--leaf);display:grid;place-items:center;color:var(--leaf-2);font-size:13px;font-weight:800">✓</span><span style="font-size:16px;font-weight:500">AI Content System</span></div>
          <div data-reveal="" data-reveal-delay="360" style="display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:1px solid rgba(255,255,255,.1)"><span style="flex:none;width:24px;height:24px;border-radius:50%;background:rgba(83,205,129,.2);border:1px solid var(--leaf);display:grid;place-items:center;color:var(--leaf-2);font-size:13px;font-weight:800">✓</span><span style="font-size:16px;font-weight:500">Everything organised</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============ SECTION 4 — HOW IT WORKS ============ -->
<section id="how" style="background:var(--cream);padding:clamp(56px,8vw,110px) clamp(16px,4vw,40px);scroll-margin-top:72px">
  <div style="max-width:1100px;margin:0 auto">
    <div data-reveal="" style="text-align:center;max-width:680px;margin:0 auto 48px">
      <div style="font-family:var(--mono);font-size:12px;letter-spacing:.2em;color:var(--leaf-ink);margin-bottom:16px">HOW IT WORKS</div>
      <h2 style="font-size:clamp(30px,4.6vw,52px);line-height:1.04;letter-spacing:-.025em;margin:0 0 14px;font-weight:800">All you do is <span style="font-family:var(--serif);font-style:italic;font-weight:400">follow the instructions.</span></h2>
      <p style="font-size:17px;color:var(--ink-70);margin:0">The same simple loop, every single day.</p>
    </div>
    <div data-reveal="" style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-bottom:28px">
      <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:99px;border:1px solid var(--orange);background:var(--orange);color:#fff"><span style="font-family:var(--mono);font-size:11px;opacity:.7">01</span><span style="font-weight:700;font-size:14.5px">Day 1</span></div>
      <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:99px;border:1px solid rgba(0,0,0,.14);background:#fff;color:var(--ink)"><span style="font-family:var(--mono);font-size:11px;opacity:.7">02</span><span style="font-weight:700;font-size:14.5px">Mission &amp; Modules</span></div>
      <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:99px;border:1px solid rgba(0,0,0,.14);background:#fff;color:var(--ink)"><span style="font-family:var(--mono);font-size:11px;opacity:.7">03</span><span style="font-weight:700;font-size:14.5px">Follow the detailed instructions</span></div>
      <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:99px;border:1px solid rgba(0,0,0,.14);background:#fff;color:var(--ink)"><span style="font-family:var(--mono);font-size:11px;opacity:.7">04</span><span style="font-weight:700;font-size:14.5px">Give inputs</span></div>
      <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:99px;border:1px solid rgba(0,0,0,.14);background:#fff;color:var(--ink)"><span style="font-family:var(--mono);font-size:11px;opacity:.7">05</span><span style="font-weight:700;font-size:14.5px">Go to the next module</span></div>
      <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:99px;border:1px solid rgba(0,0,0,.14);background:#fff;color:var(--ink)"><span style="font-family:var(--mono);font-size:11px;opacity:.7">06</span><span style="font-weight:700;font-size:14.5px">Done.</span></div>
    </div>
    <div data-reveal="" style="background:var(--card);border:1px solid rgba(0,0,0,.08);border-radius:22px;padding:clamp(24px,4vw,44px);box-shadow:0 16px 50px rgba(0,0,0,.07);min-height:220px;display:flex;flex-wrap:wrap;gap:32px;align-items:center">
      <div style="flex:1 1 320px;min-width:260px">
        <div style="font-family:var(--mono);font-size:12px;color:var(--orange);letter-spacing:.14em;margin-bottom:14px">STEP 01 / 06</div>
        <h3 style="font-size:clamp(24px,3vw,34px);margin:0 0 12px;font-weight:800;letter-spacing:-.02em">Day 1</h3>
        <p style="font-size:16px;color:var(--ink-70);margin:0;line-height:1.6">You open the app to exactly one thing — today's mission. No dashboard to configure, no plan to make.</p>
      </div>
    </div>
  </div>
</section>

<!-- ============ SECTION 5&6 — VIDEOS ============ -->
<section style="background:var(--forest-2);color:#fff;padding:clamp(56px,8vw,104px) clamp(16px,4vw,40px)">
  <div style="max-width:1160px;margin:0 auto">
    <div data-reveal="" style="text-align:center;margin-bottom:44px">
      <div style="font-family:var(--mono);font-size:12px;letter-spacing:.2em;color:var(--leaf-2);margin-bottom:14px">SEE IT FOR YOURSELF</div>
      <h2 style="font-size:clamp(28px,4vw,46px);letter-spacing:-.025em;margin:0;font-weight:800">Watch, then decide.</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px">
      <div data-reveal="" data-reveal-delay="0" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:20px;overflow:hidden">
        <div style="aspect-ratio:16/9;background:linear-gradient(135deg,#0E6B25,#083b13);display:grid;place-items:center;position:relative;border-bottom:1px solid rgba(255,255,255,.1)">
          <div style="width:74px;height:74px;border-radius:50%;background:var(--orange);display:grid;place-items:center;box-shadow:0 10px 30px rgba(232,114,46,.5);cursor:pointer">
            <span style="border-left:20px solid #fff;border-top:12px solid transparent;border-bottom:12px solid transparent;margin-left:5px"></span>
          </div>
          <span style="position:absolute;top:14px;left:14px;font-family:var(--mono);font-size:11px;letter-spacing:.14em;background:rgba(0,0,0,.35);padding:5px 10px;border-radius:8px">EXPLAINER · 3–5 MIN</span>
          <span style="position:absolute;bottom:14px;right:14px;font-family:var(--mono);font-size:11px;background:rgba(0,0,0,.35);padding:5px 10px;border-radius:8px">04:12</span>
        </div>
        <div style="padding:24px 26px">
          <h3 style="font-size:22px;font-weight:800;margin:0 0 8px;letter-spacing:-.01em">Why this exists</h3>
          <p style="color:rgba(255,255,255,.72);font-size:15px;margin:0;line-height:1.55">The thinking behind Practice Builder and why decision-removal beats another course.</p>
        </div>
      </div>
      <div data-reveal="" data-reveal-delay="100" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:20px;overflow:hidden">
        <div style="aspect-ratio:16/9;background:linear-gradient(135deg,#0E6B25,#083b13);display:grid;place-items:center;position:relative;border-bottom:1px solid rgba(255,255,255,.1)">
          <div style="width:74px;height:74px;border-radius:50%;background:var(--orange);display:grid;place-items:center;box-shadow:0 10px 30px rgba(232,114,46,.5);cursor:pointer">
            <span style="border-left:20px solid #fff;border-top:12px solid transparent;border-bottom:12px solid transparent;margin-left:5px"></span>
          </div>
          <span style="position:absolute;top:14px;left:14px;font-family:var(--mono);font-size:11px;letter-spacing:.14em;background:rgba(0,0,0,.35);padding:5px 10px;border-radius:8px">DEMO · 10 MIN</span>
          <span style="position:absolute;bottom:14px;right:14px;font-family:var(--mono);font-size:11px;background:rgba(0,0,0,.35);padding:5px 10px;border-radius:8px">10:06</span>
        </div>
        <div style="padding:24px 26px">
          <h3 style="font-size:22px;font-weight:800;margin:0 0 8px;letter-spacing:-.01em">Inside the dashboard</h3>
          <p style="color:rgba(255,255,255,.72);font-size:15px;margin:0;line-height:1.55">A full walkthrough — mission, workspace, Builder Pack, reference and the AI, end to end.</p>
        </div>
      </div>
    </div>
    <p data-reveal="" style="text-align:center;font-family:var(--mono);font-size:12px;color:rgba(255,255,255,.45);margin-top:26px">video placeholders — final explainer &amp; demo drop in here</p>
  </div>
</section>

<!-- ============ SECTION 7 — WHAT'S INSIDE + BUILDER PACKS ============ -->
<section id="packs" style="background:var(--cream);padding:clamp(56px,8vw,110px) clamp(16px,4vw,40px);scroll-margin-top:72px">
  <div style="max-width:1120px;margin:0 auto">
    <div data-reveal="" style="max-width:720px;margin-bottom:44px">
      <div style="font-family:var(--mono);font-size:12px;letter-spacing:.2em;color:var(--leaf-ink);margin-bottom:16px">INSIDE THE DIGITAL FOUNDATION BUILDER</div>
      <h2 style="font-size:clamp(30px,4.6vw,50px);line-height:1.05;letter-spacing:-.025em;margin:0 0 14px;font-weight:800">What's inside <span style="font-family:var(--serif);font-style:italic;font-weight:400">28 missions.</span></h2>
      <p style="font-size:17px;color:var(--ink-70);margin:0">Every day is one mission, most split into detailed modules. A sample of the map:</p>
    </div>
    <div style="position:relative;padding-left:28px;border-left:2px solid rgba(0,0,0,.1);display:flex;flex-direction:column;gap:16px">
      <div data-reveal="" data-reveal-delay="0" style="position:relative;background:var(--card);border:1px solid rgba(0,0,0,.07);border-radius:16px;padding:22px 24px;box-shadow:0 1px 2px rgba(0,0,0,.04)">
        <span style="position:absolute;left:-38px;top:26px;width:16px;height:16px;border-radius:50%;background:var(--leaf-ink);border:3px solid var(--cream)"></span>
        <div style="font-family:var(--mono);font-size:11.5px;letter-spacing:.12em;color:var(--orange);margin-bottom:8px">Day 1 · Mission 1</div>
        <h3 style="font-size:19px;font-weight:700;margin:0 0 6px;letter-spacing:-.01em">Basic Setup</h3>
        <p style="font-size:14px;color:var(--ink-70);margin:0">Split into 6 detailed modules</p>
      </div>
      <div data-reveal="" data-reveal-delay="60" style="position:relative;background:var(--card);border:1px solid rgba(0,0,0,.07);border-radius:16px;padding:22px 24px;box-shadow:0 1px 2px rgba(0,0,0,.04)">
        <span style="position:absolute;left:-38px;top:26px;width:16px;height:16px;border-radius:50%;background:var(--leaf-ink);border:3px solid var(--cream)"></span>
        <div style="font-family:var(--mono);font-size:11.5px;letter-spacing:.12em;color:var(--orange);margin-bottom:8px">Day 2 · Mission 2</div>
        <h3 style="font-size:19px;font-weight:700;margin:0 0 6px;letter-spacing:-.01em">Competitor Research</h3>
        <p style="font-size:14px;color:var(--ink-70);margin:0">Split into 4 detailed modules</p>
      </div>
      <div data-reveal="" data-reveal-delay="120" style="position:relative;background:var(--card);border:1px solid rgba(0,0,0,.07);border-radius:16px;padding:22px 24px;box-shadow:0 1px 2px rgba(0,0,0,.04)">
        <span style="position:absolute;left:-38px;top:26px;width:16px;height:16px;border-radius:50%;background:var(--leaf-ink);border:3px solid var(--cream)"></span>
        <div style="font-family:var(--mono);font-size:11.5px;letter-spacing:.12em;color:var(--orange);margin-bottom:8px">Day 7 · Mission 7</div>
        <h3 style="font-size:19px;font-weight:700;margin:0 0 6px;letter-spacing:-.01em">Shoot your first set of reels</h3>
        <p style="font-size:14px;color:var(--ink-70);margin:0">From the scripts you already approved</p>
      </div>
      <div data-reveal="" data-reveal-delay="180" style="position:relative;background:var(--card);border:1px solid rgba(0,0,0,.07);border-radius:16px;padding:22px 24px;box-shadow:0 1px 2px rgba(0,0,0,.04)">
        <span style="position:absolute;left:-38px;top:26px;width:16px;height:16px;border-radius:50%;background:var(--leaf-ink);border:3px solid var(--cream)"></span>
        <div style="font-family:var(--mono);font-size:11.5px;letter-spacing:.12em;color:var(--orange);margin-bottom:8px">Day 24 · Mission 24</div>
        <h3 style="font-size:19px;font-weight:700;margin:0 0 6px;letter-spacing:-.01em">Keep optimising GBP &amp; website</h3>
        <p style="font-size:14px;color:var(--ink-70);margin:0">Split into 5 detailed modules</p>
      </div>
      <div data-reveal="" style="position:relative;padding:14px 24px;font-family:var(--serif);font-style:italic;font-size:18px;color:var(--ink-50)">
        <span style="position:absolute;left:-36px;top:20px;width:12px;height:12px;border-radius:50%;background:rgba(0,0,0,.2);border:3px solid var(--cream)"></span>
        …and one clear mission for every remaining day, to Day 28.
      </div>
    </div>

    <div data-reveal="" style="margin-top:clamp(48px,6vw,80px)">
      <div style="display:flex;flex-wrap:wrap;align-items:end;justify-content:space-between;gap:12px;margin-bottom:22px">
        <div>
          <div style="font-family:var(--mono);font-size:12px;letter-spacing:.2em;color:var(--leaf-ink);margin-bottom:10px">THE BUILDER PACK FAMILY</div>
          <h3 style="font-size:clamp(24px,3.4vw,38px);letter-spacing:-.02em;margin:0;font-weight:800">One is live. More are coming.</h3>
        </div>
        <span style="font-family:var(--mono);font-size:12px;color:var(--ink-50)">scroll →</span>
      </div>
      <div style="display:flex;gap:18px;overflow-x:auto;padding:6px 2px 20px;scroll-snap-type:x mandatory">
        <div style="flex:0 0 78%;max-width:300px;scroll-snap-align:start;border-radius:20px;padding:26px 24px;border:1px solid rgba(255,255,255,.18);background:linear-gradient(160deg,var(--forest),var(--forest-3));color:#fff;box-shadow:0 20px 50px rgba(21,58,28,.35)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><span style="font-size:26px">🏗️</span><span style="font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;background:var(--orange);color:#fff;padding:5px 10px;border-radius:7px;font-weight:600">LIVE</span></div>
          <h4 style="font-size:20px;font-weight:800;margin:0 0 8px;letter-spacing:-.01em">Digital Foundation Builder</h4>
          <p style="font-size:14px;color:rgba(255,255,255,.82);margin:0;line-height:1.5">From zero digital presence to a real, discoverable practice in 28 days.</p>
        </div>
        <div style="flex:0 0 78%;max-width:300px;scroll-snap-align:start;border-radius:20px;padding:26px 24px;border:1px solid rgba(0,0,0,.08);background:var(--card);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.04)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><span style="font-size:26px">📣</span><span style="font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;background:rgba(0,0,0,.07);color:var(--ink-50);padding:5px 10px;border-radius:7px;font-weight:600">NEXT</span></div>
          <h4 style="font-size:20px;font-weight:800;margin:0 0 8px;letter-spacing:-.01em">Paid Ads Builder</h4>
          <p style="font-size:14px;color:var(--ink-70);margin:0;line-height:1.5">Run ethical, compliant ads that actually bring the right patients in.</p>
        </div>
        <div style="flex:0 0 78%;max-width:300px;scroll-snap-align:start;border-radius:20px;padding:26px 24px;border:1px solid rgba(0,0,0,.08);background:var(--card);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.04)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><span style="font-size:26px">💬</span><span style="font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;background:rgba(0,0,0,.07);color:var(--ink-50);padding:5px 10px;border-radius:7px;font-weight:600">SOON</span></div>
          <h4 style="font-size:20px;font-weight:800;margin:0 0 8px;letter-spacing:-.01em">WhatsApp Funnels</h4>
          <p style="font-size:14px;color:var(--ink-70);margin:0;line-height:1.5">Turn enquiries into booked appointments, on autopilot.</p>
        </div>
        <div style="flex:0 0 78%;max-width:300px;scroll-snap-align:start;border-radius:20px;padding:26px 24px;border:1px solid rgba(0,0,0,.08);background:var(--card);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.04)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><span style="font-size:26px">🎯</span><span style="font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;background:rgba(0,0,0,.07);color:var(--ink-50);padding:5px 10px;border-radius:7px;font-weight:600">SOON</span></div>
          <h4 style="font-size:20px;font-weight:800;margin:0 0 8px;letter-spacing:-.01em">Lead Generation Funnels</h4>
          <p style="font-size:14px;color:var(--ink-70);margin:0;line-height:1.5">A steady, predictable flow of the patients you want to treat.</p>
        </div>
        <div style="flex:0 0 78%;max-width:300px;scroll-snap-align:start;border-radius:20px;padding:26px 24px;border:1px solid rgba(0,0,0,.08);background:var(--card);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.04)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><span style="font-size:26px">👥</span><span style="font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;background:rgba(0,0,0,.07);color:var(--ink-50);padding:5px 10px;border-radius:7px;font-weight:600">SOON</span></div>
          <h4 style="font-size:20px;font-weight:800;margin:0 0 8px;letter-spacing:-.01em">Team Hiring Builder</h4>
          <p style="font-size:14px;color:var(--ink-70);margin:0;line-height:1.5">Hire and train front-desk and marketing help the right way.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============ SECTION 8 — WHAT YOU DON'T GET ============ -->
<section style="background:var(--forest);color:#fff;padding:clamp(56px,8vw,104px) clamp(16px,4vw,40px)">
  <div style="max-width:1000px;margin:0 auto">
    <div data-reveal="" style="text-align:center;max-width:640px;margin:0 auto 44px">
      <div style="font-family:var(--mono);font-size:12px;letter-spacing:.2em;color:var(--leaf-2);margin-bottom:16px">CLEAR ON THE LINE</div>
      <h2 style="font-size:clamp(30px,4.6vw,50px);line-height:1.05;letter-spacing:-.025em;margin:0 0 14px;font-weight:800">What you <span style="font-family:var(--serif);font-style:italic;font-weight:400;color:var(--leaf-2)">don't</span> get.</h2>
      <p style="font-size:20px;color:rgba(255,255,255,.75);margin:0">This isn't an agency. <br>We don't run ads for you, we don't manage your clinic, we don't promise patients. <br>It's a system that puts you in charge. <br>You become the person executing.</p>
    </div>
    <p data-reveal="" style="text-align:center;font-family:var(--serif);font-style:italic;font-size:clamp(22px,3vw,32px);margin:36px 0 0;color:var(--leaf-2)">We simply remove today's decision.</p>
  </div>
</section>

<!-- ============ SECTION 9 — WHO IT'S FOR ============ -->
<section style="background:var(--cream);padding:clamp(56px,8vw,104px) clamp(16px,4vw,40px)">
  <div style="max-width:1080px;margin:0 auto">
    <h2 data-reveal="" style="font-size:clamp(30px,4.6vw,50px);letter-spacing:-.025em;margin:0 0 40px;font-weight:800;text-align:center">Who this is <span style="font-family:var(--serif);font-style:italic;font-weight:400">for.</span></h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px">
      <div data-reveal="" style="background:var(--card);border:1px solid rgba(9,177,23,.25);border-radius:20px;padding:clamp(26px,3vw,38px);box-shadow:0 1px 3px rgba(0,0,0,.05)">
        <div style="font-family:var(--mono);font-size:12px;letter-spacing:.16em;color:var(--leaf-ink);margin-bottom:20px">✓ THIS IS FOR YOU IF</div>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div style="display:flex;gap:12px;align-items:flex-start"><span style="flex:none;color:var(--leaf-ink);font-weight:800;margin-top:1px">✓</span><span style="font-size:15.5px;color:var(--ink);line-height:1.5">Practicing consultants with a clinic space (own or rented)</span></div>
          <div style="display:flex;gap:12px;align-items:flex-start"><span style="flex:none;color:var(--leaf-ink);font-weight:800;margin-top:1px">✓</span><span style="font-size:15.5px;color:var(--ink);line-height:1.5">Recently finished MS / MD / DM / MCh with a clinic space</span></div>
          <div style="display:flex;gap:12px;align-items:flex-start"><span style="flex:none;color:var(--leaf-ink);font-weight:800;margin-top:1px">✓</span><span style="font-size:15.5px;color:var(--ink);line-height:1.5">Clinic owners ready to be found</span></div>
          <div style="display:flex;gap:12px;align-items:flex-start"><span style="flex:none;color:var(--leaf-ink);font-weight:800;margin-top:1px">✓</span><span style="font-size:15.5px;color:var(--ink);line-height:1.5">General Physicians &amp; RMPs with a clinic</span></div>
        </div>
      </div>
      <div data-reveal="" data-reveal-delay="100" style="background:var(--cream-2);border:1px solid rgba(0,0,0,.08);border-radius:20px;padding:clamp(26px,3vw,38px)">
        <div style="font-family:var(--mono);font-size:12px;letter-spacing:.16em;color:var(--ink-50);margin-bottom:20px">✕ NOT FOR YOU IF</div>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div style="display:flex;gap:12px;align-items:flex-start"><span style="flex:none;color:var(--ink-50);font-weight:800;margin-top:1px">✕</span><span style="font-size:15.5px;color:var(--ink-70);line-height:1.5">Doctors without a clinic space</span></div>
          <div style="display:flex;gap:12px;align-items:flex-start"><span style="flex:none;color:var(--ink-50);font-weight:800;margin-top:1px">✕</span><span style="font-size:15.5px;color:var(--ink-70);line-height:1.5">People looking for overnight growth</span></div>
          <div style="display:flex;gap:12px;align-items:flex-start"><span style="flex:none;color:var(--ink-50);font-weight:800;margin-top:1px">✕</span><span style="font-size:15.5px;color:var(--ink-70);line-height:1.5">People unwilling to execute</span></div>
          <div style="display:flex;gap:12px;align-items:flex-start"><span style="flex:none;color:var(--ink-50);font-weight:800;margin-top:1px">✕</span><span style="font-size:15.5px;color:var(--ink-70);line-height:1.5">Agencies</span></div>
          <div style="display:flex;gap:12px;align-items:flex-start"><span style="flex:none;color:var(--ink-50);font-weight:800;margin-top:1px">✕</span><span style="font-size:15.5px;color:var(--ink-70);line-height:1.5">Medical students</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============ SECTION 10 — FOUNDING COHORT (PRICING) ============ -->
<section id="cohort" style="background:linear-gradient(180deg,var(--forest-2),var(--forest-3));color:#fff;padding:clamp(60px,8vw,120px) clamp(16px,4vw,40px);scroll-margin-top:72px">
  <div style="max-width:920px;margin:0 auto;text-align:center">
    <div data-reveal="">
      <div style="font-family:var(--mono);font-size:12px;letter-spacing:.2em;color:var(--orange);margin-bottom:18px">FOUNDING COHORT · ONLY 10 SEATS</div>
      <h2 style="font-size:clamp(34px,5.4vw,64px);line-height:1;letter-spacing:-.03em;margin:0 0 16px;font-weight:800">Join the <span style="font-family:var(--serif);font-style:italic;font-weight:400;color:var(--leaf-2)">founding cohort.</span></h2>
      <p style="font-size:17px;color:rgba(255,255,255,.75);max-width:520px;margin:0 auto 40px">The first 10 doctors set the price for good. Locked for as long as you stay.</p>
    </div>
    <div data-reveal="" data-reveal-delay="100" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);border-radius:26px;padding:clamp(30px,4vw,52px);max-width:520px;margin:0 auto;box-shadow:0 30px 80px rgba(0,0,0,.35)">
      <div style="display:flex;align-items:baseline;justify-content:center;gap:10px;margin-bottom:8px">
        <span style="font-size:clamp(48px,9vw,76px);font-weight:800;letter-spacing:-.03em;line-height:1">₹5,000</span>
        <span style="font-family:var(--mono);font-size:13px;color:var(--leaf-2)">founding price</span>
      </div>
      <div style="display:flex;justify-content:center;gap:18px;flex-wrap:wrap;margin-bottom:26px">
        <span style="font-family:var(--mono);font-size:13px;color:rgba(255,255,255,.55)">Next cohort <s style="text-decoration-line:none">₹10,000</s></span>
        <span style="font-family:var(--mono);font-size:13px;color:rgba(255,255,255,.55)">Full launch <s style="text-decoration-line:none">₹20,000</s></span>
      </div>
      <div style="display:flex;gap:10px;background:rgba(0,0,0,.25);border-radius:14px;padding:8px;flex-wrap:wrap">
        <input type="email" placeholder="Your email" style="flex:1 1 200px;min-width:0;background:transparent;border:none;outline:none;color:#fff;font-size:16px;padding:12px 14px;font-family:var(--sans)">
        <button class="btn" style="background:var(--orange);color:#fff;font-weight:700;font-size:15.5px;padding:14px 24px;border:none;border-radius:11px;cursor:pointer;font-family:var(--sans)">Join the waitlist</button>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:18px">
        <div style="display:flex;gap:3px">
          <span style="width:10px;height:10px;border-radius:3px;background:var(--orange)"></span>
          <span style="width:10px;height:10px;border-radius:3px;background:var(--orange)"></span>
          <span style="width:10px;height:10px;border-radius:3px;background:var(--orange)"></span>
          <span style="width:10px;height:10px;border-radius:3px;background:rgba(255,255,255,.25)"></span>
          <span style="width:10px;height:10px;border-radius:3px;background:rgba(255,255,255,.25)"></span>
          <span style="width:10px;height:10px;border-radius:3px;background:rgba(255,255,255,.25)"></span>
          <span style="width:10px;height:10px;border-radius:3px;background:rgba(255,255,255,.25)"></span>
          <span style="width:10px;height:10px;border-radius:3px;background:rgba(255,255,255,.25)"></span>
          <span style="width:10px;height:10px;border-radius:3px;background:rgba(255,255,255,.25)"></span>
          <span style="width:10px;height:10px;border-radius:3px;background:rgba(255,255,255,.25)"></span>
        </div>
        <span style="font-family:var(--mono);font-size:12px;color:var(--leaf-2)">10 seats · filling fast</span>
      </div>
    </div>
    <p data-reveal="" style="font-family:var(--mono);font-size:12px;color:rgba(255,255,255,.45);margin-top:24px">Payments via Razorpay · cancel anytime · you keep everything you build</p>
  </div>
</section>

<!-- ============ SECTION 13 — FOUNDER ============ -->
<section style="background:var(--cream);padding:clamp(56px,8vw,104px) clamp(16px,4vw,40px)">
  <div style="max-width:900px;margin:0 auto;display:flex;flex-wrap:wrap;gap:clamp(28px,4vw,52px);align-items:center">
    <div data-reveal="" style="flex:0 0 auto">
      <div style="width:clamp(150px,22vw,220px);aspect-ratio:1;border-radius:24px;overflow:hidden;background:var(--cream-2);box-shadow:0 16px 44px rgba(0,0,0,.15);border:1px solid var(--border)"><img src="/landing/founder.png" alt="Dr Yuvaraj" style="width:100%;height:100%;object-fit:cover;object-position:center 20%"></div>
    </div>
    <div data-reveal="" data-reveal-delay="100" style="flex:1 1 380px;min-width:280px">
      <div style="font-family:var(--mono);font-size:12px;letter-spacing:.18em;color:var(--leaf-ink);margin-bottom:16px">WHY I BUILT THIS</div>
      <p style="font-size:clamp(17px,1.5vw,20px);line-height:1.6;color:var(--ink);margin:0 0 16px">I'm a surgical gastroenterologist. I watched skilled colleagues stay invisible while doctors with a fraction of the training filled their waiting rooms — not because they were better, but because patients could actually <em style="font-family:var(--serif)">find</em> them.</p>
      <p style="font-size:clamp(17px,1.5vw,20px);line-height:1.6;color:var(--ink-70);margin:0 0 20px">I didn't need another course. I needed someone to tell me the one thing to do today. So I built the system I wished existed — the exact 28 missions, in order, with the deciding already done. This is that system.</p>
      <div style="font-weight:800;font-size:18px">Dr Yuvaraj</div>
      <div style="font-family:var(--mono);font-size:13px;color:var(--ink-50)">Surgical Gastroenterologist · Founder, CuraGo</div>
    </div>
  </div>
</section>

<!-- ============ SECTION 11 — BOOKS (SECONDARY) ============ -->
<section id="books" style="background:var(--cream-2);padding:clamp(56px,8vw,104px) clamp(16px,4vw,40px);scroll-margin-top:72px">
  <div style="max-width:1080px;margin:0 auto">
    <div data-reveal="" style="text-align:center;max-width:620px;margin:0 auto 44px">
      <div style="font-family:var(--mono);font-size:12px;letter-spacing:.2em;color:var(--ink-50);margin-bottom:14px">IF YOU'RE NOT READY FOR THE COHORT</div>
      <h2 style="font-size:clamp(28px,4vw,44px);letter-spacing:-.025em;margin:0 0 12px;font-weight:800">Start with the <span style="font-family:var(--serif);font-style:italic;font-weight:400">book.</span></h2>
      <p style="font-size:16px;color:var(--ink-70);margin:0">The same thinking behind Practice Builder, in a form you can read or watch today.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px">
      <div data-reveal="" data-reveal-delay="0" style="background:var(--card);border:1px solid rgba(0,0,0,.08);border-radius:20px;padding:clamp(24px,3vw,34px)">
        <div style="font-family:var(--mono);font-size:11.5px;letter-spacing:.14em;color:var(--ink-50);margin-bottom:14px">THE BOOK</div>
        <h3 style="font-size:24px;font-weight:800;margin:0 0 10px;letter-spacing:-.01em">Zero to Practice E-Book</h3>
        <p style="font-size:14.5px;color:var(--ink-70);margin:0 0 18px;line-height:1.55">A guide to digital first clinical practice building. All aspects covered over 12 chapters and 70+ pages.</p>
        <div style="font-size:34px;font-weight:800;letter-spacing:-.02em;margin-bottom:18px">₹499 <span style="font-size:13px;font-family:var(--mono);color:var(--ink-50);font-weight:400">one-time · instant</span></div>
        <div class="rzp-btn" data-rzp="pl_TK72xlstYNo245"></div>
      </div>
      <div data-reveal="" data-reveal-delay="80" style="background:var(--card);border:1px solid rgba(0,0,0,.08);border-radius:20px;padding:clamp(24px,3vw,34px)">
        <div style="font-family:var(--mono);font-size:11.5px;letter-spacing:.14em;color:var(--ink-50);margin-bottom:14px">THE MASTERCLASS</div>
        <h3 style="font-size:24px;font-weight:800;margin:0 0 10px;letter-spacing:-.01em">Zero to Practice Masterclass</h3>
        <p style="font-size:14.5px;color:var(--ink-70);margin:0 0 18px;line-height:1.55">A 2-hour recorded session of the same concepts of the book, but in more depths and more nuanced.</p>
        <div style="font-size:34px;font-weight:800;letter-spacing:-.02em;margin-bottom:18px">₹999 <span style="font-size:13px;font-family:var(--mono);color:var(--ink-50);font-weight:400">lifetime access</span></div>
        <div class="rzp-btn" data-rzp="pl_TK74q5urOSdJ3R"></div>
      </div>
    </div>
    <div data-reveal="" style="margin-top:20px;background:var(--card);border:2px solid var(--leaf-ink);border-radius:20px;padding:clamp(22px,3vw,32px);display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:space-between">
      <div style="flex:1 1 320px">
        <div style="font-family:var(--mono);font-size:11.5px;letter-spacing:.14em;color:var(--leaf-ink);margin-bottom:8px">BEST VALUE · BOOK + MASTERCLASS</div>
        <h3 style="font-size:22px;font-weight:800;margin:0 0 4px">Get both together</h3>
        <p style="font-size:14px;color:var(--ink-70);margin:0">Read it, then watch it worked through end to end.</p>
      </div>
      <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
        <div style="font-size:32px;font-weight:800;letter-spacing:-.02em">₹1,199 <s style="font-size:15px;color:var(--ink-50);font-weight:400">₹1,498</s></div>
        <div class="rzp-btn" data-rzp="pl_TLOMeh4Zk7NbtR"></div>
      </div>
    </div>
  </div>
</section>

<!-- ============ SECTION 12 — FAQ ============ -->
<section id="faq" style="background:var(--cream);padding:clamp(56px,8vw,104px) clamp(16px,4vw,40px);scroll-margin-top:72px">
  <div style="max-width:820px;margin:0 auto">
    <div data-reveal="" style="text-align:center;margin-bottom:40px">
      <div style="font-family:var(--mono);font-size:12px;letter-spacing:.2em;color:var(--leaf-ink);margin-bottom:14px">QUESTIONS</div>
      <h2 style="font-size:clamp(30px,4.6vw,50px);letter-spacing:-.025em;margin:0;font-weight:800">Before you <span style="font-family:var(--serif);font-style:italic;font-weight:400">join.</span></h2>
    </div>
    <div style="display:flex;flex-direction:column">
      <details class="faq" data-reveal="" open style="border-bottom:1px solid rgba(0,0,0,.12)">
        <summary><span style="font-size:clamp(16px,1.6vw,19px);font-weight:700;color:var(--ink)">Why 28 days?</span><span class="faq-plus">+</span></summary>
        <p style="font-size:15.5px;color:var(--ink-70);margin:0;padding:0 4px 22px;line-height:1.6;max-width:680px">Long enough to build something real, short enough to stay disciplined. One mission a day keeps momentum without eating into your practice.</p>
      </details>
      <details class="faq" data-reveal="" style="border-bottom:1px solid rgba(0,0,0,.12)">
        <summary><span style="font-size:clamp(16px,1.6vw,19px);font-weight:700;color:var(--ink)">How much time does it take daily?</span><span class="faq-plus">+</span></summary>
        <p style="font-size:15.5px;color:var(--ink-70);margin:0;padding:0 4px 22px;line-height:1.6;max-width:680px">Around 60 minutes. Every mission is sized to fit between OPD and dinner or between your work and evening OPD.</p>
      </details>
      <details class="faq" data-reveal="" style="border-bottom:1px solid rgba(0,0,0,.12)">
        <summary><span style="font-size:clamp(16px,1.6vw,19px);font-weight:700;color:var(--ink)">Will AI write everything for me?</span><span class="faq-plus">+</span></summary>
        <p style="font-size:15.5px;color:var(--ink-70);margin:0;padding:0 4px 22px;line-height:1.6;max-width:680px">AI does the heavy lifting — you copy a prompt, generate, review, and publish. Your judgement stays in charge of every word that goes out.</p>
      </details>
      <details class="faq" data-reveal="" style="border-bottom:1px solid rgba(0,0,0,.12)">
        <summary><span style="font-size:clamp(16px,1.6vw,19px);font-weight:700;color:var(--ink)">Do I own everything I build?</span><span class="faq-plus">+</span></summary>
        <p style="font-size:15.5px;color:var(--ink-70);margin:0;padding:0 4px 22px;line-height:1.6;max-width:680px">Yes. Your profile, website, content and brand are all yours, forever. Nothing is locked to us.</p>
      </details>
      <details class="faq" data-reveal="" style="border-bottom:1px solid rgba(0,0,0,.12)">
        <summary><span style="font-size:clamp(16px,1.6vw,19px);font-weight:700;color:var(--ink)">Can a complete beginner do this?</span><span class="faq-plus">+</span></summary>
        <p style="font-size:15.5px;color:var(--ink-70);margin:0;padding:0 4px 22px;line-height:1.6;max-width:680px">If you can use WhatsApp, you can do this. Every task is a step-by-step mission with the prompt already written.</p>
      </details>
      <details class="faq" data-reveal="" style="border-bottom:1px solid rgba(0,0,0,.12)">
        <summary><span style="font-size:clamp(16px,1.6vw,19px);font-weight:700;color:var(--ink)">Do I need ChatGPT Plus?</span><span class="faq-plus">+</span></summary>
        <p style="font-size:15.5px;color:var(--ink-70);margin:0;padding:0 4px 22px;line-height:1.6;max-width:680px">No. The free tier is enough for every mission inside the Builder.</p>
      </details>
      <details class="faq" data-reveal="" style="border-bottom:1px solid rgba(0,0,0,.12)">
        <summary><span style="font-size:clamp(16px,1.6vw,19px);font-weight:700;color:var(--ink)">How much work is it, really?</span><span class="faq-plus">+</span></summary>
        <p style="font-size:15.5px;color:var(--ink-70);margin:0;padding:0 4px 22px;line-height:1.6;max-width:680px">One mission a day. Follow the step-wise instructions and finish the modules under each missions.</p>
      </details>
      <details class="faq" data-reveal="" style="border-bottom:1px solid rgba(0,0,0,.12)">
        <summary><span style="font-size:clamp(16px,1.6vw,19px);font-weight:700;color:var(--ink)">Can I use my existing website?</span><span class="faq-plus">+</span></summary>
        <p style="font-size:15.5px;color:var(--ink-70);margin:0;padding:0 4px 22px;line-height:1.6;max-width:680px">Yes. But certain tasks require you to create multiple pages on your own. Ensure your website stack supports that. All the instructions and missions are tailored for CuraGo's website builders.</p>
      </details>
    </div>
  </div>
</section>

<!-- ============ FREE WEBSITE BUILDER (ENTRY POINT) ============ -->
<section id="free" style="background:var(--cream-2);padding:clamp(48px,7vw,90px) clamp(16px,4vw,40px);scroll-margin-top:72px">
  <div style="max-width:1000px;margin:0 auto;background:linear-gradient(135deg,var(--leaf-ink),var(--leaf));border-radius:24px;padding:clamp(30px,4vw,52px);display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:space-between;box-shadow:0 20px 50px rgba(9,177,23,.18)">
    <div data-reveal="" style="flex:1 1 420px;min-width:280px">
      <div style="font-family:var(--mono);font-size:11.5px;letter-spacing:.2em;color:rgba(255,255,255,.9);margin-bottom:12px">FREE ENTRY POINT</div>
      <h2 style="font-size:clamp(26px,3.4vw,40px);line-height:1.08;letter-spacing:-.02em;margin:0 0 10px;font-weight:800;color:#fff">Not ready to spend anything? <span style="font-family:var(--serif);font-style:italic;font-weight:400">Build a free practice website.</span></h2>
      <p style="font-size:16px;color:rgba(255,255,255,.92);margin:0;max-width:560px">Booking, photos, reviews and your qualifications — a real site patients can find. No card, no trial. It stays yours.</p>
    </div>
    <a href="/signup" style="background:#fff;color:var(--leaf-ink);font-weight:700;font-size:16px;padding:16px 28px;border-radius:13px;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,.18)">Build my free site →</a>
  </div>
</section>

<!-- ============ FINAL CTA ============ -->
<section style="background:radial-gradient(120% 100% at 50% 0%,#0E6B25,var(--forest-2) 60%,var(--forest-3));color:#fff;padding:clamp(64px,9vw,130px) clamp(16px,4vw,40px);text-align:center">
  <div style="max-width:760px;margin:0 auto">
    <h2 data-reveal="" style="font-size:clamp(36px,6vw,72px);line-height:1;letter-spacing:-.03em;margin:0 0 20px;font-weight:800">Be in the results by <span style="font-family:var(--serif);font-style:italic;font-weight:400;color:var(--leaf-2)">next month.</span></h2>
    <p data-reveal="" data-reveal-delay="80" style="font-size:clamp(17px,1.6vw,20px);color:rgba(255,255,255,.8);margin:0 auto 36px;max-width:560px">Join the founding cohort and build your practice one day at a time — or start today with the book.</p>
    <div data-reveal="" data-reveal-delay="140" style="display:flex;gap:10px;background:rgba(0,0,0,.25);border-radius:16px;padding:8px;max-width:520px;margin:0 auto;flex-wrap:wrap">
      <input type="email" placeholder="Your email" style="flex:1 1 200px;min-width:0;background:transparent;border:none;outline:none;color:#fff;font-size:16px;padding:14px 16px;font-family:var(--sans)">
      <button class="btn" style="background:var(--orange);color:#fff;font-weight:700;font-size:16px;padding:15px 28px;border-radius:12px;border:none;cursor:pointer;font-family:var(--sans)">Join the waitlist</button>
    </div>
  </div>
</section>

<footer style="background:var(--forest-3);color:rgba(255,255,255,.6);padding:40px clamp(16px,4vw,40px)">
  <div style="max-width:1120px;margin:0 auto;display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:12.5px">
    <div style="display:flex;align-items:center;gap:10px;color:#fff">
      <span style="display:grid;place-items:center;border-radius:8px;background:#fff;padding:4px"><img src="/landing/logo.png" alt="" style="width:128px;height:33px;object-fit:contain"></span>
      CuraGo · Made in India
    </div>
    <div style="display:flex;gap:20px;flex-wrap:wrap">
      <a href="#top" style="color:rgba(255,255,255,.6)">Privacy</a>
      <a href="#top" style="color:rgba(255,255,255,.6)">Refund policy</a>
      <a href="#top" style="color:rgba(255,255,255,.6)">Contact</a>
    </div>
    <div>© 2026 CuraGo · Payments via Razorpay</div>
  </div>
</footer>

</div>`;

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: BODY }} />
    </>
  );
}
