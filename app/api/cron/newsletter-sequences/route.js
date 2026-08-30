import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { runAllSequences } from '@/lib/newsletter/sequence';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Daily: enroll new audience contacts into enabled sequences, then send any due
// steps. On Vercel Hobby crons run once per day, so gaps are in whole days.
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const results = await runAllSequences();
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('[newsletter-sequences]', error);
    return NextResponse.json({ success: false, error: 'Sequence run failed' }, { status: 500 });
  }
}
