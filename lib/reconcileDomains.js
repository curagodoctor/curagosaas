// Keep Doctor.customDomainVerified in sync with reality, automatically.
//
// The flag used to get stuck `false` when a doctor set their DNS but never
// re-clicked "Verify" — which silently kept their canonical / OG / schema URLs
// pointed at the curago.in subdomain instead of their live custom domain (bad for
// SEO + Google Business Profile). This reconcile flips the flag the moment the
// domain is genuinely serving our site, using the SAME signal as the doctor-facing
// verify route.
import Doctor from '@/models/Doctor';
import { verifyDomain, getDomainConfig, dnsPointsToVercel } from '@/lib/vercelDomains';
import { domainServesOurSite } from '@/lib/domainLive';

// Mirrors app/api/doctor/domain/verify/route.js: connected (Vercel flag / config /
// real DNS, no conflicting record) AND actually serving our site over HTTPS now.
export async function isDomainServingLive(domain) {
  if (!domain) return false;
  const [verifyResult, config, dnsCheck] = await Promise.all([
    verifyDomain(domain).catch(() => ({})),
    getDomainConfig(domain).catch(() => ({})),
    dnsPointsToVercel(domain).catch(() => ({})),
  ]);
  const hasConflict = (dnsCheck.conflictingRecords || []).length > 0;
  const connected = !hasConflict && !!(verifyResult.verified || config.verified || config.configured || dnsCheck.pointsToVercel);
  if (!connected) return false;
  return !!(await domainServesOurSite(domain).catch(() => false));
}

/**
 * Upgrade-only reconcile for ONE doctor: flip customDomainVerified → true when the
 * domain is genuinely live. Deliberately never downgrades — a transient check must
 * not knock a working domain's canonical back to the subdomain. Returns true if flipped.
 */
export async function reconcileDoctorDomain(doctor) {
  if (!doctor?.customDomain || doctor.customDomainVerified) return false;
  if (!(await isDomainServingLive(doctor.customDomain))) return false;
  await Doctor.updateOne({ _id: doctor._id }, { $set: { customDomainVerified: true, customDomainVerifiedAt: new Date() } });
  return true;
}

/** Sweep every doctor whose custom domain isn't verified yet. Returns {checked, flipped, details}. */
export async function reconcileAllDomains() {
  const pending = await Doctor.find({ customDomain: { $nin: [null, ''] }, customDomainVerified: { $ne: true } })
    .select('customDomain customDomainVerified displayName name').lean();
  let flipped = 0;
  const details = [];
  for (const d of pending) {
    const did = await reconcileDoctorDomain(d).catch(() => false);
    if (did) flipped++;
    details.push({ doctor: d.displayName || d.name, domain: d.customDomain, flipped: did });
  }
  return { checked: pending.length, flipped, details };
}
