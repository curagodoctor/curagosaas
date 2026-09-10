import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess, hasOptimizationAccess } from '@/lib/practice-os/access';
import { assertHasCredits, chargeAiCredits } from '@/lib/practice-os/aiCredits';
import { structureLongContent } from '@/lib/practice-os/ai';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';
import { relatedReadingBlock } from '@/lib/practice-os/blogLinks';
import BlogArticle from '@/models/BlogArticle';
import Doctor from '@/models/Doctor';

export const runtime = 'nodejs';
export const maxDuration = 60;

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// POST — on-demand alternative to the overnight job (§7): generate the doctor's
// NEXT education page — the first condition in their profile that doesn't have a
// page yet. Doctor-triggered and credit-metered, so no nightly per-doctor spend.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    await assertAiAccess(doctor._id);
    // Ongoing content generation is part of the gated optimization work.
    if (!(await hasOptimizationAccess(doctor._id))) {
      return NextResponse.json({ success: false, error: 'AccessRequired', message: 'This is part of the optimization work — request access first.' }, { status: 403 });
    }
    await assertHasCredits(doctor._id);

    const fields = await getDoctorProfileFields(doctor._id);
    // Candidate clusters = the conditions the doctor listed in their profile.
    const candidates = String(fields.diseases || '')
      .split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean)
      .map((name) => ({ name, slug: slugify(name) })).filter((c) => c.slug);

    if (!candidates.length) {
      return NextResponse.json({ success: false, error: 'NoConditions', message: 'Add the conditions you treat in your profile so we can generate pages for them.' }, { status: 400 });
    }

    // Skip any cluster that already has an article (any status), so we never dup.
    const existing = new Set(
      (await BlogArticle.find({ doctorId: doctor._id, diseaseCluster: { $ne: '' } }).select('diseaseCluster').lean())
        .map((a) => a.diseaseCluster),
    );
    const next = candidates.find((c) => !existing.has(c.slug));
    if (!next) {
      return NextResponse.json({ success: true, done: true, message: "You've covered all the conditions in your profile. Add more to generate new pages." });
    }

    const gen = await structureLongContent({
      instruction: 'Write a COMPREHENSIVE, in-depth patient-facing education page grounded in the doctor\'s profile and knowledge base. Return JSON: {"title": string (<=90 chars), "excerpt": string (<=180 chars), "category": string, "blocks": [{"heading": string, "content": string (3-6 paragraphs)}] } with 6-10 blocks (what it is, causes, symptoms, when to see a doctor, diagnosis, treatment options, prevention/aftercare, FAQs). Educational and NMC-compliant — no superlatives, no guarantees, no soliciting.',
      source: `Condition: ${next.name}. Specialty: ${fields.specialty || ''}. City: ${fields.city || ''}.`,
      profileFields: fields,
      topic: next.name,
    });
    if (!gen.success) return NextResponse.json({ success: false, error: gen.error }, { status: 502 });

    const d = gen.data || {};
    const title = String(d.title || next.name).slice(0, 120);
    let slug = slugify(d.slug || title) || `article-${next.slug}`;
    if (await BlogArticle.findOne({ slug }).select('_id').lean()) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const blocks = Array.isArray(d.blocks)
      ? d.blocks.filter((b) => b && (b.heading || b.content)).map((b) => ({ heading: String(b.heading || '').slice(0, 160), content: String(b.content || '') }))
      : [];
    const related = await relatedReadingBlock(doctor._id, next.slug);
    if (related) blocks.push(related);

    const doc = await Doctor.findById(doctor._id).select('displayName name specialization').lean();
    const article = await BlogArticle.create({
      doctorId: doctor._id,
      title, slug,
      excerpt: String(d.excerpt || '').slice(0, 300),
      category: String(d.category || fields.specialty || '').slice(0, 60),
      author: { name: doc?.displayName || doc?.name || '', designation: doc?.specialization || '' },
      blocks,
      diseaseCluster: next.slug,
      pageType: 'disease',
      status: 'draft',
    });

    const { remaining } = await chargeAiCredits(doctor._id, { label: 'next-page' });
    return NextResponse.json({ success: true, id: String(article._id), title: article.title, cluster: next.name, creditsRemaining: remaining });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used all of today's AI credits. They reset tomorrow." }, { status: 402 });
    console.error('[generate-next-page]', error);
    return NextResponse.json({ success: false, error: 'Could not generate the next page.' }, { status: 500 });
  }
}
