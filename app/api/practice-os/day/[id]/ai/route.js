import crypto from 'crypto';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import AiCreditLedger from '@/models/practice-os/AiCreditLedger';
import PracticeOsChatMessage from '@/models/practice-os/PracticeOsChatMessage';
import { getDay } from '@/lib/practice-os/engine';
import { runMissionAssistant, isAiConfigured } from '@/lib/practice-os/ai';
import { getDoctorProfileContext, getDoctorProfileFields } from '@/lib/practice-os/profile';
import { recordAiUse } from '@/lib/practice-os/performance';

export const runtime = 'nodejs';

// The active chat thread = the sessionId of the most recent message (or 'default').
async function getActiveSession(doctorId, missionId) {
  const last = await PracticeOsChatMessage.findOne({ doctorId, missionId })
    .sort({ createdAt: -1 }).select('sessionId').lean();
  return last?.sessionId || 'default';
}

// GET /api/practice-os/day/[id]/ai — credits + availability + the CURRENT chat thread.
export async function GET(request, { params }) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { id } = await params;
    const ledger = await AiCreditLedger.getOrCreateForToday(doctor._id);
    const sessionId = await getActiveSession(doctor._id, id);
    const [history, totalCount] = await Promise.all([
      PracticeOsChatMessage.find({ doctorId: doctor._id, missionId: id, sessionId }).sort({ createdAt: 1 }).limit(100).lean(),
      PracticeOsChatMessage.countDocuments({ doctorId: doctor._id, missionId: id }),
    ]);
    return NextResponse.json({
      success: true,
      creditsRemaining: ledger.dailyBalance,
      dailyLimit: ledger.dailyLimit,
      configured: isAiConfigured(),
      sessionId,
      // Older threads exist if there are more saved messages than the current thread shows.
      hasOlderSessions: totalCount > history.length,
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
    const { prompt, newSession } = await request.json();

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

    // "New chat" starts a fresh thread (no prior context); otherwise continue the
    // active thread. Older threads stay saved but don't leak into the new one.
    const sessionId = newSession
      ? `s_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
      : await getActiveSession(doctor._id, id);

    // Inject the doctor's CV-derived knowledge base + this thread's running
    // conversation so the assistant keeps context across the chat.
    const [profileContext, profileFields, priorMessages] = await Promise.all([
      getDoctorProfileContext(doctor._id),
      getDoctorProfileFields(doctor._id),
      newSession
        ? Promise.resolve([])
        : PracticeOsChatMessage.find({ doctorId: doctor._id, missionId: id, sessionId }).sort({ createdAt: 1 }).limit(20).lean(),
    ]);
    const history = priorMessages.map((m) => ({ role: m.role, content: m.content }));
    const result = await runMissionAssistant({ mission: found.day, userPrompt: prompt, profileContext, profileFields, history });
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

    // Save the full conversation turn (user prompt + assistant reply) in this thread.
    await PracticeOsChatMessage.create([
      { doctorId: doctor._id, missionId: id, sessionId, role: 'user', content: result.prompt || prompt },
      {
        doctorId: doctor._id, missionId: id, sessionId, role: 'assistant', content: result.text,
        promptTokens: usage.promptTokens, completionTokens: usage.completionTokens, totalTokens: usage.totalTokens,
      },
    ]);

    // +2 Learning once/day for effective AI use (§10) — scoped to this pack.
    await recordAiUse(doctor._id, found.day.frameworkId);

    return NextResponse.json({
      success: true, text: result.text, creditsRemaining: ledger.dailyBalance,
      sessionId,
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
