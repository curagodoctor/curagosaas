import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import { structureContent } from '@/lib/practice-os/ai';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';
import BlogArticle from '@/models/BlogArticle';
import Doctor from '@/models/Doctor';

export const runtime = 'nodejs';
export const maxDuration = 60;

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// POST { context } — turn a doctor's brief/context into a DRAFT blog article the
// doctor then reviews in the editor before publishing. Unlike publish-blog (which
// goes live immediately), this saves status:'draft' and returns its id so the UI
// can open it for review → one-click publish. Gated on an active pack.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { context } = await request.json();
    if (!context || !context.trim()) return NextResponse.json({ success: false, error: 'Tell me what the article should be about.' }, { status: 400 });

    const fields = await getDoctorProfileFields(doctor._id);
    const gen = await structureContent({
      instruction: 'Turn the brief into a patient-facing blog article draft. Return JSON: {"title": string (<=90 chars, no clickbait), "excerpt": string (<=180 chars), "category": string, "blocks": [{"heading": string, "content": string (2-4 short paragraphs, plain text)}] } with 3-6 blocks. Informative and NMC-compliant — no superlatives, no guarantees.',
      source: context,
      profileFields: fields,
    });
    if (!gen.success) return NextResponse.json({ success: false, error: gen.error }, { status: 502 });

    const d = gen.data || {};
    const title = String(d.title || 'Untitled article').slice(0, 120);
    let slug = slugify(d.slug || title) || `article-${Date.now()}`;
    if (await BlogArticle.findOne({ slug }).select('_id').lean()) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const blocks = Array.isArray(d.blocks)
      ? d.blocks.filter((b) => b && (b.heading || b.content)).map((b) => ({ heading: String(b.heading || '').slice(0, 160), content: String(b.content || '') }))
      : [];

    const doc = await Doctor.findById(doctor._id).select('displayName name specialization').lean();
    const article = await BlogArticle.create({
      doctorId: doctor._id,
      title,
      slug,
      excerpt: String(d.excerpt || '').slice(0, 300),
      category: String(d.category || fields.specialty || '').slice(0, 60),
      author: { name: doc?.displayName || doc?.name || '', designation: doc?.specialization || '' },
      blocks,
      // Draft — the doctor reviews and publishes it themselves.
      status: 'draft',
    });

    return NextResponse.json({ success: true, id: String(article._id), title: article.title });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[draft-blog]', error);
    return NextResponse.json({ success: false, error: 'Could not draft the article.' }, { status: 500 });
  }
}
