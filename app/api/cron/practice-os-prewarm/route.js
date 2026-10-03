import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';
import PracticeOsChatMessage from '@/models/practice-os/PracticeOsChatMessage';
import Framework from '@/models/practice-os/Framework';
import { isAiConfigured } from '@/lib/practice-os/ai';
import { getDueTaskForDoctor } from '@/lib/practice-os/engine';
import { generateMissionDraft } from '@/lib/practice-os/autoContent';

export const runtime = 'nodejs';
export const maxDuration = 300;

// GET /api/cron/practice-os-prewarm — runs BEFORE the daily-tasks email cron and
// pre-generates each granted doctor's current task content + featured image, caching
// it (PracticeOsChatMessage). The email cron then just reuses the cache, so the
// morning send is fast (no AI/image work on the email critical path). Idempotent:
// skips doctors whose current task is already cached.
const MAX_PER_RUN = parseInt(process.env.PRACTICE_OS_PREWARM_MAX_PER_RUN, 10) > 0
  ? parseInt(process.env.PRACTICE_OS_PREWARM_MAX_PER_RUN, 10) : 5;
const TIME_BUDGET_MS = 260000;
const PER_DOCTOR_TIMEOUT_MS = 90000;
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('per-doctor timeout')), ms))]);

export async function GET(request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAiConfigured()) return NextResponse.json({ success: true, skipped: 'ai-not-configured' });

    await connectDB();
    const fw = await Framework.findOne({ tier: 'optimization' }).select('_id').lean();
    if (!fw) return NextResponse.json({ success: true, skipped: 'no-optimization-framework' });

    const profiles = await PracticeOsProfile.find({ 'optimizationAccess.granted': true }).select('doctorId').lean();

    const startedAt = Date.now();
    let warmed = 0, cached = 0, noTask = 0, skipped = 0, processed = 0, capped = false;
    for (const p of profiles) {
      if (processed >= MAX_PER_RUN) { capped = true; break; }
      if (Date.now() - startedAt > TIME_BUDGET_MS) { capped = true; break; }
      const doctorId = p.doctorId;
      try {
        const task = await getDueTaskForDoctor(doctorId);
        if (!task) { noTask++; continue; }
        // Already warmed? skip (cheap check, no getDay/AI).
        const exists = await PracticeOsChatMessage.exists({ doctorId, missionId: task.id, role: 'assistant' });
        if (exists) { cached++; continue; }
        processed++;
        const draft = await withTimeout(generateMissionDraft(doctorId, task.id), PER_DOCTOR_TIMEOUT_MS).catch((e) => {
          console.error('[practice-os-prewarm] generate failed:', String(doctorId), e.message);
          return null;
        });
        if (draft) warmed++; else skipped++;
      } catch (e) {
        console.error('[practice-os-prewarm] doctor failed:', String(doctorId), e.message);
        skipped++;
      }
    }
    return NextResponse.json({ success: true, granted: profiles.length, warmed, cached, noTask, skipped, capped });
  } catch (error) {
    console.error('[practice-os-prewarm]', error);
    return NextResponse.json({ success: false, error: error.message || 'Cron failed' }, { status: 500 });
  }
}

export async function POST(request) { return GET(request); }
