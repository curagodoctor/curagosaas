// Server component — India-appropriate privacy policy (DPDP Act 2023) for CuraGo.
// Design tokens match the login/landing pages: warm paper, green identity,
// Instrument Serif for the title, Instrument Sans body, DM Mono eyebrows.

import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy · CuraGo',
  description:
    'How CuraGo collects, uses, stores, and protects your personal data, in line with the Digital Personal Data Protection Act, 2023.',
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
`;

export default function PrivacyPage() {
  return (
    <div className="legalRoot">
      <style dangerouslySetInnerHTML={{ __html: LEGAL_CSS }} />

      <nav className="legalNav">
        <div className="legalWrap" style={{ padding: '14px 24px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo.svg" alt="CuraGo" style={{ height: '32px', width: 'auto' }} />
          </Link>
        </div>
      </nav>

      <main className="legalWrap" style={{ padding: '48px 24px 96px' }}>
        <p className="mono eyebrow" style={{ marginBottom: '14px' }}>Privacy Policy</p>
        <h1 className="serif">Your data, and how we handle it</h1>
        <p className="lede" style={{ marginTop: '8px' }}>
          This policy explains what personal data CuraGo collects, why we collect it, and the choices
          you have. It is written to align with India&apos;s Digital Personal Data Protection Act, 2023
          (the &quot;DPDP Act&quot;).
        </p>
        <p className="mono" style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '18px' }}>
          Last updated: 2026
        </p>

        <div className="card">
          <p style={{ margin: 0 }}>
            CuraGo (&quot;CuraGo&quot;, &quot;we&quot;, &quot;us&quot;) provides a website builder,
            appointment booking, and the Practice OS programme for doctors in India. This policy covers
            all of these products and our marketing website. By using CuraGo, you agree to the practices
            described here.
          </p>
        </div>

        <h2>1. Information we collect</h2>
        <p>We collect only what we need to run the service you asked for:</p>
        <ul>
          <li><strong>Account details</strong> — your name, email address, phone number, and password (stored in hashed form). If you sign in with Google, we receive your name, email, and profile photo from Google.</li>
          <li><strong>Practice information</strong> — clinic name, specialty, qualifications, registration number, services, photos, and any content you add to your CuraGo website. If you upload a CV for Practice OS, we extract qualification and specialty details from it; the raw file and the extracted fields are stored separately, and you can delete either.</li>
          <li><strong>Booking data</strong> — appointment details created through your CuraGo site. Where patients book with you, limited patient contact details may pass through our systems on your behalf.</li>
          <li><strong>Payment information</strong> — processed by our payment partner, Razorpay. We do not store your full card or bank details on our servers; we retain only a transaction reference and status.</li>
          <li><strong>Usage and device data</strong> — pages visited, actions taken, IP address, browser type, and similar technical logs used to keep the service secure and working.</li>
        </ul>

        <h2>2. How we use your information</h2>
        <p>We use your data to:</p>
        <ul>
          <li>Create and operate your account and clinic website.</li>
          <li>Process bookings and send related notifications (email or WhatsApp) that you or your patients expect.</li>
          <li>Take payment and issue receipts.</li>
          <li>Provide the Practice OS programme, including progress tracking and reminders you opt into.</li>
          <li>Provide support, fix problems, and improve the product.</li>
          <li>Send you service and account messages. We send marketing messages only where you have agreed to receive them, and you can opt out at any time.</li>
          <li>Meet legal, tax, and regulatory obligations.</li>
        </ul>
        <p>
          Under the DPDP Act, we process your data on the basis of the consent you give when you sign up,
          or for legitimate uses such as fulfilling a service you requested.
        </p>

        <h2>3. Data storage and security</h2>
        <p>
          Your data is stored on managed cloud infrastructure with access controls, encryption in transit
          (HTTPS), and encryption at rest where supported. Passwords are stored only as salted hashes.
          Access to production data is limited to personnel who need it to operate the service. No method
          of storage or transmission is perfectly secure, but we take reasonable technical and
          organisational measures to protect your information and we review them regularly.
        </p>

        <h2>4. Sharing and third parties</h2>
        <p>
          We do not sell your personal data. We share data only with service providers who help us run
          CuraGo, and only to the extent needed:
        </p>
        <ul>
          <li><strong>Razorpay</strong> — to process payments securely. Razorpay handles your card and bank details under its own privacy terms.</li>
          <li><strong>Google (OAuth)</strong> — if you choose &quot;Continue with Google&quot;, Google authenticates you and shares basic profile details with us.</li>
          <li><strong>Hosting and infrastructure providers</strong> — to store data and serve the application.</li>
          <li><strong>Communication providers</strong> — to send transactional email and WhatsApp/SMS notifications on your behalf.</li>
        </ul>
        <p>
          We may also disclose information if required by law, to protect our rights or users, or as part
          of a merger or acquisition (in which case we will notify you).
        </p>

        <h2>5. Your rights</h2>
        <p>Under the DPDP Act, you have the right to:</p>
        <ul>
          <li><strong>Access</strong> a summary of the personal data we hold about you and how we process it.</li>
          <li><strong>Correct or update</strong> data that is inaccurate or incomplete.</li>
          <li><strong>Erase</strong> your data where it is no longer needed and there is no legal reason to keep it.</li>
          <li><strong>Withdraw consent</strong> at any time, with the same ease as giving it (this does not affect processing already carried out).</li>
          <li><strong>Grievance redressal</strong> — raise a complaint with our Grievance Officer (see below), and escalate to the Data Protection Board of India if unresolved.</li>
        </ul>
        <p>To exercise any of these rights, email us at <a href="mailto:support@curago.in">support@curago.in</a>.</p>

        <h2>6. Data retention</h2>
        <p>
          We keep your personal data for as long as your account is active and for a reasonable period
          afterwards to meet legal, tax, and accounting requirements. When data is no longer needed and we
          are not required to retain it, we delete or anonymise it. You may ask us to delete your account
          and associated data at any time.
        </p>

        <h2>7. Cookies</h2>
        <p>
          We use cookies and similar technologies to keep you signed in, remember your preferences, and
          understand how the service is used so we can improve it. You can control cookies through your
          browser settings; disabling some cookies may affect how the site works.
        </p>

        <h2>8. Children</h2>
        <p>
          CuraGo is intended for medical professionals and is not directed at children. We do not knowingly
          collect personal data from anyone under 18. If you believe a child has provided us data, contact
          us and we will delete it.
        </p>

        <h2>9. Changes to this policy</h2>
        <p>
          We may update this policy from time to time. When we make material changes, we will update the
          date above and, where appropriate, notify you. Continued use of CuraGo after an update means you
          accept the revised policy.
        </p>

        <h2>10. Contact and Grievance Officer</h2>
        <div className="card">
          <p style={{ margin: '0 0 6px' }}>
            For any privacy question, request, or complaint, contact our Grievance Officer:
          </p>
          <p className="mono" style={{ margin: '4px 0', fontSize: '14px' }}>
            Email: <a href="mailto:support@curago.in">support@curago.in</a>
          </p>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '14.5px' }}>
            We aim to acknowledge requests within a reasonable time and to resolve them in line with the
            DPDP Act.
          </p>
        </div>

        <p style={{ marginTop: '40px' }}>
          <Link href="/">&larr; Back to CuraGo</Link>
        </p>
      </main>
    </div>
  );
}
