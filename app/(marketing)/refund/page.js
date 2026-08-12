// Server component — refund & cancellation policy for the CuraGo product family.
// Shares the same warm-paper / green design language as the login and privacy pages.

import Link from 'next/link';

export const metadata = {
  title: 'Refund & Cancellation Policy · CuraGo',
  description:
    'How refunds and cancellations work across CuraGo products — the Zero to Practice ebook and masterclass, Zero To Practice Builder, and the CuraGo website builder.',
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
.legalRoot .card{background:var(--card);border:1px solid var(--rule);border-radius:12px;padding:22px 24px;margin:18px 0}
.legalRoot .note{font-size:14px;color:var(--muted)}
`;

export default function RefundPage() {
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
        <p className="mono eyebrow" style={{ marginBottom: '14px' }}>Refund &amp; Cancellation Policy</p>
        <h1 className="serif">Refunds and cancellations</h1>
        <p className="lede" style={{ marginTop: '8px' }}>
          CuraGo sells digital products and services. This policy explains when a refund is possible,
          how it is processed, and how to request one.
        </p>
        <p className="mono" style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '18px' }}>
          Last updated: 2026
        </p>

        <h2>1. What we sell</h2>
        <p>This policy applies to the CuraGo product family:</p>
        <ul>
          <li><strong>Zero to Practice</strong> — the ebook, the masterclass, and the bundle. Digital downloads and streamed video.</li>
          <li><strong>Zero To Practice Builder</strong> — a guided programme and builder packs delivered inside the CuraGo platform.</li>
          <li><strong>CuraGo website builder (SaaS)</strong> — the free tier and any paid plans.</li>
        </ul>
        <p>
          Because these are digital goods and services, access is granted immediately or very soon after
          purchase. That affects when a refund is possible, as set out below.
        </p>

        <h2>2. The refund window</h2>
        <div className="card">
          <p style={{ margin: 0 }}>
            For a paid digital purchase (ebook, masterclass, bundle, or a Zero To Practice Builder pack), you may request
            a refund within <strong>7 days of purchase</strong>, provided you have not substantially accessed
            or downloaded the content — for example, you have not downloaded the ebook or watched a
            meaningful part of the masterclass, and you have not progressed past the early setup of Zero To Practice Builder.
          </p>
          <p className="note" style={{ margin: '12px 0 0' }}>
            Note: the 7-day window and the &quot;unaccessed&quot; condition are the current default and are the
            founder&apos;s to confirm before launch.
          </p>
        </div>

        <h2>3. How refunds are processed</h2>
        <p>
          Approved refunds are processed through our payment partner, <strong>Razorpay</strong>, back to the
          original payment method used for the purchase. Once approved, refunds are typically initiated within
          5–7 business days; the time for the amount to appear in your account depends on your bank or card
          issuer and is outside our control.
        </p>

        <h2>4. What is not refundable</h2>
        <ul>
          <li>Digital content that has already been downloaded, or video that has been substantially watched.</li>
          <li>A Zero To Practice Builder programme that you have progressed meaningfully into (beyond initial setup).</li>
          <li>Requests made after the 7-day window has closed.</li>
          <li>Free-tier usage of the CuraGo website builder (nothing was charged).</li>
          <li>Charges arising from your own error where the product was delivered as described — though we will always try to help.</li>
        </ul>
        <p>
          For any paid subscription plan, you can cancel to stop future billing; cancellation stops the next
          renewal and does not retroactively refund the current period unless required by law.
        </p>

        <h2>5. Duplicate or failed payments</h2>
        <p>
          If you were charged twice for the same order, or money was deducted but access was not granted,
          contact us with your transaction reference. We will verify with Razorpay and refund any duplicate
          or failed-but-charged transaction in full.
        </p>

        <h2>6. How to request a refund</h2>
        <div className="card">
          <p style={{ margin: '0 0 6px' }}>
            Email <a href="mailto:support@curago.in">support@curago.in</a> with:
          </p>
          <ul style={{ margin: '6px 0 0' }}>
            <li>the email address on your CuraGo account,</li>
            <li>the product you bought and the date of purchase,</li>
            <li>your Razorpay payment or order reference, and</li>
            <li>a short note on why you are requesting a refund.</li>
          </ul>
          <p className="note" style={{ margin: '12px 0 0' }}>
            We aim to acknowledge refund requests within a reasonable time and to resolve them fairly.
          </p>
        </div>

        <h2>7. Changes to this policy</h2>
        <p>
          We may update this policy from time to time. The date above reflects the latest version. Changes
          apply to purchases made after the update.
        </p>

        <p style={{ marginTop: '40px' }}>
          <Link href="/">&larr; Back to CuraGo</Link>
        </p>
      </main>
    </div>
  );
}
