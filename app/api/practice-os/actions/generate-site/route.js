import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess } from '@/lib/practice-os/access';
import { assertHasCredits, chargeAiCredits, getRemainingCredits } from '@/lib/practice-os/aiCredits';
import { structureLongContent } from '@/lib/practice-os/ai';
import { WEBSITE_RULES } from '@/lib/practice-os/contentRules';
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
    // NOTE: the paid-tier (assertAiAccess) + credit checks are deferred until we
    // know whether this is the FREE first build. The very first website build
    // during onboarding must never be blocked by payment/credits — otherwise a
    // brand-new doctor (no paid pack, no credits yet) can't get past the wizard.

    const body = await request.json().catch(() => ({}));
    const force = !!body.force;
    // Answers from the pre-generation questions page (dynamic Q&A + uploaded
    // assets). Split into extra text context and image/logo URLs.
    const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
    const answerLines = [];
    const clinicPhotos = [];
    let logoUrl = '';
    let profileImageUrl = '';
    for (const [k, v] of Object.entries(answers)) {
      if (v == null || v === '') continue;
      const values = (Array.isArray(v) ? v : [v]).map((x) => String(x).trim()).filter(Boolean);
      const urls = values.filter((x) => /^https?:\/\//i.test(x));
      const texts = values.filter((x) => !/^https?:\/\//i.test(x));
      if (urls.length) {
        if (/logo/i.test(k)) logoUrl = urls[0];
        else if (/profile/i.test(k)) profileImageUrl = urls[0];
        else urls.forEach((u) => clinicPhotos.push(u)); // clinic photos / hero images
      }
      if (texts.length) answerLines.push(`${k.replace(/_/g, ' ')}: ${texts.join(', ')}`);
    }

    const doc = await Doctor.findById(doctor._id).lean();

    // Guard: never overwrite a website the doctor has already customized. If the
    // home page exists and is user-edited, refuse unless they explicitly force it.
    // (Checked BEFORE charging credits so a customized-skip costs nothing.)
    const existing = await BookingPage.findOne({ doctorId: doctor._id, slug: 'home' }).select('userEdited aiGeneratedAt').lean();
    if (existing?.userEdited && !force) {
      return NextResponse.json({
        success: false,
        skipped: true,
        reason: 'customized',
        error: 'Your website has changes you made yourself. Generating again would overwrite them.',
      });
    }

    // §7 — the very first website build is a free onboarding gift: the doctor's
    // 10 credits are for their own AI usage afterwards, not the automatic build.
    // Only meter (and require credits for) re-generations.
    // The subdomain step seeds a bare `createdBy:'system'` scaffold, so a page
    // usually already exists here. A page that has NEVER been AI-generated or
    // hand-edited is still the free first build (i.e. the onboarding build).
    const firstBuild = !existing || (!existing.aiGeneratedAt && !existing.userEdited);
    // Re-generations are a paid, credit-metered feature. The free first build
    // skips both checks so onboarding always succeeds.
    if (!firstBuild) {
      await assertAiAccess(doctor._id);
      await assertHasCredits(doctor._id); // throws NoCredits → 402 below
    }

    const fields = await getDoctorProfileFields(doctor._id);
    // A readable summary of everything we know about the doctor, for grounding.
    const profileSummary = Object.entries(fields)
      .filter(([, v]) => v != null && String(v).trim())
      .slice(0, 40)
      .map(([k, v]) => `${k}: ${String(v).slice(0, 200)}`)
      .join('\n');
    // Flag a too-thin profile so the UI can nudge the doctor to complete it.
    const profileThin = !(fields.specialty || doc?.specialization) && !fields.expertise && !fields.diseases && !doc?.bio;

    const gen = await structureLongContent({
      instruction: 'Write RICH, complete website copy for this doctor\'s clinic home page, grounded in the full doctor profile AND knowledge base provided. Return JSON: {"metaDescription": string (<=155 chars), "aboutTitle": string (e.g. "About Dr. X"), "aboutContent": string (3-4 substantial, warm, factual paragraphs — experience, approach, what patients can expect), "servicesSubtitle": string (<=140 chars), "services": [{"icon": string (ONE of: stethoscope, calendar, chat, shield, heart, clock, location, phone, user, award, document), "title": string (3-6 words), "description": string (2-3 sentences)}] (8-12 items — be thorough: cover the doctor\'s conditions treated, diseases, procedures AND areas of expertise, one card each; do not stop at a handful), "faqs": [{"question": string, "answer": string (2-4 sentences)}] (8 items covering booking, what to expect, conditions, follow-up), "tagline": string (<=90 chars)}. Ground everything strictly in the doctor profile + knowledge base below — do NOT invent specialties, procedures, credentials, prices or locations that are not given. Informative and NMC-compliant — no superlatives or guarantees.',
      source: `Doctor name: ${fields.doctor_name || doc?.displayName || doc?.name || ''}\nSpecialty: ${fields.specialty || doc?.specialization || ''}\n${profileSummary}${answerLines.length ? `\n\nAdditional details the doctor provided:\n${answerLines.join('\n')}` : ''}`,
      profileFields: fields,
      // No single pack context for the site — pull global knowledge chunks.
      frameworkId: null,
      topic: `${fields.specialty || doc?.specialization || ''} ${fields.expertise || ''} ${fields.diseases || ''}`.trim(),
      // The fixed website layout + per-section content rules (E-E-A-T, section
      // depth, the governing test) from the Website Builder rule book.
      extraRules: WEBSITE_RULES,
    }).catch((e) => ({ success: false, error: e?.message || 'generation error' }));
    // Robustness: the AI copy step must never hard-fail onboarding. On the first
    // build, fall back to the default scaffold (built from the doctor's real data)
    // so a website is ALWAYS created — the doctor can regenerate the copy later.
    // Only a re-generation surfaces the error (the live page is left untouched).
    if (!gen.success) {
      if (!firstBuild) return NextResponse.json({ success: false, error: gen.error }, { status: 502 });
      console.warn('[generate-site] AI copy failed on first build — publishing default scaffold:', gen.error);
    }
    const g = gen.success ? (gen.data || {}) : {};

    // Merge generated copy into a section set, writing to each section's REAL
    // config fields (matching lib/defaultTemplate.js / the section renderers).
    const injectCopy = (baseSections) => (baseSections || []).map((s) => {
      const cfg = { ...(s.config || {}) };
      if (s.type === 'doctor_profile') {
        if (g.aboutTitle) cfg.title = String(g.aboutTitle).slice(0, 120);
        if (g.aboutContent) cfg.content = String(g.aboutContent);
      } else if (s.type === 'benefits_list') {
        if (g.servicesSubtitle) cfg.subtitle = String(g.servicesSubtitle).slice(0, 200);
        if (Array.isArray(g.services) && g.services.length) {
          cfg.items = g.services.slice(0, 12).map((x) => ({
            icon: String(x.icon || 'stethoscope').slice(0, 24),
            title: String(x.title || '').slice(0, 80),
            description: String(x.description || '').slice(0, 300),
          }));
        }
      } else if (s.type === 'footer') {
        if (g.tagline) cfg.tagline = String(g.tagline).slice(0, 120);
      } else if (s.type === 'faqs' && Array.isArray(g.faqs) && g.faqs.length) {
        // FAQ section reads config.faqs (NOT items).
        cfg.faqs = g.faqs.slice(0, 8).map((f) => ({ question: String(f.question || ''), answer: String(f.answer || '') }));
      }
      return { ...s, config: cfg };
    });

    // Always generate onto a COMPLETE default scaffold (built from the doctor's
    // real data) so About / Services / FAQs always exist to receive content —
    // regardless of what the doctor's current page happens to contain.
    const generated = injectCopy(buildDefaultSections(doc || {}));

    // Drop uploaded assets into the right sections: logo → header, clinic photos
    // → hero carousel, profile photo → doctor profile.
    if (logoUrl || clinicPhotos.length || profileImageUrl) {
      for (const s of generated) {
        if (s.type === 'header' && logoUrl) s.config.logoUrl = logoUrl;
        if (s.type === 'hero_carousel' && clinicPhotos.length) {
          s.config.images = clinicPhotos.map((u) => ({ url: u, alt: '', caption: '' }));
        }
        if (s.type === 'doctor_profile') {
          if (profileImageUrl) s.config.imageUrl = profileImageUrl;
          else if (clinicPhotos[0] && !s.config.imageUrl) s.config.imageUrl = clinicPhotos[0];
        }
      }
    }

    const now = new Date();
    let page = await BookingPage.findOne({ doctorId: doctor._id, slug: 'home' });
    let mode;

    if (!page) {
      // No page yet → generate and push LIVE immediately (Content Block 6).
      page = new BookingPage({
        doctorId: doctor._id, slug: 'home', title: `${doc?.displayName || doc?.name || 'My'} — Clinic`,
        status: 'published', sections: generated, createdBy: 'ai',
        aiGeneratedAt: now,
      });
      if (g.metaDescription) page.metaDescription = String(g.metaDescription).slice(0, 300);
      page.markModified('sections');
      await page.save();
      mode = 'live';
    } else {
      // Page exists → keep it live, snapshot the current version to history, and
      // write the fresh full AI homepage as a DRAFT for the doctor to approve.
      const snapshot = { sections: page.sections || [], savedAt: now, source: 'pre-ai' };
      page.versions = [snapshot, ...(page.versions || [])].slice(0, 10);
      page.draftSections = generated;
      page.draftMeta = { source: 'ai', createdAt: now };
      // Mark that AI has now generated for this page so subsequent builds are
      // metered (the seeded scaffold's first AI build is the free one).
      page.aiGeneratedAt = now;
      page.markModified('draftSections');
      page.markModified('versions');
      await page.save();
      mode = 'draft';
    }

    // Charge one credit now that generation succeeded — except the free first build.
    const remaining = firstBuild
      ? await getRemainingCredits(doctor._id)
      : (await chargeAiCredits(doctor._id, { label: 'generate-site' })).remaining;

    const hasAddress = !!(doc?.customDomain || doc?.subdomain);
    const url = doc?.customDomain ? `https://${doc.customDomain}` : (doc?.subdomain ? `https://${doc.subdomain}.curago.in` : '');
    return NextResponse.json({ success: true, mode, draft: mode === 'draft', pageId: String(page._id), url, hasAddress, profileThin, creditsRemaining: remaining });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used all of today's AI credits. They reset tomorrow." }, { status: 402 });
    console.error('[generate-site]', error);
    return NextResponse.json({ success: false, error: 'Could not generate your website.' }, { status: 500 });
  }
}
