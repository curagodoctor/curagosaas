import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess } from '@/lib/practice-os/access';
import { assertHasCredits, chargeAiCredits } from '@/lib/practice-os/aiCredits';
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
    // AI is a paid-tier feature.
    await assertAiAccess(doctor._id);

    const body = await request.json().catch(() => ({}));
    const force = !!body.force;

    const doc = await Doctor.findById(doctor._id).lean();

    // Guard: never overwrite a website the doctor has already customized. If the
    // home page exists and is user-edited, refuse unless they explicitly force it.
    // (Checked BEFORE charging credits so a customized-skip costs nothing.)
    const existing = await BookingPage.findOne({ doctorId: doctor._id, slug: 'home' }).select('userEdited').lean();
    if (existing?.userEdited && !force) {
      return NextResponse.json({
        success: false,
        skipped: true,
        reason: 'customized',
        error: 'Your website has changes you made yourself. Generating again would overwrite them.',
      });
    }

    // Block when today's credit pool is empty (throws NoCredits → 402 below).
    await assertHasCredits(doctor._id);

    const fields = await getDoctorProfileFields(doctor._id);

    const gen = await structureContent({
      instruction: 'Write website copy for this doctor\'s home page. Return JSON: {"metaDescription": string (<=155 chars), "aboutTitle": string, "aboutContent": string (2-3 short paragraphs, warm and factual), "servicesSubtitle": string (<=140 chars), "tagline": string (<=90 chars), "faqs": [{"question": string, "answer": string}] (3 items)}. Informative and NMC-compliant — no superlatives or guarantees.',
      source: `Doctor: ${fields.doctor_name || doc?.displayName || ''}. Specialty: ${fields.specialty || doc?.specialization || ''}. Expertise: ${fields.expertise || ''}. Diseases: ${fields.diseases || ''}. Clinic: ${fields.clinic_name || ''}, ${fields.city || ''}.`,
      profileFields: fields,
    });
    if (!gen.success) return NextResponse.json({ success: false, error: gen.error }, { status: 502 });
    const g = gen.data || {};

    // Merge the generated copy into a set of sections (defensively — only touch
    // fields that exist). `base` is the sections to write into.
    const injectCopy = (baseSections) => (baseSections || []).map((s) => {
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

    const now = new Date();
    let page = await BookingPage.findOne({ doctorId: doctor._id, slug: 'home' });
    let mode;

    if (!page) {
      // No page yet → generate and push LIVE immediately (Content Block 6).
      page = new BookingPage({
        doctorId: doctor._id, slug: 'home', title: `${doc?.displayName || doc?.name || 'My'} — Clinic`,
        status: 'published', sections: injectCopy(buildDefaultSections(doc || {})), createdBy: 'ai',
        aiGeneratedAt: now,
      });
      if (g.metaDescription) page.metaDescription = String(g.metaDescription).slice(0, 300);
      page.markModified('sections');
      await page.save();
      mode = 'live';
    } else {
      // Page exists → keep it live, snapshot the current version to history, and
      // write the AI result as a DRAFT for the doctor to approve.
      const snapshot = { sections: page.sections || [], savedAt: now, source: 'pre-ai' };
      page.versions = [snapshot, ...(page.versions || [])].slice(0, 10);
      page.draftSections = injectCopy(page.sections);
      page.draftMeta = { source: 'ai', createdAt: now };
      page.markModified('draftSections');
      page.markModified('versions');
      await page.save();
      mode = 'draft';
    }

    // Charge one credit now that generation succeeded.
    const { remaining } = await chargeAiCredits(doctor._id, { label: 'generate-site' });

    const hasAddress = !!(doc?.customDomain || doc?.subdomain);
    const url = doc?.customDomain ? `https://${doc.customDomain}` : (doc?.subdomain ? `https://${doc.subdomain}.curago.in` : '');
    return NextResponse.json({ success: true, mode, draft: mode === 'draft', pageId: String(page._id), url, hasAddress, creditsRemaining: remaining });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used all of today's AI credits. They reset tomorrow." }, { status: 402 });
    console.error('[generate-site]', error);
    return NextResponse.json({ success: false, error: 'Could not generate your website.' }, { status: 500 });
  }
}
