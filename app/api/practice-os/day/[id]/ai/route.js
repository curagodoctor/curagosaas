import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import AiCreditLedger from '@/models/practice-os/AiCreditLedger';
import PracticeOsChatMessage from '@/models/practice-os/PracticeOsChatMessage';
import { getDay } from '@/lib/practice-os/engine';
import { runMissionAssistant, isAiConfigured } from '@/lib/practice-os/ai';
import { getDoctorProfileContext } from '@/lib/practice-os/profile';
import { recordAiUse } from '@/lib/practice-os/performance';

export const runtime = 'nodejs';

// GET /api/practice-os/day/[id]/ai — credits + availability + saved conversation.
export async function GET(request, { params }) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { id } = await params;
    const [ledger, history] = await Promise.all([
      AiCreditLedger.getOrCreateForToday(doctor._id),
      PracticeOsChatMessage.find({ doctorId: doctor._id, missionId: id }).sort({ createdAt: 1 }).limit(100).lean(),
    ]);
    return NextResponse.json({
      success: true,
      creditsRemaining: ledger.dailyBalance,
      dailyLimit: ledger.dailyLimit,
      configured: isAiConfigured(),
      messages: history.map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/practice-os/day/[id]/ai — { prompt } → one assistant turn (costs 1 credit).
export async function POST(request, { params }) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { id } = await params;
    const { prompt } = await request.json();

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ success: false, error: 'Please enter a prompt.' }, { status: 400 });
    }

    const found = await getDay(doctor._id, id);
    if (!found?.day) return NextResponse.json({ success: false, error: 'Mission not found' }, { status: 404 });

    // Credit check — one prompt = one credit, reset daily (PRD §8).
    const ledger = await AiCreditLedger.getOrCreateForToday(doctor._id);
    if (ledger.dailyBalance <= 0) {
      return NextResponse.json(
        { success: false, error: 'You\'ve used all of today\'s AI credits. They reset tomorrow.', creditsRemaining: 0 },
        { status: 429 }
      );
    }

    // Inject the doctor's CV-derived knowledge base + the running conversation so
    // the assistant keeps context across the chat.
    const [profileContext, priorMessages] = await Promise.all([
      getDoctorProfileContext(doctor._id),
      PracticeOsChatMessage.find({ doctorId: doctor._id, missionId: id }).sort({ createdAt: 1 }).limit(20).lean(),
    ]);
    const history = priorMessages.map((m) => ({ role: m.role, content: m.content }));
    const result = await runMissionAssistant({ mission: found.day, userPrompt: prompt, profileContext, history });
    if (!result.success) {
      // Don't charge a credit for a failed call.
      return NextResponse.json({ success: false, error: result.error }, { status: 502 });
    }

    const usage = result.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    // Deduct one credit, log usage + tokens, accumulate lifetime token totals.
    ledger.dailyBalance = Math.max(0, ledger.dailyBalance - 1);
    ledger.usage.push({
      missionId: id, prompt: prompt.slice(0, 500),
      promptTokens: usage.promptTokens, completionTokens: usage.completionTokens, totalTokens: usage.totalTokens,
    });
    ledger.lifetimePromptTokens += usage.promptTokens;
    ledger.lifetimeCompletionTokens += usage.completionTokens;
    ledger.lifetimeTokens += usage.totalTokens;
    await ledger.save();

    // Save the full conversation turn (user prompt + assistant reply).
    await PracticeOsChatMessage.create([
      { doctorId: doctor._id, missionId: id, role: 'user', content: result.prompt || prompt },
      {
        doctorId: doctor._id, missionId: id, role: 'assistant', content: result.text,
        promptTokens: usage.promptTokens, completionTokens: usage.completionTokens, totalTokens: usage.totalTokens,
      },
    ]);

    // +2 Learning once/day for effective AI use (§10).
    await recordAiUse(doctor._id);

    return NextResponse.json({
      success: true, text: result.text, creditsRemaining: ledger.dailyBalance,
      tokens: usage.totalTokens, lifetimeTokens: ledger.lifetimeTokens,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error) {
  if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
  console.error('[Practice OS AI route]', error);
  return NextResponse.json({ success: false, error: 'Assistant failed' }, { status: 500 });
}
