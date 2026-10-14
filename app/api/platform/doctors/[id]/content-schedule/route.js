import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import connectDB from '@/lib/mongodb';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';
import BlogArticle from '@/models/BlogArticle';
import { produceNextTrendTopic } from '@/lib/practice-os/trendContent';
import { nextScheduleSlot } from '@/lib/practice-os/scheduleContent';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_BATCH = 3; // cap synchronous AI generations per click

// GET — current auto-schedule setting + how many pages are scheduled/pending.
export async function GET(request, { params }) {
  const { authenticated } = await requirePlatformAdmin();
  if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const prof = await PracticeOsProfile.findOne({ doctorId: id }).select('contentSchedule').lean();
  const scheduled = await BlogArticle.countDocuments({ doctorId: id, status: 'scheduled' });
  return NextResponse.json({ success: true, auto: !!prof?.contentSchedule?.auto, cadenceDays: prof?.contentSchedule?.cadenceDays || 3, scheduledCount: scheduled });
}

// POST — save the setting, or batch-generate+schedule now.
//   { auto, cadenceDays }           → save the toggle/cadence
//   { action:'generate', count }    → write up to MAX_BATCH queued pages now, scheduled
export async function POST(request, { params }) {
  const { authenticated } = await requirePlatformAdmin();
  if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const body = await request.json().catch(() => ({}));

  if (body.action === 'generate') {
    const prof = await PracticeOsProfile.findOne({ doctorId: id }).select('contentSchedule').lean();
    const cadence = prof?.contentSchedule?.cadenceDays || 3;
    const n = Math.max(1, Math.min(MAX_BATCH, Number(body.count) || MAX_BATCH));
    const made = [];
    for (let i = 0; i < n; i++) {
      const scheduleAt = await nextScheduleSlot(id, cadence); // advances as each is scheduled
      const r = await produceNextTrendTopic(id, { scheduleAt }).catch((e) => ({ produced: false, reason: e.message }));
      if (!r?.produced) { made.push({ produced: false, reason: r?.reason }); break; } // stop when the queue is empty / no credits
      made.push({ produced: true, title: r.title, scheduledAt: r.scheduledAt });
    }
    return NextResponse.json({ success: true, generated: made.filter((m) => m.produced).length, results: made });
  }

  const set = {};
  if (typeof body.auto === 'boolean') set['contentSchedule.auto'] = body.auto;
  if (body.cadenceDays != null) set['contentSchedule.cadenceDays'] = Math.max(1, Math.min(30, Number(body.cadenceDays) || 3));
  if (Object.keys(set).length) await PracticeOsProfile.findOneAndUpdate({ doctorId: id }, { $set: set }, { upsert: true, setDefaultsOnInsert: true });
  return NextResponse.json({ success: true });
}
