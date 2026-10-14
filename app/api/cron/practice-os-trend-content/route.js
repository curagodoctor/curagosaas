import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { listActiveOptimizationDoctorIds } from '@/lib/practice-os/access';
import { refreshTrendTopicsForDoctor } from '@/lib/practice-os/trendTopics';
import { produceNextTrendTopic } from '@/lib/practice-os/trendContent';
import { nextScheduleSlot } from '@/lib/practice-os/scheduleContent';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';

export const runtime = 'nodejs';
export const maxDuration = 300;

const PER_DOCTOR_TIMEOUT_MS = 120000;
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

// Daily cron: refresh each active doctor's trend topics (weekly data, self-limited
// by the SerpAPI cache + idempotent upserts) and produce ONE queued topic into a
// draft blog via the double-run. Register in vercel.json.
export async function GET(request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const isCron = !cronSecret || authHeader === `Bearer ${cronSecret}`;
    const force = new URL(request.url).searchParams.get('force') === '1';
    if (!isCron && !force) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const activeIds = await listActiveOptimizationDoctorIds();
    const results = [];
    let refreshed = 0, produced = 0;

    for (const doctorId of activeIds) {
      const r = { doctorId, ok: true };
      try {
        const ref = await withTimeout(refreshTrendTopicsForDoctor(doctorId), PER_DOCTOR_TIMEOUT_MS).catch((e) => ({ error: e.message }));
        const added = ref?.added || 0, covered = ref?.covered || 0;
        if (ref && !ref.error) refreshed++;

        // Auto-schedule the generated page onto a future date when the doctor opted in.
        let scheduleAt = null;
        try {
          const prof = await PracticeOsProfile.findOne({ doctorId }).select('contentSchedule').lean();
          if (prof?.contentSchedule?.auto) scheduleAt = await nextScheduleSlot(doctorId, prof.contentSchedule.cadenceDays || 3);
        } catch { /* best-effort */ }

        const prod = await withTimeout(produceNextTrendTopic(doctorId, { scheduleAt }), PER_DOCTOR_TIMEOUT_MS).catch((e) => ({ produced: false, reason: e.message }));
        r.draft = !!prod?.produced; // a page was generated this run
        r.reason = `+${added} new, ${covered} covered` + (prod?.produced ? `, ${prod.scheduledAt ? 'scheduled' : 'drafted'} "${prod.title}"` : ` · produce: ${prod?.reason || 'none'}`);
        if (prod?.produced) produced++;
      } catch (e) {
        r.ok = false; r.reason = `exception: ${e.message}`;
      }
      results.push(r);
    }

    try {
      const CronRunLog = (await import('@/models/practice-os/CronRunLog')).default;
      await CronRunLog.create({ job: 'practice-os-trend-content', total: activeIds.length, counts: { refreshed, produced }, results });
    } catch { /* best-effort */ }

    return NextResponse.json({ success: true, doctors: activeIds.length, refreshed, produced, results });
  } catch (error) {
    console.error('[practice-os-trend-content]', error);
    return NextResponse.json({ success: false, error: 'Cron failed' }, { status: 500 });
  }
}
