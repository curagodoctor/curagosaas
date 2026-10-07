import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import connectDB from '@/lib/mongodb';
import CronRunLog from '@/models/practice-os/CronRunLog';

export const runtime = 'nodejs';

// Scheduler/job run log for the admin "Jobs" tab: recent runs with success state,
// counts and per-doctor outcomes (draft/image/email).
export async function GET(request) {
  const { authenticated } = await requirePlatformAdmin();
  if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const jobFilter = new URL(request.url).searchParams.get('job');
  const q = jobFilter ? { job: jobFilter } : {};

  const runs = await CronRunLog.find(q).sort({ createdAt: -1 }).limit(60).lean();

  // Latest run per job (for the status strip at the top).
  const latestByJob = {};
  for (const r of runs) {
    if (!latestByJob[r.job]) latestByJob[r.job] = r;
  }
  const jobs = Object.values(latestByJob).map((r) => ({
    job: r.job, ok: r.ok, at: r.createdAt, counts: r.counts || {}, error: r.error || '',
  }));

  return NextResponse.json({
    success: true,
    jobs,
    runs: runs.map((r) => ({
      id: String(r._id), job: r.job, ok: r.ok, startedAt: r.startedAt, finishedAt: r.finishedAt,
      durationMs: r.durationMs, counts: r.counts || {}, error: r.error || '',
      results: (r.results || []).map((x) => ({
        name: x.name || '(unknown)', draft: x.draft, image: x.image, email: x.email, ok: x.ok, reason: x.reason,
      })),
    })),
  });
}
