import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';
import PracticeOsEnrollment from '@/models/practice-os/PracticeOsEnrollment';
import Doctor from '@/models/Doctor';
import Framework from '@/models/practice-os/Framework';
import { isAiConfigured } from '@/lib/practice-os/ai';
import { getDueTaskForDoctor } from '@/lib/practice-os/engine';
import { listActiveOptimizationDoctorIds } from '@/lib/practice-os/access';
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
const PER_DOCTOR_TIMEOUT_MS = 120000; // room for text + image (incl. a fallback image attempt); a single hung call still can't run forever

const withTimeout = (promise, ms) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('per-doctor timeout')), ms)),
]);

const EXTERNAL_LABEL = { gbp: 'Google Business Profile', gemini: 'Google Business Profile' };

export async function GET(request) {
  const runStartedAt = new Date();
  const results = [];
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
      profiles = await PracticeOsProfile.find({ doctorId: docId }).select('doctorId scheduleType curagoDay').lean();
    } else {
      // Only doctors with WORKING DOS access right now — an unexpired grant window OR
      // an active paid subscription. This excludes expired/revoked grants (no more
      // mail once access lapses) and includes paid subscribers (whose access is a
      // subscription, not a `granted` flag).
      const activeIds = await listActiveOptimizationDoctorIds();
      profiles = activeIds.length
        ? await PracticeOsProfile.find({ doctorId: { $in: activeIds } }).select('doctorId scheduleType curagoDay').lean()
        : [];
      // Active doctors without a profile row still get the daily task (default schedule).
      const haveProfile = new Set(profiles.map((p) => String(p.doctorId)));
      for (const id of activeIds) if (!haveProfile.has(String(id))) profiles.push({ doctorId: id });
    }

    const targeted = !!(targetEmail || targetDoctorId);
    const debug = [];
    const dbg = (o) => { if (targeted) debug.push(o); };

    // Today's weekday in IST (0=Sun … 6=Sat) — used to honor weekly "CuraGo day".
    const istDow = new Date(Date.now() + 5.5 * 3600 * 1000).getUTCDay();

    const startedAt = Date.now();
    let emailed = 0, generated = 0, skipped = 0, noTask = 0, processed = 0, capped = false;
    for (const p of profiles) {
      if (processed >= MAX_PER_RUN) { capped = true; break; }
      if (Date.now() - startedAt > TIME_BUDGET_MS) { capped = true; break; } // return cleanly before the 300s kill
      const doctorId = p.doctorId;
      const r = { doctorId, name: '', draft: false, image: false, email: false, ok: true, reason: '' };
      try {
        const task = await getDueTaskForDoctor(doctorId);
        if (!task) { noTask++; r.reason = 'no-due-task'; dbg({ reason: 'no-due-task' }); continue; }

        const doctor = await Doctor.findById(doctorId).select('email displayName name').lean();
        r.name = doctor?.displayName || doctor?.name || '';

        processed++;
        let genErr = '';
        // Targeted preview runs process one doctor, so give generation the whole
        // budget; scheduled runs keep the tight cap so a hung call can't starve the batch.
        const perDoctorMs = targeted ? 240000 : PER_DOCTOR_TIMEOUT_MS;
        // ALWAYS generate the current task's content daily — the weekly setting only
        // controls the EMAIL below, never the content generation. So every doctor gets
        // their day's task prepared on the dashboard every day.
        const draft = await withTimeout(generateMissionDraft(doctorId, task.id, { throwOnError: targeted }), perDoctorMs).catch((e) => {
          console.error('[practice-os-daily-tasks] generate timed out/failed:', String(doctorId), e.message);
          genErr = e.message; return null;
        });
        if (!draft) { skipped++; r.ok = false; r.reason = `draft-failed${genErr ? ': ' + genErr : ''}`; dbg({ reason: 'draft-null', day: task.dayNumber, taskId: String(task.id), genErr }); continue; }
        r.draft = true; r.image = !!draft.imageUrl;

        // The EMAIL goes out per the doctor's schedule: daily doctors every day; weekly
        // doctors only on their chosen CuraGo day. Content was generated above regardless.
        const isEmailDay = force || p.scheduleType !== 'weekly' || (typeof p.curagoDay === 'number' && p.curagoDay === istDow);
        if (!isEmailDay) { generated++; r.reason = 'generated (weekly — no email today)'; dbg({ reason: 'generated-no-email', day: task.dayNumber }); continue; }

        if (!doctor?.email) { skipped++; r.ok = false; r.reason = 'no-email'; dbg({ reason: 'no-email' }); continue; }

        // One email PER DAY (IST): the current task re-sends daily until completed.
        const enr = await PracticeOsEnrollment.findOne({ doctorId, frameworkId: fw._id }).select('lastTaskEmailedAt').lean();
        const istDay = (t) => new Date(new Date(t).getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
        if (!force && enr?.lastTaskEmailedAt && istDay(enr.lastTaskEmailedAt) === istDay(Date.now())) { skipped++; r.reason = 'already-emailed-today'; dbg({ reason: 'already-emailed-today', day: task.dayNumber }); continue; }

        const externalUrl = draft.external ? (draft.primaryAction?.url || '') : '';
        const res = await sendDailyTaskEmail({
          email: doctor.email,
          name: draft.doctorName || doctor.displayName || doctor.name,
          dayNumber: task.dayNumber,
          taskTitle: draft.title,
          contentMarkdown: draft.content,
          imageUrl: draft.imageUrl,
          imagePrompt: draft.imagePrompt,
          external: draft.external,
          externalLabel: EXTERNAL_LABEL[draft.primaryAction?.type] || 'the platform',
          externalUrl,
          publishUrl: `${appUrl}/p/publish/${signActionToken({ doctorId, missionId: task.id, action: 'publish' })}`,
          editUrl: `${appUrl}/p/edit/${signActionToken({ doctorId, missionId: task.id, action: 'edit' })}`,
        });
        if (!res.success) { skipped++; r.ok = false; r.reason = 'email-send-failed'; dbg({ reason: 'email-send-failed', day: task.dayNumber, error: res.error || '' }); continue; }

        await PracticeOsEnrollment.updateOne(
          { doctorId, frameworkId: fw._id },
          { $set: { lastTaskEmailedMissionId: task.id, lastTaskEmailedAt: new Date() } },
        );
        emailed++;
        r.email = true; r.reason = draft.imageUrl ? 'emailed' : 'emailed (no image)';
        dbg({ reason: 'emailed', day: task.dayNumber, to: doctor.email, hasImage: !!draft.imageUrl, external: draft.external });
      } catch (e) {
        console.error('[practice-os-daily-tasks] doctor failed:', String(doctorId), e.message);
        dbg({ reason: 'exception', error: e.message });
        skipped++; r.ok = false; r.reason = `exception: ${e.message}`;
      } finally {
        results.push(r);
      }
    }
    // Record this run for the admin Jobs log.
    try {
      const CronRunLog = (await import('@/models/practice-os/CronRunLog')).default;
      await CronRunLog.create({
        job: 'practice-os-daily-tasks', startedAt: runStartedAt, finishedAt: new Date(), durationMs: Date.now() - startedAt,
        ok: true, counts: { candidates: profiles.length, emailed, generated, skipped, noTask, capped }, results,
      });
    } catch { /* best-effort */ }
    return NextResponse.json({ success: true, granted: profiles.length, emailed, generated, skipped, noTask, capped, ...(targeted ? { debug } : {}) });
  } catch (error) {
    console.error('[practice-os-daily-tasks]', error);
    try {
      const CronRunLog = (await import('@/models/practice-os/CronRunLog')).default;
      await CronRunLog.create({ job: 'practice-os-daily-tasks', startedAt: runStartedAt, finishedAt: new Date(), ok: false, error: error.message || 'Cron failed', results });
    } catch { /* best-effort */ }
    return NextResponse.json({ success: false, error: error.message || 'Cron failed' }, { status: 500 });
  }
}

export async function POST(request) { return GET(request); }
