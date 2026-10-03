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
// Image generation is the bottleneck (~25s each), so we process a SMALL batch per
// run and self-paginate: the cron fires several times across the morning window
// (see vercel.json) and the per-mission marker means nobody is emailed twice. We
// also stop cleanly before the 300s wall so the function returns 200 (not a 504
// kill) and the markers we DID set persist.
const MAX_PER_RUN = parseInt(process.env.PRACTICE_OS_TASKS_MAX_PER_RUN, 10) > 0
  ? parseInt(process.env.PRACTICE_OS_TASKS_MAX_PER_RUN, 10) : 5;
const TIME_BUDGET_MS = 250000;      // leave ~50s headroom under maxDuration (300s)
const PER_DOCTOR_TIMEOUT_MS = 80000; // a single hung AI call must not eat the budget

const withTimeout = (promise, ms) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('per-doctor timeout')), ms)),
]);

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

    // Manual/targeted trigger (?email= or ?doctorId=) — send to ONE doctor now and,
    // with ?force=1, ignore the once-per-day guard. Used to preview the email on
    // demand; the scheduled run passes neither and processes everyone normally.
    const url = new URL(request.url);
    const targetEmail = (url.searchParams.get('email') || '').trim().toLowerCase();
    const targetDoctorId = (url.searchParams.get('doctorId') || '').trim();
    const force = url.searchParams.get('force') === '1';

    let profiles;
    if (targetEmail || targetDoctorId) {
      let docId = targetDoctorId;
      if (!docId && targetEmail) {
        const doc = await Doctor.findOne({ email: targetEmail }).select('_id').lean();
        if (!doc) return NextResponse.json({ success: false, error: 'doctor not found for email' }, { status: 404 });
        docId = doc._id;
      }
      profiles = await PracticeOsProfile.find({ doctorId: docId }).select('doctorId').lean();
    } else {
      profiles = await PracticeOsProfile.find({ 'optimizationAccess.granted': true }).select('doctorId').lean();
    }

    const startedAt = Date.now();
    let emailed = 0, skipped = 0, noTask = 0, processed = 0, capped = false;
    for (const p of profiles) {
      if (processed >= MAX_PER_RUN) { capped = true; break; }
      if (Date.now() - startedAt > TIME_BUDGET_MS) { capped = true; break; } // return cleanly before the 300s kill
      const doctorId = p.doctorId;
      try {
        const task = await getDueTaskForDoctor(doctorId);
        if (!task) { noTask++; continue; }

        // One email PER DAY (a true daily mail): skip only if we already emailed this
        // doctor today (IST). The current task re-sends daily until they complete it;
        // once completed, the next task becomes current and goes out the next day.
        const enr = await PracticeOsEnrollment.findOne({ doctorId, frameworkId: fw._id }).select('lastTaskEmailedAt').lean();
        const istDay = (t) => new Date(new Date(t).getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
        if (!force && enr?.lastTaskEmailedAt && istDay(enr.lastTaskEmailedAt) === istDay(Date.now())) { skipped++; continue; }

        const doctor = await Doctor.findById(doctorId).select('email displayName name').lean();
        if (!doctor?.email) { skipped++; continue; }

        processed++;
        const draft = await withTimeout(generateMissionDraft(doctorId, task.id), PER_DOCTOR_TIMEOUT_MS).catch((e) => {
          console.error('[practice-os-daily-tasks] generate timed out/failed:', String(doctorId), e.message);
          return null;
        });
        if (!draft) { skipped++; continue; }

        const externalUrl = draft.external ? (draft.primaryAction?.url || '') : '';
        const res = await sendDailyTaskEmail({
          email: doctor.email,
          name: draft.doctorName || doctor.displayName || doctor.name,
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
