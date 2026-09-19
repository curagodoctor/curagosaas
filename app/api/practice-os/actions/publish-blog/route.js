import { NextResponse } from 'next/server';
import { after } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess } from '@/lib/practice-os/access';
import { assertHasCredits, chargeAiCredits } from '@/lib/practice-os/aiCredits';
import { structureContent } from '@/lib/practice-os/ai';
import { BLOG_RULES } from '@/lib/practice-os/contentRules';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';
import BlogArticle from '@/models/BlogArticle';
import Doctor from '@/models/Doctor';

export const runtime = 'nodejs';
export const maxDuration = 60;

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// POST { text } — turn an assistant reply (or any text) into a live blog page.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    await assertAiAccess(doctor._id);
    const { text, imageUrl } = await request.json();
    if (!text || !text.trim()) return NextResponse.json({ success: false, error: 'Nothing to publish.' }, { status: 400 });
    const providedImage = /^https?:\/\//i.test(String(imageUrl || '').trim()) ? String(imageUrl).trim() : '';
    await assertHasCredits(doctor._id);

    const fields = await getDoctorProfileFields(doctor._id);
    const gen = await structureContent({
      instruction: 'Turn the source content into a patient-facing blog article. Return JSON: {"title": string (<=90 chars, no clickbait), "excerpt": string (<=180 chars), "category": string, "blocks": [{"heading": string, "content": string (2-4 short paragraphs, plain text)}] } with 3-6 blocks. Informative and NMC-compliant — no superlatives, no guarantees.',
      source: text,
      profileFields: fields,
      extraRules: BLOG_RULES,
    });
    if (!gen.success) return NextResponse.json({ success: false, error: gen.error }, { status: 502 });

    const d = gen.data || {};
    const title = String(d.title || 'Untitled article').slice(0, 120);
    let slug = slugify(d.slug || title) || `article-${Date.now()}`;
    // Ensure global slug uniqueness.
    if (await BlogArticle.findOne({ slug }).select('_id').lean()) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const blocks = Array.isArray(d.blocks)
      ? d.blocks.filter((b) => b && (b.heading || b.content)).map((b) => ({ heading: String(b.heading || '').slice(0, 160), content: String(b.content || '') }))
      : [];

    const doc = await Doctor.findById(doctor._id).select('subdomain displayName name specialization').lean();
    const article = await BlogArticle.create({
      doctorId: doctor._id,
      title,
      slug,
      excerpt: String(d.excerpt || '').slice(0, 300),
      category: String(d.category || fields.specialty || '').slice(0, 60),
      author: { name: doc?.displayName || doc?.name || '', designation: doc?.specialization || '' },
      blocks,
      status: 'published',
      // Use the image the doctor already generated, if any.
      ...(providedImage ? { featuredImage: { url: providedImage, alt: title } } : {}),
    });

    const { remaining } = await chargeAiCredits(doctor._id, { label: 'publish-blog' });

    // Auto-generate a featured image (after the response, so publish is instant).
    if (!article.featuredImage?.url) {
      const articleId = article._id;
      after(async () => {
        try {
          const { generateAiImage } = await import('@/lib/practice-os/images');
          const imgUrl = await generateAiImage(doctor._id, title, { kind: 'blog' });
          if (imgUrl) await BlogArticle.updateOne({ _id: articleId }, { $set: { featuredImage: { url: imgUrl, alt: title } } });
        } catch { /* best-effort */ }
      });
    }

    const url = doc?.subdomain ? `https://${doc.subdomain}.curago.in/blog/${slug}` : `/blog/${slug}`;
    return NextResponse.json({ success: true, id: String(article._id), url, slug, title: article.title, creditsRemaining: remaining });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used all of today's AI credits. They reset tomorrow." }, { status: 402 });
    console.error('[publish-blog]', error);
    return NextResponse.json({ success: false, error: 'Could not publish the page.' }, { status: 500 });
  }
}
