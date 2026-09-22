import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess } from '@/lib/practice-os/access';
import { assertHasCredits, chargeAiCredits } from '@/lib/practice-os/aiCredits';
import { generateAiImage } from '@/lib/practice-os/images';
import Mission from '@/models/practice-os/Mission';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST /api/practice-os/day/[id]/image { topic } — generate an image for this
// day's task (e.g. a GBP post image), returning a public URL the doctor can
// download from the day interface. Credit-metered.
export async function POST(request, { params }) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    await assertAiAccess(doctor._id);
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ success: false, error: 'AI is not configured.' }, { status: 500 });
    await assertHasCredits(doctor._id);

    const { id } = await params;
    const mission = await Mission.findById(id).select('category missionText').lean();
    const body = await request.json().catch(() => ({}));
    const topic = String(body.topic || mission?.missionText || mission?.category || 'medical practice').slice(0, 300);
    const userPrompt = String(body.prompt || '').slice(0, 500);
    // Always landscape so the image fits the blog's featured slot (16:10) without
    // truncation; landscape also posts fine to GBP. A user prompt (when given)
    // steers the image; otherwise it's auto-generated from the topic.
    const url = await generateAiImage(doctor._id, topic, { kind: 'blog', userPrompt });
    if (!url) return NextResponse.json({ success: false, error: 'Could not generate an image — try again.' }, { status: 502 });

    const { remaining } = await chargeAiCredits(doctor._id, { label: 'day-image' });
    return NextResponse.json({ success: true, url, creditsRemaining: remaining });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used today's AI credits." }, { status: 402 });
    console.error('[day image]', error);
    return NextResponse.json({ success: false, error: 'Could not generate the image.' }, { status: 500 });
  }
}
