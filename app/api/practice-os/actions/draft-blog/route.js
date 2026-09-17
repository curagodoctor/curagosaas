import { NextResponse, after } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess } from '@/lib/practice-os/access';
import { assertHasCredits, chargeAiCredits, getRemainingCredits } from '@/lib/practice-os/aiCredits';
import { structureLongContent } from '@/lib/practice-os/ai';
import { BLOG_RULES } from '@/lib/practice-os/contentRules';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';
import { relatedReadingBlock } from '@/lib/practice-os/blogLinks';
import BlogArticle from '@/models/BlogArticle';
import Doctor from '@/models/Doctor';

const PAGE_TYPES = ['', 'disease', 'treatment', 'procedure', 'location', 'symptom'];

// Best-effort editorial featured image from the article topic (no credit charge —
// this only runs for the free first onboarding article). Returns a URL or null.
async function generateFeaturedImage(doctorId, topic) {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const { put } = await import('@vercel/blob');
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `A clean, professional, editorial illustration for a patient-education medical article about "${topic}". Calm, trustworthy healthcare aesthetic, soft natural lighting, muted greens and warm neutrals. No text, no words, no letters, no logos, no watermarks. Not graphic or gory.`;
    const result = await client.images.generate({ model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1', prompt, size: '1536x1024', n: 1 });
    const b64 = result?.data?.[0]?.b64_json;
    if (!b64) return null;
    const blob = await put(`blog-ai/${doctorId}/${Date.now()}-first.png`, Buffer.from(b64, 'base64'), { access: 'public', addRandomSuffix: false, contentType: 'image/png' });
    return blob.url;
  } catch { return null; }
}

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
    const { context, diseaseCluster, pageType } = await request.json();
    if (!context || !context.trim()) return NextResponse.json({ success: false, error: 'Tell me what the article should be about.' }, { status: 400 });
    // §7 — the first auto-drafted article is a free onboarding gift; the doctor's
    // 10 credits are for their own subsequent AI usage. The free first article
    // must NOT be blocked by the paid-tier or credit checks (onboarding may have
    // already spent the free credits on profile drafting). Only meter later ones.
    const firstArticle = (await BlogArticle.countDocuments({ doctorId: doctor._id })) === 0;
    if (!firstArticle) {
      await assertAiAccess(doctor._id);
      await assertHasCredits(doctor._id);
    }

    const cluster = String(diseaseCluster || '').trim().toLowerCase();
    const type = PAGE_TYPES.includes(pageType) ? pageType : '';

    const fields = await getDoctorProfileFields(doctor._id);
    const gen = await structureLongContent({
      instruction: 'Write a COMPREHENSIVE, in-depth patient-facing blog article grounded in the doctor\'s profile and knowledge base. Return JSON: {"title": string (<=90 chars, no clickbait), "excerpt": string (<=180 chars), "category": string, "blocks": [{"heading": string, "content": string (3-6 substantial paragraphs of plain text each)}] } with 6-10 blocks covering the topic thoroughly (what it is, causes, symptoms, when to see a doctor, diagnosis, treatment options, prevention/aftercare, FAQs). Informative and NMC-compliant — educational, no superlatives, no guarantees, no soliciting.',
      source: context,
      profileFields: fields,
      topic: context,
      extraRules: BLOG_RULES,
    });
    if (!gen.success) return NextResponse.json({ success: false, error: gen.error }, { status: 502 });

    const d = gen.data || {};
    const title = String(d.title || 'Untitled article').slice(0, 120);
    let slug = slugify(d.slug || title) || `article-${Date.now()}`;
    if (await BlogArticle.findOne({ slug }).select('_id').lean()) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const blocks = Array.isArray(d.blocks)
      ? d.blocks.filter((b) => b && (b.heading || b.content)).map((b) => ({ heading: String(b.heading || '').slice(0, 160), content: String(b.content || '') }))
      : [];

    // §10 auto internal linking — append a "Related reading" block pointing at the
    // doctor's other published pages in the same disease cluster.
    if (cluster) {
      const related = await relatedReadingBlock(doctor._id, cluster);
      if (related) blocks.push(related);
    }

    const doc = await Doctor.findById(doctor._id).select('displayName name specialization').lean();

    // §10 — the first (onboarding) article ships published so the doctor sees a
    // real live page. Later articles stay drafts for the doctor to review/publish.
    const article = await BlogArticle.create({
      doctorId: doctor._id,
      title,
      slug,
      excerpt: String(d.excerpt || '').slice(0, 300),
      category: String(d.category || fields.specialty || '').slice(0, 60),
      author: { name: doc?.displayName || doc?.name || '', designation: doc?.specialization || '' },
      blocks,
      diseaseCluster: cluster,
      pageType: type,
      status: firstArticle ? 'published' : 'draft',
      ...(firstArticle ? { publishedAt: new Date() } : {}),
    });

    // The featured image is generated AFTER the response is sent (it takes 30-60s),
    // so the wizard gets the article id immediately instead of waiting on the image.
    if (firstArticle) {
      const articleId = article._id;
      after(async () => {
        try {
          const url = await generateFeaturedImage(doctor._id, title);
          if (url) await BlogArticle.updateOne({ _id: articleId }, { $set: { featuredImage: { url, alt: title } } });
        } catch { /* best-effort */ }
      });
    }

    const remaining = firstArticle
      ? await getRemainingCredits(doctor._id)
      : (await chargeAiCredits(doctor._id, { label: 'draft-blog' })).remaining;
    return NextResponse.json({ success: true, id: String(article._id), title: article.title, published: firstArticle, creditsRemaining: remaining });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used all of today's AI credits. They reset tomorrow." }, { status: 402 });
    console.error('[draft-blog]', error);
    return NextResponse.json({ success: false, error: 'Could not draft the article.' }, { status: 500 });
  }
}
