import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import { structureContent } from '@/lib/practice-os/ai';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';
import BookingPage from '@/models/BookingPage';
import Doctor from '@/models/Doctor';
import { buildDefaultSections } from '@/lib/defaultTemplate';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST — generate website content from the doctor's profile and publish it to
// their home page. Creates the home page if it doesn't exist yet. Returns the URL
// (or a flag that they still need to set a website address).
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();

    const body = await request.json().catch(() => ({}));
    const force = !!body.force;

    const doc = await Doctor.findById(doctor._id).lean();

    // Guard: never overwrite a website the doctor has already customized. If the
    // home page exists and is user-edited, refuse unless they explicitly force it.
    const existing = await BookingPage.findOne({ doctorId: doctor._id, slug: 'home' }).select('userEdited').lean();
    if (existing?.userEdited && !force) {
      return NextResponse.json({
        success: false,
        skipped: true,
        reason: 'customized',
        error: 'Your website has changes you made yourself. Generating again would overwrite them.',
      });
    }

    const fields = await getDoctorProfileFields(doctor._id);

    const gen = await structureContent({
      instruction: 'Write website copy for this doctor\'s home page. Return JSON: {"metaDescription": string (<=155 chars), "aboutTitle": string, "aboutContent": string (2-3 short paragraphs, warm and factual), "servicesSubtitle": string (<=140 chars), "tagline": string (<=90 chars), "faqs": [{"question": string, "answer": string}] (3 items)}. Informative and NMC-compliant — no superlatives or guarantees.',
      source: `Doctor: ${fields.doctor_name || doc?.displayName || ''}. Specialty: ${fields.specialty || doc?.specialization || ''}. Expertise: ${fields.expertise || ''}. Diseases: ${fields.diseases || ''}. Clinic: ${fields.clinic_name || ''}, ${fields.city || ''}.`,
      profileFields: fields,
    });
    if (!gen.success) return NextResponse.json({ success: false, error: gen.error }, { status: 502 });
    const g = gen.data || {};

    // Find (or create) the home page.
    let page = await BookingPage.findOne({ doctorId: doctor._id, slug: 'home' });
    if (!page) {
      page = new BookingPage({
        doctorId: doctor._id, slug: 'home', title: `${doc?.displayName || doc?.name || 'My'} — Clinic`,
        status: 'published', sections: buildDefaultSections(doc || {}), createdBy: 'ai',
      });
    }

    // Inject the generated copy into the relevant sections (defensively — only
    // touch fields that exist).
    if (g.metaDescription) page.metaDescription = String(g.metaDescription).slice(0, 300);
    page.sections = (page.sections || []).map((s) => {
      const cfg = { ...(s.config || {}) };
      if (s.type === 'doctor_profile') {
        if (g.aboutTitle) cfg.title = String(g.aboutTitle).slice(0, 120);
        if (g.aboutContent) cfg.content = String(g.aboutContent);
      } else if (s.type === 'benefits_list' && g.servicesSubtitle) {
        cfg.subtitle = String(g.servicesSubtitle).slice(0, 200);
      } else if (s.type === 'footer' && g.tagline) {
        cfg.tagline = String(g.tagline).slice(0, 120);
      } else if (s.type === 'faqs' && Array.isArray(g.faqs) && g.faqs.length) {
        cfg.items = g.faqs.slice(0, 6).map((f) => ({ question: String(f.question || ''), answer: String(f.answer || '') }));
      }
      return { ...s, config: cfg };
    });
    page.status = 'published';
    page.aiGeneratedAt = new Date();
    page.markModified('sections');
    await page.save();

    const hasAddress = !!(doc?.customDomain || doc?.subdomain);
    const url = doc?.customDomain ? `https://${doc.customDomain}` : (doc?.subdomain ? `https://${doc.subdomain}.curago.in` : '');
    return NextResponse.json({ success: true, url, hasAddress });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[generate-site]', error);
    return NextResponse.json({ success: false, error: 'Could not generate your website.' }, { status: 500 });
  }
}
