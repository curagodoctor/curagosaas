import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess, getOptimizationAccessState } from '@/lib/practice-os/access';
import { assertHasCredits, chargeAiCredits } from '@/lib/practice-os/aiCredits';
import { buildImagePrompt } from '@/lib/practice-os/images';
import Mission from '@/models/practice-os/Mission';
import Framework from '@/models/practice-os/Framework';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Image generation costs 3 credits (same as the blog-image action).
const IMAGE_CREDIT_COST = 3;

// POST /api/practice-os/day/[id]/image { topic } — generate an image for this
// day's task (e.g. a GBP post image), returning a public URL the doctor can
// download from the day interface. Credit-metered.
export async function POST(request, { params }) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    await assertAiAccess(doctor._id);

    const { id } = await params;
    const mission = await Mission.findById(id).select('category missionText frameworkId').lean();
    const body = await request.json().catch(() => ({}));
    const topic = String(body.topic || mission?.missionText || mission?.category || 'medical practice').slice(0, 300);
    // Image generation is PAUSED (it was burning OpenAI money on images the safety
    // filter blocked). Instead we return a ready-to-paste prompt — the doctor
    // generates their own image in any tool and adds it. No OpenAI call, no credits.
    return NextResponse.json({
      success: true,
      paused: true,
      imagePrompt: buildImagePrompt(topic),
      message: 'Image generation is paused. Copy this prompt and generate an image in your own tool (ChatGPT, Gemini, Canva…), then add it.',
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used today's AI credits." }, { status: 402 });
    console.error('[day image]', error);
    return NextResponse.json({ success: false, error: 'Could not generate the image.' }, { status: 500 });
  }
}
