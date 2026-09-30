import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';
import PracticeOsEnrollment from '@/models/practice-os/PracticeOsEnrollment';
import Doctor from '@/models/Doctor';
import Framework from '@/models/practice-os/Framework';
import { isAiConfigured } from '@/lib/practice-os/ai';
import { getDueTaskForDoctor } from '@/lib/practice-os/engine';
import { generateMissionDraft } from '@/lib/practice-os/autoContent';
import { signActionToken } from '@/lib/practice-os/actionToken';
import { sendDailyTaskEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const maxDuration = 300;

// GET /api/cron/practice-os-daily-tasks — the auto-run job. For each doctor with
// optimization access, generate their current unlocked task's content + image
// server-side (no credit charge) and EMAIL it with one-tap Publish / Edit (blog)
// or the content + Open-platform link (GBP/Instagram). Sends exactly one email per
// task (tracked on the enrollment). Capped per run to stay within the time limit.
const MAX_PER_RUN = parseInt(process.env.PRACTICE_OS_TASKS_MAX_PER_RUN, 10) > 0
  ? parseInt(process.env.PRACTICE_OS_TASKS_MAX_PER_RUN, 10) : 12;

const EXTERNAL_LABEL = { gbp: 'Google Business Profile', gemini: 'Google Business Profile' };

export async function GET(request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAiConfigured()) return NextResponse.json({ success: true, skipped: 'ai-not-configured' });

    await connectDB();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://curago.in';
    const fw = await Framework.findOne({ tier: 'optimization' }).select('_id').lean();
    if (!fw) return NextResponse.json({ success: true, skipped: 'no-optimization-framework' });

    const profiles = await PracticeOsProfile.find({ 'optimizationAccess.granted': true }).select('doctorId').lean();

    let emailed = 0, skipped = 0, noTask = 0, processed = 0, capped = false;
    for (const p of profiles) {
      if (processed >= MAX_PER_RUN) { capped = true; break; }
      const doctorId = p.doctorId;
      try {
        const task = await getDueTaskForDoctor(doctorId);
        if (!task) { noTask++; continue; }

        // One email per task: skip if we already emailed THIS mission.
        const enr = await PracticeOsEnrollment.findOne({ doctorId, frameworkId: fw._id }).select('lastTaskEmailedMissionId').lean();
        if (enr && String(enr.lastTaskEmailedMissionId || '') === String(task.id)) { skipped++; continue; }

        const doctor = await Doctor.findById(doctorId).select('email displayName name').lean();
        if (!doctor?.email) { skipped++; continue; }

        processed++;
        const draft = await generateMissionDraft(doctorId, task.id);
        if (!draft) { skipped++; continue; }

        const externalUrl = draft.external ? (draft.primaryAction?.url || '') : '';
        const res = await sendDailyTaskEmail({
          email: doctor.email,
          name: doctor.displayName || doctor.name,
          dayNumber: task.dayNumber,
          taskTitle: draft.title,
          contentMarkdown: draft.content,
          imageUrl: draft.imageUrl,
          external: draft.external,
          externalLabel: EXTERNAL_LABEL[draft.primaryAction?.type] || 'the platform',
          externalUrl,
          publishUrl: `${appUrl}/p/publish/${signActionToken({ doctorId, missionId: task.id, action: 'publish' })}`,
          editUrl: `${appUrl}/p/edit/${signActionToken({ doctorId, missionId: task.id, action: 'edit' })}`,
        });
        if (!res.success) { skipped++; continue; }

        await PracticeOsEnrollment.updateOne(
          { doctorId, frameworkId: fw._id },
          { $set: { lastTaskEmailedMissionId: task.id, lastTaskEmailedAt: new Date() } },
        );
        emailed++;
      } catch (e) {
        console.error('[practice-os-daily-tasks] doctor failed:', String(doctorId), e.message);
        skipped++;
      }
    }
    return NextResponse.json({ success: true, granted: profiles.length, emailed, skipped, noTask, capped });
  } catch (error) {
    console.error('[practice-os-daily-tasks]', error);
    return NextResponse.json({ success: false, error: error.message || 'Cron failed' }, { status: 500 });
  }
}

export async function POST(request) { return GET(request); }
