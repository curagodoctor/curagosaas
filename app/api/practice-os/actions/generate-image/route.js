import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess } from '@/lib/practice-os/access';
import { assertHasCredits, chargeAiCredits } from '@/lib/practice-os/aiCredits';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Images cost materially more than a text completion, so charge a few credits.
const IMAGE_CREDIT_COST = 3;

// POST { title, context } — generate a clean, editorial featured image for a blog
// page from its topic and return a public URL. Doctor-triggered (never automatic)
// and credit-metered, so cost is only ever incurred on an explicit click.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    await assertAiAccess(doctor._id);
    await assertHasCredits(doctor._id, IMAGE_CREDIT_COST);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ success: false, error: 'Image generation is not configured.' }, { status: 503 });
    }

    const { title, context } = await request.json();
    const topic = String(title || context || '').trim();
    if (!topic) return NextResponse.json({ success: false, error: 'Give the article a title first.' }, { status: 400 });

    // Editorial, non-clinical, no text/logos/watermarks — safe for a health page.
    const prompt = `A clean, professional, editorial illustration for a patient-education medical article about "${topic}". Calm, trustworthy healthcare aesthetic, soft natural lighting, muted greens and warm neutrals. No text, no words, no letters, no logos, no watermarks. Not graphic or gory.`;

    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
      prompt,
      size: '1536x1024', // landscape featured image
      n: 1,
    });

    const b64 = result?.data?.[0]?.b64_json;
    if (!b64) return NextResponse.json({ success: false, error: 'Could not generate an image.' }, { status: 502 });

    const buffer = Buffer.from(b64, 'base64');
    const blobPath = `blog-ai/${doctor._id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const blob = await put(blobPath, buffer, { access: 'public', addRandomSuffix: false, contentType: 'image/png' });

    const charge = await chargeAiCredits(doctor._id, { amount: IMAGE_CREDIT_COST, label: 'blog-image' });
    if (!charge.ok) return NextResponse.json({ success: false, error: 'NoCredits', message: `You need ${IMAGE_CREDIT_COST} AI credits to generate an image.` }, { status: 402 });
    return NextResponse.json({ success: true, url: blob.url, creditsRemaining: charge.remaining });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: `You need ${IMAGE_CREDIT_COST} AI credits to generate an image.` }, { status: 402 });
    console.error('[generate-image]', error);
    return NextResponse.json({ success: false, error: 'Could not generate the image.' }, { status: 500 });
  }
}
