import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Newsletter from '@/models/Newsletter';
import { sendNewsletter } from '@/lib/newsletter/send';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Runs on a schedule (see vercel.json). Sends any newsletter whose scheduledFor
// has passed. Precision is to the cron interval (hourly) — a newsletter scheduled
// for 2:30pm goes out on the next top-of-hour run.
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const now = new Date();

    const due = await Newsletter.find({ status: 'scheduled', scheduledFor: { $lte: now } }).select('_id subject').lean();
    const results = [];

    for (const d of due) {
      // Atomically claim so overlapping cron runs can't double-send.
      const claimed = await Newsletter.findOneAndUpdate(
        { _id: d._id, status: 'scheduled' },
        { $set: { status: 'sending' } },
        { new: true }
      );
      if (!claimed) continue;

      try {
        const stats = await sendNewsletter(claimed);
        await Newsletter.updateOne({ _id: d._id }, { $set: { status: 'sent', sentAt: new Date(), stats } });
        results.push({ id: String(d._id), subject: d.subject, ...stats });
      } catch (e) {
        // Revert to scheduled so the next run retries.
        await Newsletter.updateOne({ _id: d._id }, { $set: { status: 'scheduled' } });
        console.error('[newsletter-scheduler send]', d._id, e?.message);
        results.push({ id: String(d._id), subject: d.subject, error: true });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error('[newsletter-scheduler]', error);
    return NextResponse.json({ success: false, error: 'Scheduler failed' }, { status: 500 });
  }
}
