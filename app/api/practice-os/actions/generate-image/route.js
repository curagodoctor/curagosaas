import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess } from '@/lib/practice-os/access';
import { buildImagePrompt } from '@/lib/practice-os/images';

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

    const { title, context } = await request.json();
    const topic = String(title || context || '').trim();
    if (!topic) return NextResponse.json({ success: false, error: 'Give the article a title first.' }, { status: 400 });

    // Image generation is PAUSED (OpenAI billed for images its safety filter blocked).
    // Return a ready-to-paste prompt instead — no OpenAI call, no credits charged.
    return NextResponse.json({
      success: true,
      paused: true,
      imagePrompt: buildImagePrompt(topic),
      message: 'Image generation is paused. Copy this prompt and generate an image in your own tool (ChatGPT, Gemini, Canva…), then add it.',
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: `You need ${IMAGE_CREDIT_COST} AI credits to generate an image.` }, { status: 402 });
    console.error('[generate-image]', error);
    return NextResponse.json({ success: false, error: 'Could not generate the image.' }, { status: 500 });
  }
}
