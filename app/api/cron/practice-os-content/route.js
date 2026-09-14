import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';
import BlogArticle from '@/models/BlogArticle';
import { isAiConfigured } from '@/lib/practice-os/ai';
import { generateNextPage } from '@/lib/practice-os/contentGen';

export const runtime = 'nodejs';
export const maxDuration = 60;

// GET /api/cron/practice-os-content — §7 overnight job. For each doctor with
// optimization access granted, pre-generate their next education page (draft) so
// it's waiting for review at login. Not user-initiated, so it does NOT charge the
// doctor's credits. Skips doctors who already have a backlog of drafts, and caps
// how many it processes per run to stay within the function time limit.
const MAX_PER_RUN = parseInt(process.env.PRACTICE_OS_CONTENT_MAX_PER_RUN, 10) > 0
  ? parseInt(process.env.PRACTICE_OS_CONTENT_MAX_PER_RUN, 10) : 8;
const BACKLOG_CAP = 3; // don't generate more if this many drafts already await review

export async function GET(request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAiConfigured()) return NextResponse.json({ success: true, skipped: 'ai-not-configured' });

    await connectDB();
    const profiles = await PracticeOsProfile.find({ 'optimizationAccess.granted': true }).select('doctorId').lean();

    let created = 0, skipped = 0, done = 0, capped = false;
    let processed = 0;
    for (const p of profiles) {
      if (processed >= MAX_PER_RUN) { capped = true; break; }
      const doctorId = p.doctorId;
      try {
        const backlog = await BlogArticle.countDocuments({ doctorId, status: 'draft' });
        if (backlog >= BACKLOG_CAP) { skipped++; continue; }
        processed++;
        const r = await generateNextPage(doctorId, { charge: false });
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
