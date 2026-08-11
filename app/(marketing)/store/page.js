// Dedicated store page for CuraGo's books & courses (ebook, masterclass, bundle).
// Server component. Shares the (marketing) layout, which mounts <RazorpayButtons/>,
// <MobileMenu/> and <RevealOnScroll/> after this. The Razorpay Payment Buttons are
// rendered into the `.rzp-btn[data-rzp]` placeholders below by that enhancer — the
// data-rzp ids are the SAME payment-button ids the homepage #books section uses:
//   ebook       pl_TK72xlstYNo245  (₹499)
//   masterclass pl_TK74q5urOSdJ3R  (₹999)
//   bundle      pl_TLOMeh4Zk7NbtR  (₹1,199)

export const metadata = {
  title: 'Books & Courses · CuraGo',
  description:
    "CuraGo's books and courses for doctors building a digital practice — the Zero to Practice ebook (₹499), the Zero to Practice Masterclass (₹999), and the two together (₹1,199).",
  alternates: { canonical: 'https://curago.in/store' },
  openGraph: {
    title: 'Books & Courses · CuraGo',
    description:
      'The Zero to Practice ebook, the Masterclass, and the two together — the same thinking behind Practice Builder, to read or watch today.',
    url: 'https://curago.in/store',
    siteName: 'CuraGo',
    locale: 'en_IN',
    type: 'website',
  },
};

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800&family=Newsreader:ital,opsz,wght@1,18..72,300;1,18..72,400;1,18..72,500&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.storeRoot{
  --forest:#0A4D18; --forest-2:#083b13; --forest-3:#05300f; --forest-mid:#0E6B25;
  --cream:#ffffff; --cream-2:#f8faf8; --card:#ffffff; --border:#e5e7eb;
  --orange:#FF7A1A; --orange-2:#E86A0A;
  --leaf:#53CD81; --leaf-2:#8FE6AE; --leaf-ink:#09B117; --primary:#09B117;
  --ink:#111827; --ink-70:#4B5563; --ink-50:#6B7280;
  --sans:'Schibsted Grotesk',system-ui,-apple-system,sans-serif;
  --serif:'Newsreader',Georgia,'Times New Roman',serif;
  --mono:'IBM Plex Mono',ui-monospace,'SF Mono',Menlo,monospace;
  background:var(--cream-2);color:var(--ink);font-family:var(--sans);line-height:1.5;-webkit-font-smoothing:antialiased;min-height:100vh
}
.storeRoot *{box-sizing:border-box}
.storeRoot a{color:var(--leaf-ink);text-decoration:none}
.storeRoot a:hover{color:var(--orange-2)}
.storeRoot img{max-width:100%;display:block}

.storeRoot .dc-navlinks{display:flex;align-items:center;gap:clamp(12px,1.8vw,24px)}
@media (max-width:860px){.storeRoot .dc-navlinks{display:none}}
.storeRoot .dc-hamburger{display:none;flex-direction:column;justify-content:center;gap:5px;width:44px;height:44px;padding:11px;background:transparent;border:1px solid rgba(0,0,0,.12);border-radius:10px;cursor:pointer}
.storeRoot .dc-hamburger span{display:block;height:2px;width:100%;background:#096B17;border-radius:2px;transition:transform .3s,opacity .3s}
.storeRoot .dc-hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.storeRoot .dc-hamburger.open span:nth-child(2){opacity:0}
.storeRoot .dc-hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
@media (max-width:860px){.storeRoot .dc-hamburger{display:flex}}
.storeRoot .dc-mobile-menu{display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border-bottom:1px solid rgba(0,0,0,.08);box-shadow:0 14px 32px rgba(0,0,0,.12);padding:8px clamp(16px,4vw,40px) 18px;flex-direction:column;gap:2px}
.storeRoot .dc-mobile-menu.open{display:flex}
.storeRoot .dc-mobile-menu a{padding:13px 6px;color:#096B17;font-size:16px;font-weight:600;border-bottom:1px solid rgba(0,0,0,.06)}
.storeRoot .dc-mobile-menu a.dc-mm-cta{margin-top:12px;border-bottom:none;background:var(--orange);color:#fff;font-weight:700;text-align:center;padding:14px 20px;border-radius:11px;box-shadow:0 6px 18px rgba(255,122,26,.35)}
@media (min-width:861px){.storeRoot .dc-mobile-menu{display:none!important}}

.storeRoot .rzp-btn{min-height:44px}
@media (prefers-reduced-motion:reduce){.storeRoot *{animation:none!important;transition:none!important}}`;

const BODY = `<div class="storeRoot">

<!-- ============ NAV ============ -->
<header style="position:sticky;top:0;z-index:60;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(0,0,0,.06);background-color:#FFFFFF">
  <nav style="max-width:1220px;margin:0 auto;padding:9px clamp(16px,4vw,40px);display:flex;align-items:center;justify-content:space-between;gap:16px">
    <a href="/" style="display:flex;align-items:center;gap:10px">
      <span style="display:grid;place-items:center;border-radius:10px;padding:4px"><img src="/curago-logo.png" alt="CuraGo" style="height:40px;width:auto;object-fit:contain"></span>
    </a>
    <div class="dc-navlinks">
      <a href="/" style="color:#096B17;font-size:14.5px;font-weight:500">Home</a>
      <a href="/#builder" style="color:#096B17;font-size:14.5px;font-weight:500">Practice Builder</a>
      <a href="/store" style="color:#096B17;font-size:14.5px;font-weight:600">Books &amp; courses</a>
      <a href="/#free" style="color:#096B17;font-size:14.5px;font-weight:500">Free website builder</a>
      <a href="/login" style="color:#096B17;font-size:14.5px;font-weight:600;padding:11px 14px">Login</a>
      <a href="/signup" style="background:var(--orange);color:#fff;font-weight:700;font-size:14.5px;padding:11px 20px;border-radius:11px;box-shadow:0 6px 18px rgba(255,122,26,.35)">Sign up</a>
    </div>
    <button class="dc-hamburger" data-mobile-toggle="" aria-label="Menu" aria-expanded="false" aria-controls="dc-mobile-menu-store">
      <span></span><span></span><span></span>
    </button>
  </nav>
  <div class="dc-mobile-menu" id="dc-mobile-menu-store" data-mobile-menu="">
    <a href="/">Home</a>
    <a href="/#builder">Practice Builder</a>
    <a href="/store">Books &amp; courses</a>
    <a href="/#free">Free website builder</a>
    <a href="/login">Login</a>
    <a href="/signup" class="dc-mm-cta">Sign up</a>
  </div>
</header>

<!-- ============ HEADER ============ -->
<section style="background:radial-gradient(120% 90% at 80% -10%,#0E6B25 0%,var(--forest) 45%,var(--forest-2) 100%);color:#fff">
  <div style="max-width:1080px;margin:0 auto;padding:clamp(44px,6vw,80px) clamp(16px,4vw,40px)">
    <div style="font-family:var(--mono);font-size:12px;letter-spacing:.2em;color:var(--leaf-2);margin-bottom:16px">BOOKS &amp; COURSES</div>
    <h1 style="font-weight:800;font-size:clamp(32px,5vw,58px);line-height:1.02;letter-spacing:-.03em;margin:0 0 16px;max-width:15ch">Read it, or watch it worked through.</h1>
    <p style="font-size:clamp(16px,1.4vw,19px);line-height:1.6;color:rgba(255,255,255,.82);max-width:560px;margin:0">The same thinking behind Practice Builder, in a form you can start today — the Zero to Practice ebook, the recorded Masterclass, or the two together.</p>
  </div>
</section>

<!-- ============ PRODUCTS ============ -->
<section id="products" style="background:var(--cream-2);padding:clamp(44px,6vw,88px) clamp(16px,4vw,40px)">
  <div style="max-width:1080px;margin:0 auto">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px">

      <!-- EBOOK -->
      <div style="background:var(--card);border:1px solid rgba(0,0,0,.08);border-radius:20px;padding:clamp(24px,3vw,34px);display:flex;flex-direction:column">
        <div style="font-family:var(--mono);font-size:11.5px;letter-spacing:.14em;color:var(--ink-50);margin-bottom:14px">THE BOOK</div>
        <h2 style="font-size:24px;font-weight:800;margin:0 0 10px;letter-spacing:-.01em">Zero to Practice E-Book</h2>
        <p style="font-size:14.5px;color:var(--ink-70);margin:0 0 20px;line-height:1.55">A guide to digital-first clinical practice building. All aspects covered over 12 chapters and 70+ pages.</p>
        <div style="font-family:var(--mono);font-size:11px;letter-spacing:.12em;color:var(--ink-50);margin-bottom:12px">WHAT'S INCLUDED</div>
        <ul style="list-style:none;padding:0;margin:0 0 22px;display:flex;flex-direction:column;gap:10px">
          <li style="display:flex;gap:10px;align-items:flex-start;font-size:14.5px;color:var(--ink);line-height:1.5"><span style="flex:none;color:var(--leaf-ink);font-weight:800;margin-top:1px">✓</span>12 chapters, 70+ pages</li>
          <li style="display:flex;gap:10px;align-items:flex-start;font-size:14.5px;color:var(--ink);line-height:1.5"><span style="flex:none;color:var(--leaf-ink);font-weight:800;margin-top:1px">✓</span>Read on any device (PDF)</li>
          <li style="display:flex;gap:10px;align-items:flex-start;font-size:14.5px;color:var(--ink);line-height:1.5"><span style="flex:none;color:var(--leaf-ink);font-weight:800;margin-top:1px">✓</span>One-time purchase, instant access</li>
        </ul>
        <div style="margin-top:auto">
          <div style="font-size:34px;font-weight:800;letter-spacing:-.02em;margin-bottom:18px">₹499 <span style="font-size:13px;font-family:var(--mono);color:var(--ink-50);font-weight:400">one-time · instant</span></div>
          <div class="rzp-btn" data-rzp="pl_TK72xlstYNo245"></div>
        </div>
      </div>

      <!-- MASTERCLASS -->
      <div style="background:var(--card);border:1px solid rgba(0,0,0,.08);border-radius:20px;padding:clamp(24px,3vw,34px);display:flex;flex-direction:column">
        <div style="font-family:var(--mono);font-size:11.5px;letter-spacing:.14em;color:var(--ink-50);margin-bottom:14px">THE MASTERCLASS</div>
        <h2 style="font-size:24px;font-weight:800;margin:0 0 10px;letter-spacing:-.01em">Zero to Practice Masterclass</h2>
        <p style="font-size:14.5px;color:var(--ink-70);margin:0 0 20px;line-height:1.55">A 2-hour recorded session covering the same concepts as the book, in more depth and more nuance.</p>
        <div style="font-family:var(--mono);font-size:11px;letter-spacing:.12em;color:var(--ink-50);margin-bottom:12px">WHAT'S INCLUDED</div>
        <ul style="list-style:none;padding:0;margin:0 0 22px;display:flex;flex-direction:column;gap:10px">
          <li style="display:flex;gap:10px;align-items:flex-start;font-size:14.5px;color:var(--ink);line-height:1.5"><span style="flex:none;color:var(--leaf-ink);font-weight:800;margin-top:1px">✓</span>2-hour recorded session</li>
          <li style="display:flex;gap:10px;align-items:flex-start;font-size:14.5px;color:var(--ink);line-height:1.5"><span style="flex:none;color:var(--leaf-ink);font-weight:800;margin-top:1px">✓</span>Concepts worked through in depth</li>
          <li style="display:flex;gap:10px;align-items:flex-start;font-size:14.5px;color:var(--ink);line-height:1.5"><span style="flex:none;color:var(--leaf-ink);font-weight:800;margin-top:1px">✓</span>Lifetime access, watch any time</li>
        </ul>
        <div style="margin-top:auto">
          <div style="font-size:34px;font-weight:800;letter-spacing:-.02em;margin-bottom:18px">₹999 <span style="font-size:13px;font-family:var(--mono);color:var(--ink-50);font-weight:400">lifetime access</span></div>
          <div class="rzp-btn" data-rzp="pl_TK74q5urOSdJ3R"></div>
        </div>
      </div>

    </div>

    <!-- BUNDLE (featured) -->
    <div style="margin-top:20px;background:var(--card);border:2px solid var(--leaf-ink);border-radius:20px;padding:clamp(24px,3vw,36px)">
      <div style="display:flex;flex-wrap:wrap;gap:28px;align-items:center;justify-content:space-between">
        <div style="flex:1 1 380px;min-width:280px">
          <div style="font-family:var(--mono);font-size:11.5px;letter-spacing:.14em;color:var(--leaf-ink);margin-bottom:10px">BOOK + MASTERCLASS TOGETHER</div>
          <h2 style="font-size:26px;font-weight:800;margin:0 0 8px;letter-spacing:-.01em">Get both together</h2>
          <p style="font-size:15px;color:var(--ink-70);margin:0 0 18px;line-height:1.55">Read the book, then watch the same ground worked through end to end.</p>
          <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px">
            <li style="display:flex;gap:10px;align-items:flex-start;font-size:14.5px;color:var(--ink);line-height:1.5"><span style="flex:none;color:var(--leaf-ink);font-weight:800;margin-top:1px">✓</span>The full Zero to Practice E-Book</li>
            <li style="display:flex;gap:10px;align-items:flex-start;font-size:14.5px;color:var(--ink);line-height:1.5"><span style="flex:none;color:var(--leaf-ink);font-weight:800;margin-top:1px">✓</span>The 2-hour recorded Masterclass</li>
            <li style="display:flex;gap:10px;align-items:flex-start;font-size:14.5px;color:var(--ink);line-height:1.5"><span style="flex:none;color:var(--leaf-ink);font-weight:800;margin-top:1px">✓</span>Both at a combined price</li>
          </ul>
        </div>
        <div style="flex:0 0 auto;display:flex;flex-direction:column;align-items:flex-start;gap:16px">
          <div style="font-size:38px;font-weight:800;letter-spacing:-.02em">₹1,199 <s style="font-size:16px;color:var(--ink-50);font-weight:400">₹1,498</s></div>
          <div class="rzp-btn" data-rzp="pl_TLOMeh4Zk7NbtR"></div>
        </div>
      </div>
    </div>

    <p style="font-family:var(--mono);font-size:12px;color:var(--ink-50);margin-top:26px;text-align:center">Payments via Razorpay · instant access after purchase</p>
  </div>
</section>

<!-- ============ PRACTICE BUILDER POINTER ============ -->
<section style="background:var(--cream-2);padding:0 clamp(16px,4vw,40px) clamp(48px,7vw,90px)">
  <div style="max-width:1080px;margin:0 auto;background:linear-gradient(135deg,var(--forest),var(--forest-3));border-radius:24px;padding:clamp(30px,4vw,52px);display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:space-between;color:#fff">
    <div style="flex:1 1 420px;min-width:280px">
      <div style="font-family:var(--mono);font-size:11.5px;letter-spacing:.2em;color:var(--leaf-2);margin-bottom:12px">WHEN YOU'RE READY TO BUILD</div>
      <h2 style="font-size:clamp(24px,3.2vw,38px);line-height:1.1;letter-spacing:-.02em;margin:0 0 10px;font-weight:800">Zero to Practice Builder</h2>
      <p style="font-size:16px;color:rgba(255,255,255,.85);margin:0;max-width:560px">A 28-day, one-mission-a-day programme that turns the reading into a real, discoverable practice.</p>
    </div>
    <a href="/#builder" style="background:var(--orange);color:#fff;font-weight:700;font-size:16px;padding:16px 28px;border-radius:13px;white-space:nowrap;box-shadow:0 10px 30px rgba(232,114,46,.4)">See Practice Builder →</a>
  </div>
</section>

<footer style="background:var(--forest-3);color:rgba(255,255,255,.6);padding:40px clamp(16px,4vw,40px)">
  <div style="max-width:1120px;margin:0 auto;display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:12.5px">
    <div style="display:flex;align-items:center;gap:10px;color:#fff">
      <span style="display:grid;place-items:center;border-radius:8px;background:#fff;padding:4px"><img src="/curago-logo.png" alt="CuraGo" style="height:30px;width:auto;object-fit:contain"></span>
      CuraGo · Made in India
    </div>
    <div style="display:flex;gap:20px;flex-wrap:wrap">
      <a href="/" style="color:rgba(255,255,255,.6)">Home</a>
      <a href="/privacy" style="color:rgba(255,255,255,.6)">Privacy</a>
      <a href="/refund" style="color:rgba(255,255,255,.6)">Refund policy</a>
      <a href="mailto:support@curago.in" style="color:rgba(255,255,255,.6)">Contact</a>
    </div>
    <div>© 2026 CuraGo · Payments via Razorpay</div>
  </div>
</footer>

</div>`;

export default function StorePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: BODY }} />
    </>
  );
}
