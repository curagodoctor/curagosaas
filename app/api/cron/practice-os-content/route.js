import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BlogArticle from '@/models/BlogArticle';
import { isAiConfigured } from '@/lib/practice-os/ai';
import { listActiveOptimizationDoctorIds } from '@/lib/practice-os/access';
import { generateNextPage } from '@/lib/practice-os/contentGen';

export const runtime = 'nodejs';
export const maxDuration = 300;

// GET /api/cron/practice-os-content — §7 overnight job. For each doctor with
// optimization access granted, pre-generate their next education page (draft) so
// it's waiting for review at login. Not user-initiated, so it does NOT charge the
// doctor's credits. Skips doctors who already have a backlog of drafts, and caps
// how many it processes per run to stay within the function time limit.
const MAX_PER_RUN = parseInt(process.env.PRACTICE_OS_CONTENT_MAX_PER_RUN, 10) > 0
  ? parseInt(process.env.PRACTICE_OS_CONTENT_MAX_PER_RUN, 10) : 4;
const BACKLOG_CAP = 3; // don't generate more if this many drafts already await review
const TIME_BUDGET_MS = 260000;       // return cleanly before the 300s wall
const PER_DOCTOR_TIMEOUT_MS = 90000; // one slow page gen must not eat the whole run
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
    // Only doctors with working DOS access (unexpired grant or active subscription).
    const profiles = (await listActiveOptimizationDoctorIds()).map((id) => ({ doctorId: id }));

    const startedAt = Date.now();
    let created = 0, skipped = 0, done = 0, capped = false;
    let processed = 0;
    for (const p of profiles) {
      if (processed >= MAX_PER_RUN) { capped = true; break; }
      if (Date.now() - startedAt > TIME_BUDGET_MS) { capped = true; break; } // return before the 300s kill
      const doctorId = p.doctorId;
      try {
        const backlog = await BlogArticle.countDocuments({ doctorId, status: 'draft' });
        if (backlog >= BACKLOG_CAP) { skipped++; continue; }
        processed++;
        const r = await withTimeout(generateNextPage(doctorId, { charge: false }), PER_DOCTOR_TIMEOUT_MS);
        if (r.created) created++;
        else if (r.done) done++;
        else skipped++;
      } catch (e) {
        console.error('[practice-os-content] doctor failed:', String(doctorId), e.message);
        skipped++;
      }
    }
    return NextResponse.json({ success: true, granted: profiles.length, created, done, skipped, capped });
  } catch (error) {
    console.error('[practice-os-content]', error);
    return NextResponse.json({ success: false, error: error.message || 'Cron failed' }, { status: 500 });
  }
}

export async function POST(request) { return GET(request); }
