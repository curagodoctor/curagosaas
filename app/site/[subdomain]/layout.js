import Script from 'next/script';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';

// Site-wide metadata for the tenant. Sets the doctor's own favicon AND overrides
// the platform-level twitter/keywords/OG defaults (from the root app/layout.js)
// so a doctor's page never shows "CuraGo — Digital Practice Platform" or the
// platform keywords/og-preview when shared. Page-level generateMetadata
// (title/description/canonical/OG) still applies and wins per-field on top.
export async function generateMetadata({ params }) {
  const { subdomain } = await params;
  try {
    await connectDB();
    const doctor = await Doctor.findOne({ subdomain: (subdomain || '').toLowerCase(), isActive: true })
      .select('favicon displayName name specialization qualification profileImage')
      .lean();
    if (!doctor) return {};

    const name = doctor.displayName || doctor.name || 'Doctor';
    const spec = doctor.specialization || '';
    const titleBase = spec ? `${name} — ${spec}` : name;
    const desc = `Book an appointment with ${name}${spec ? `, ${spec}` : ''}.`;
    const img = doctor.profileImage || '';

    const md = {
      // Replace the platform's boilerplate keywords with per-doctor terms.
      keywords: [name, spec, doctor.qualification, 'doctor', 'appointment', 'clinic'].filter(Boolean),
      // Per-doctor social cards (pages that set their own openGraph override this).
      openGraph: { title: titleBase, description: desc, ...(img ? { images: [img] } : {}) },
      twitter: { card: img ? 'summary_large_image' : 'summary', title: titleBase, description: desc, ...(img ? { images: [img] } : {}) },
    };

    const favicon = doctor.favicon?.trim();
    if (favicon) md.icons = { icon: favicon, shortcut: favicon, apple: favicon };
    return md;
  } catch {
    // Never let a metadata lookup break the site.
    return {};
  }
}

// Injects each doctor's OWN analytics into their published site. IDs are read
// from the doctor's settings (Website Builder → Analytics & Tracking) and
// validated before injection so a bad value can never break the page.
export default async function SiteLayout({ children, params }) {
  const { subdomain } = await params;

  let ga4 = '';
  let pixel = '';
  try {
    await connectDB();
    const doctor = await Doctor.findOne({ subdomain: (subdomain || '').toLowerCase(), isActive: true })
      .select('analytics')
      .lean();
    const raw4 = doctor?.analytics?.ga4MeasurementId?.trim() || '';
    const rawP = doctor?.analytics?.metaPixelId?.trim() || '';
    if (/^G-[A-Z0-9]{4,}$/i.test(raw4)) ga4 = raw4;
    if (/^\d{6,20}$/.test(rawP)) pixel = rawP;
  } catch {
    // Never let analytics lookup break the site.
  }

  return (
    <div className="min-h-screen">
      {ga4 && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ga4}');`}
          </Script>
        </>
      )}

      {pixel && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixel}');
fbq('track', 'PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img height="1" width="1" style={{ display: 'none' }} alt="" src={`https://www.facebook.com/tr?id=${pixel}&ev=PageView&noscript=1`} />
          </noscript>
        </>
      )}

      {children}
    </div>
  );
}
