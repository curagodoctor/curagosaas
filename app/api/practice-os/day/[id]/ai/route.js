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
import { findModule } from '@/lib/practice-os/modules';

export const runtime = 'nodejs';

// The active chat thread. Threads are per-module (so each module's auto-drafted
// response + follow-up chat stays separate); the base session id for a module is
// `mod_<moduleId>`, and "New chat" appends a timestamp. Legacy per-mission chats
// use 'default'.
function baseSession(moduleId) {
  return moduleId ? `mod_${moduleId}` : 'default';
}
async function getActiveSession(doctorId, missionId, moduleId) {
  const base = baseSession(moduleId);
  // Latest message in this module's thread family (base or base_<ts>).
  const last = await PracticeOsChatMessage.findOne({
    doctorId, missionId,
    sessionId: moduleId ? { $regex: `^${base}(_|$)` } : base,
  }).sort({ createdAt: -1 }).select('sessionId').lean();
  return last?.sessionId || base;
}

// GET /api/practice-os/day/[id]/ai — credits + availability + the CURRENT chat thread.
export async function GET(request, { params }) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { id } = await params;
    const ledger = await AiCreditLedger.getOrCreateForToday(doctor._id);
    const url = new URL(request.url);
    const moduleId = url.searchParams.get('moduleId') || null;
    const sessionId = await getActiveSession(doctor._id, id, moduleId);
    const [history, totalCount] = await Promise.all([
      PracticeOsChatMessage.find({ doctorId: doctor._id, missionId: id, sessionId }).sort({ createdAt: 1 }).limit(100).lean(),
      PracticeOsChatMessage.countDocuments({ doctorId: doctor._id, missionId: id, sessionId }),
    ]);
    return NextResponse.json({
      success: true,
      creditsRemaining: ledger.dailyBalance,
      dailyLimit: ledger.dailyLimit,
      configured: isAiConfigured(),
      sessionId,
      // Whether this module's thread has any turns yet (drives client auto-draft).
      threadEmpty: history.length === 0,
      hasOlderSessions: totalCount > history.length,
      // Hidden turns (the auto-fired prompt) are flagged so the client can skip them.
      messages: history.map((m) => ({ role: m.role, content: m.content, hidden: !!m.hidden, createdAt: m.createdAt })),
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
    const { prompt, newSession, moduleId, auto } = await request.json();

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
      ? `${baseSession(moduleId)}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
      : await getActiveSession(doctor._id, id, moduleId);

    // Guard: never auto-draft twice into the same module thread (e.g. a double
    // mount / refresh race). If this is an auto turn and the thread already has
    // messages, skip silently without charging a credit.
    if (auto) {
      const existing = await PracticeOsChatMessage.countDocuments({ doctorId: doctor._id, missionId: id, sessionId });
      if (existing > 0) {
        return NextResponse.json({ success: true, skipped: true, creditsRemaining: (await AiCreditLedger.getOrCreateForToday(doctor._id)).dailyBalance });
      }
    }

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
    const activeModule = moduleId ? findModule(found.modules || [], moduleId) : null;
    const result = await runMissionAssistant({ mission: found.day, module: activeModule, userPrompt: prompt, profileContext, profileFields, history });
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
      // The auto-fired module prompt is stored hidden — the doctor sees only the reply.
      { doctorId: doctor._id, missionId: id, sessionId, role: 'user', content: result.prompt || prompt, hidden: !!auto },
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
