// Server component — Terms of Service for CuraGo. Signup links here, so this
// page must exist. Same warm-paper / green design language as the other legal pages.

import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service · CuraGo',
  description:
    'The terms that govern your use of CuraGo — the website builder, booking, and the Zero To Practice Builder programme.',
};

const LEGAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
.legalRoot{--paper:#F7F9F5;--card:#fff;--ink:#101A13;--green:#096B17;--muted:#5E6B5F;--rule:#DDE4D9;--rule-soft:#EDF1EB;background:var(--paper);color:var(--ink);font-family:"Instrument Sans",system-ui,sans-serif;min-height:100vh}
.legalRoot .serif{font-family:"Instrument Serif",Georgia,serif;font-weight:400;letter-spacing:-.02em}
.legalRoot .mono{font-family:"DM Mono",ui-monospace,monospace}
.legalRoot a{color:var(--green)}
.legalNav{position:sticky;top:0;z-index:10;border-bottom:1px solid var(--rule);background:var(--paper)}
.legalWrap{max-width:760px;margin:0 auto;padding:0 24px}
.legalRoot h1{font-size:clamp(30px,5vw,44px);line-height:1.08;margin:0 0 12px}
.legalRoot h2{font-size:21px;font-weight:600;margin:40px 0 10px;letter-spacing:-.01em}
.legalRoot p,.legalRoot li{font-size:16.5px;line-height:1.65;color:#2a352c}
.legalRoot ul{margin:10px 0 10px 0;padding-left:20px}
.legalRoot li{margin:6px 0}
.legalRoot .eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.11em;color:var(--muted)}
.legalRoot .lede{font-size:18px;color:var(--muted);line-height:1.55}
`;

export default function TermsPage() {
  return (
    <div className="legalRoot">
      <style dangerouslySetInnerHTML={{ __html: LEGAL_CSS }} />

      <nav className="legalNav">
        <div className="legalWrap" style={{ padding: '14px 24px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/curago-logo.png" alt="CuraGo" style={{ height: '32px', width: 'auto' }} />
          </Link>
        </div>
      </nav>

      <main className="legalWrap" style={{ padding: '48px 24px 96px' }}>
        <p className="mono eyebrow" style={{ marginBottom: '14px' }}>Terms of Service</p>
        <h1 className="serif">Terms of Service</h1>
        <p className="lede" style={{ marginTop: '8px' }}>
          These terms govern your use of CuraGo. By creating an account or using our products, you agree
          to them.
        </p>
        <p className="mono" style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '18px' }}>
          Last updated: 2026
        </p>

        <h2>1. Who we are</h2>
        <p>
          CuraGo provides a website builder, appointment booking, and the Zero To Practice Builder programme for doctors
          in India. One CuraGo account gives you access across these products.
        </p>

        <h2>2. Your account</h2>
        <p>
          You must provide accurate information and keep your login credentials secure. You are responsible
          for activity under your account. CuraGo is intended for medical professionals; you confirm you are
          at least 18 and authorised to represent the practice you set up.
        </p>

        <h2>3. Acceptable use</h2>
        <ul>
          <li>Use CuraGo lawfully and only for your own practice.</li>
          <li>Do not upload content that is unlawful, misleading, or infringes others&apos; rights.</li>
          <li>Do not attempt to disrupt, reverse-engineer, or gain unauthorised access to the service.</li>
          <li>Content you publish must comply with applicable medical advertising and conduct rules, including NMC guidelines. You are responsible for what you publish.</li>
        </ul>

        <h2>4. Your content</h2>
        <p>
          You keep ownership of the content you add — your clinic details, text, and images. You grant us the
          limited licence needed to host and display it as part of running the service. You are responsible
          for having the rights to any content you upload.
        </p>

        <h2>5. Payments</h2>
        <p>
          Paid products are billed through our payment partner, Razorpay. Prices and what each plan includes
          are shown at the point of purchase. Refunds are handled under our{' '}
          <Link href="/refund">Refund &amp; Cancellation Policy</Link>.
        </p>

        <h2>6. Service availability</h2>
        <p>
          We work to keep CuraGo available and reliable, but the service is provided &quot;as is&quot;. We may
          update, change, or discontinue features. We are not liable for indirect or consequential losses,
          and our total liability is limited to the amount you paid us in the preceding 12 months, to the
          extent permitted by law.
        </p>

        <h2>7. Privacy</h2>
        <p>
          Our handling of your personal data is described in our <Link href="/privacy">Privacy Policy</Link>, which
          forms part of these terms.
        </p>

        <h2>8. Termination</h2>
        <p>
          You may stop using CuraGo and close your account at any time. We may suspend or end access if these
          terms are breached. Assets you have built remain available to you as described in the relevant
          product terms.
        </p>

        <h2>9. Changes and governing law</h2>
        <p>
          We may update these terms from time to time; the date above reflects the latest version. These
          terms are governed by the laws of India, and disputes are subject to the jurisdiction of Indian
          courts.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions about these terms? Email <a href="mailto:support@curago.in">support@curago.in</a>.
        </p>

        <p style={{ marginTop: '40px' }}>
          <Link href="/">&larr; Back to CuraGo</Link>
        </p>
      </main>
    </div>
  );
}
