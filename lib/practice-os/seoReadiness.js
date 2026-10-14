/**
 * Per-doctor SEO readiness — the single source for the admin + doctor "needs data"
 * prompts AND the Phase D internal measurement report. No external APIs: it reads
 * the doctor's own verified data and reports what's present vs what the doctor/admin
 * still needs to supply (never fabricating anything).
 */
import Doctor from '@/models/Doctor';
import BookingPage from '@/models/BookingPage';
import BlogArticle from '@/models/BlogArticle';
import Clinic from '@/models/Clinic';
import PracticeOsDiseaseCluster from '@/models/practice-os/PracticeOsDiseaseCluster';
import { primaryBaseUrl } from '@/lib/primaryDomain';

const hasText = (v) => !!String(v || '').trim();

export async function getSeoReadiness(doctorId) {
  const doctor = await Doctor.findById(doctorId)
    .select('displayName name specialization city customDomain customDomainVerified subdomain').lean();
  if (!doctor) return null;

  const [homepage, clinics, approvedClusters, pubPages, pubBlogs] = await Promise.all([
    BookingPage.findOne({ doctorId, status: 'published' }).sort({ createdAt: 1 }).select('title metaDescription sections').lean(),
    Clinic.find({ doctorId, isActive: true }).select('name address phone timings mapUrl').lean(),
    PracticeOsDiseaseCluster.find({ doctorId, approved: true }).select('treatments').lean(),
    BookingPage.countDocuments({ doctorId, status: 'published' }),
    BlogArticle.countDocuments({ doctorId, status: 'published' }),
  ]);

  // Real (non-placeholder) hero images on the homepage.
  const heroImgs = (homepage?.sections || [])
    .filter((s) => s.type === 'hero_carousel')
    .flatMap((s) => (s.config?.images || []))
    .map((im) => (typeof im === 'string' ? im : im?.url) || '')
    .filter((u) => u && !u.includes('/placeholders/'));

  const primaryClinic = clinics[0] || null;
  const hasAddress = !!primaryClinic && (hasText(primaryClinic.address?.street) || hasText(primaryClinic.address?.city));
  const treatmentCount = approvedClusters.reduce((n, c) => n + (c.treatments?.length || 0), 0);

  const base = primaryBaseUrl(doctor);
  // Indexable public URLs we expose in the sitemap.
  const indexableUrls = pubPages + pubBlogs + (pubBlogs > 0 ? 1 : 0); // pages + articles + /blog index

  const items = [
    { key: 'title', label: 'Homepage title & description', ok: hasText(homepage?.title) || (hasText(doctor.specialization) && hasText(doctor.city)),
      detail: hasText(homepage?.title) ? 'Custom title set' : (hasText(doctor.specialization) ? 'Using specialty+city fallback' : 'Add specialty & city'), needsDoctorData: !(hasText(homepage?.title) || hasText(doctor.specialization)) },
    { key: 'hero', label: 'Real hero image (not placeholder)', ok: heroImgs.length > 0,
      detail: heroImgs.length ? `${heroImgs.length} image(s)` : 'No real hero image — add a clinic/portrait photo', needsDoctorData: heroImgs.length === 0 },
    { key: 'clinic', label: 'Clinic address (NAP)', ok: hasAddress,
      detail: hasAddress ? primaryClinic.name || 'Address set' : 'Add clinic name & address', needsDoctorData: !hasAddress },
    { key: 'phone', label: 'Clinic phone (tap-to-call)', ok: !!primaryClinic && hasText(primaryClinic.phone),
      detail: primaryClinic && hasText(primaryClinic.phone) ? primaryClinic.phone : 'Add a clinic phone number', needsDoctorData: !(primaryClinic && hasText(primaryClinic.phone)) },
    { key: 'hours', label: 'Consultation hours', ok: !!primaryClinic && hasText(primaryClinic.timings),
      detail: primaryClinic && hasText(primaryClinic.timings) ? 'Set' : 'Add confirmed consultation hours', needsDoctorData: !(primaryClinic && hasText(primaryClinic.timings)) },
    { key: 'services', label: 'Services for service pages', ok: treatmentCount > 0,
      detail: treatmentCount ? `${treatmentCount} approved` : 'Approve diseases & treatments to enable service pages', needsDoctorData: treatmentCount === 0 },
    { key: 'blog', label: 'Published articles', ok: pubBlogs > 0,
      detail: `${pubBlogs} published`, needsDoctorData: false },
    { key: 'schema', label: 'Structured data (specialty + address)', ok: hasText(doctor.specialization) && hasAddress,
      detail: hasText(doctor.specialization) && hasAddress ? 'Rich schema will render' : 'Needs specialty + clinic address', needsDoctorData: !(hasText(doctor.specialization) && hasAddress) },
  ];

  // Only relevant when a custom domain is configured.
  if (hasText(doctor.customDomain)) {
    items.unshift({ key: 'domain', label: 'Custom domain verified', ok: !!doctor.customDomainVerified,
      detail: doctor.customDomainVerified ? doctor.customDomain : `${doctor.customDomain} — not verified yet`, needsDoctorData: false });
  }

  const done = items.filter((i) => i.ok).length;
  return {
    doctor: { name: doctor.displayName || doctor.name, specialty: doctor.specialization || '', city: doctor.city || '' },
    primaryUrl: base,
    urls: { pages: pubPages, blogs: pubBlogs, indexable: indexableUrls, sitemap: base ? `${base}/sitemap.xml` : null, robots: base ? `${base}/robots.txt` : null },
    items,
    score: { done, total: items.length, pct: Math.round((done / items.length) * 100) },
    missing: items.filter((i) => !i.ok).map((i) => i.key),
  };
}
