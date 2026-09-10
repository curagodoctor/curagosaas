import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess } from '@/lib/practice-os/access';
import { assertHasCredits, chargeAiCredits, getRemainingCredits } from '@/lib/practice-os/aiCredits';
import { runAssistant, isAiConfigured } from '@/lib/practice-os/ai';
import { getDoctorProfileContext, getDoctorProfileFields } from '@/lib/practice-os/profile';
import PracticeOsChatMessage from '@/models/practice-os/PracticeOsChatMessage';

export const runtime = 'nodejs';
export const maxDuration = 60;

// The global assistant thread — one persistent conversation per doctor, separate
// from any mission thread (missionId stays null, sessionId = 'global').
const GLOBAL_SESSION = 'global';

// GET — the persistent conversation + credit state, so the widget restores on any page.
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const [history, remaining] = await Promise.all([
      PracticeOsChatMessage.find({ doctorId: doctor._id, missionId: null, sessionId: GLOBAL_SESSION })
        .sort({ createdAt: 1 }).limit(100).lean(),
      getRemainingCredits(doctor._id),
    ]);
    return NextResponse.json({
      success: true,
      configured: isAiConfigured(),
      creditsRemaining: remaining,
      messages: history.map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt })),
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

// POST { prompt } — one assistant turn (1 credit). Persisted to the global thread.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    await assertAiAccess(doctor._id);

    const { prompt } = await request.json();
    if (!prompt || !prompt.trim()) return NextResponse.json({ success: false, error: 'Please enter a message.' }, { status: 400 });
    await assertHasCredits(doctor._id);

    const [profileContext, profileFields, prior] = await Promise.all([
      getDoctorProfileContext(doctor._id),
      getDoctorProfileFields(doctor._id),
      PracticeOsChatMessage.find({ doctorId: doctor._id, missionId: null, sessionId: GLOBAL_SESSION }).sort({ createdAt: 1 }).limit(20).lean(),
    ]);
    const history = prior.map((m) => ({ role: m.role, content: m.content }));

    const result = await runAssistant({ userPrompt: prompt, profileContext, profileFields, history });
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 502 });

    const usage = result.usage || {};
    const { remaining } = await chargeAiCredits(doctor._id, { label: 'assistant', tokens: usage.totalTokens || 0 });

    await PracticeOsChatMessage.create([
      { doctorId: doctor._id, missionId: null, sessionId: GLOBAL_SESSION, role: 'user', content: prompt },
      { doctorId: doctor._id, missionId: null, sessionId: GLOBAL_SESSION, role: 'assistant', content: result.text, totalTokens: usage.totalTokens || 0 },
    ]);

    return NextResponse.json({ success: true, reply: result.text, creditsRemaining: remaining });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired', message: 'You need AI credits to chat.' }, { status: 402 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used all of today's AI credits." }, { status: 402 });
    console.error('[assistant POST]', error);
    return NextResponse.json({ success: false, error: 'The assistant is unavailable right now.' }, { status: 500 });
  }
}
