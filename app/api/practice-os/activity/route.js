import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import UserMissionProgress from '@/models/practice-os/UserMissionProgress';

export const runtime = 'nodejs';

// Day key in IST (doctors are in India), so a completion at 11pm counts for that
// calendar day, not the UTC next day.
function istDay(date) {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
}

// GET — the doctor's activity calendar (§12): a { 'YYYY-MM-DD': count } map of
// days they completed work, plus current + longest active-day streaks. Drives the
// Anki-style streak calendar on the control center.
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();

    const rows = await UserMissionProgress.find({ doctorId: doctor._id, status: 'completed', completedAt: { $ne: null } })
      .select('completedAt').lean();

    const days = {};
    for (const r of rows) {
      const k = istDay(r.completedAt);
      days[k] = (days[k] || 0) + 1;
    }

    // Streaks over the set of active days.
    const activeSet = new Set(Object.keys(days));
    const dayMs = 24 * 60 * 60 * 1000;
    const keyOf = (d) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    // Current streak: walk back from today (or yesterday) while days are active.
    let current = 0;
    let cursor = new Date();
    if (!activeSet.has(keyOf(cursor))) cursor = new Date(cursor.getTime() - dayMs); // allow "not yet today"
    while (activeSet.has(keyOf(cursor))) { current += 1; cursor = new Date(cursor.getTime() - dayMs); }

    // Longest streak across all active days.
    let longest = 0;
    const sorted = [...activeSet].sort();
    let run = 0, prev = null;
    for (const k of sorted) {
      if (prev && (new Date(k) - new Date(prev)) === dayMs) run += 1; else run = 1;
      if (run > longest) longest = run;
      prev = k;
    }

    return NextResponse.json({ success: true, days, current, longest, total: sorted.length });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[activity]', error);
    return NextResponse.json({ success: false, error: 'Failed to load activity' }, { status: 500 });
  }
}
