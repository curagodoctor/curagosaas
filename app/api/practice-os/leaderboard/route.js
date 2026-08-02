import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import PerformanceScore from '@/models/practice-os/PerformanceScore';
import PracticeOsEnrollment from '@/models/practice-os/PracticeOsEnrollment';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';

export const runtime = 'nodejs';
const DAY = 86400000;

/**
 * GET /api/practice-os/leaderboard — anonymous ranking.
 * points = XP (performance) + longestStreak×10 + speed (progress pace, up to 50).
 * Only doctors who opted in with a username appear. Real names are never exposed.
 */
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();

    const doctors = await Doctor.find({ usernameLower: { $exists: true, $nin: [null, ''] } })
      .select('_id username').lean();
    if (!doctors.length) {
      return NextResponse.json({ success: true, entries: [], total: 0, me: { hasUsername: !!doctor.username } });
    }
    const ids = doctors.map((d) => d._id);

    const [perfs, enrolls] = await Promise.all([
      PerformanceScore.find({ doctorId: { $in: ids } }).lean(),
      PracticeOsEnrollment.find({ doctorId: { $in: ids } }).select('doctorId daysCompleted startedAt').lean(),
    ]);
    const perfById = new Map(perfs.map((p) => [String(p.doctorId), p]));
    const enrById = new Map(enrolls.map((e) => [String(e.doctorId), e]));
    const now = Date.now();

    const rows = doctors.map((d) => {
      const p = perfById.get(String(d._id)) || {};
      const e = enrById.get(String(d._id)) || {};
      const xp = p.overallScore || 0;
      const streak = p.longestStreak || 0;
      const daysCompleted = e.daysCompleted || 0;
      const elapsed = e.startedAt ? Math.max(1, Math.floor((now - new Date(e.startedAt).getTime()) / DAY)) : 1;
      const speedPoints = Math.round(Math.min(2, daysCompleted / elapsed) * 25); // 0–50
      return {
        doctorId: String(d._id), username: d.username,
        xp, streak, daysCompleted, speedPoints,
        points: xp + streak * 10 + speedPoints,
      };
    });

    rows.sort((a, b) => b.points - a.points || b.xp - a.xp || b.streak - a.streak);
    const ranked = rows.map((r, i) => ({ ...r, rank: i + 1, isMe: r.doctorId === String(doctor._id) }));

    const meRow = ranked.find((r) => r.isMe) || null;
    const top = ranked.slice(0, 100);
    if (meRow && !top.some((r) => r.isMe)) top.push(meRow);

    return NextResponse.json({
      success: true,
      total: ranked.length,
      // Strip doctorId — only the anonymous username is exposed.
      entries: top.map(({ doctorId, ...rest }) => rest),
      me: meRow
        ? { hasUsername: true, rank: meRow.rank, points: meRow.points, xp: meRow.xp, streak: meRow.streak }
        : { hasUsername: !!doctor.username },
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[Practice OS leaderboard]', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
