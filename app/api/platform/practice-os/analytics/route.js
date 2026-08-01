import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';
import Doctor from '@/models/Doctor';
import PracticeOsEnrollment from '@/models/practice-os/PracticeOsEnrollment';
import UserMissionProgress from '@/models/practice-os/UserMissionProgress';
import PerformanceScore from '@/models/practice-os/PerformanceScore';
import Mission from '@/models/practice-os/Mission';
import AiCreditLedger from '@/models/practice-os/AiCreditLedger';

export const runtime = 'nodejs';

const round1 = (n) => Math.round((n || 0) * 10) / 10;
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

// GET /api/platform/practice-os/analytics — aggregate Practice OS metrics.
export async function GET() {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const [enrollments, progress, scores, missions, ledgers] = await Promise.all([
      PracticeOsEnrollment.find({}).lean(),
      UserMissionProgress.find({}).lean(),
      PerformanceScore.find({}).lean(),
      Mission.find({}).lean(),
      AiCreditLedger.find({}).lean(),
    ]);

    // ---- Enrollment headline counts ----
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const totalEnrolled = enrollments.length;
    const activeUsers = enrollments.filter(
      (e) => e.lastActiveAt && new Date(e.lastActiveAt).getTime() >= sevenDaysAgo
    ).length;
    const setupPending = enrollments.filter((e) => e.status === 'setup_pending').length;
    const completed = enrollments.filter((e) => e.status === 'completed').length;

    const avgDaysCompleted = round1(avg(enrollments.map((e) => e.daysCompleted || 0)));
    const avgPerformance = round1(avg(scores.map((s) => s.overallScore || 0)));
    const avgStreak = round1(avg(scores.map((s) => s.currentStreak || 0)));

    const completedProgress = progress.filter((p) => p.status === 'completed');
    const completionMinutes = completedProgress
      .map((p) => p.actualMinutes || 0)
      .filter((m) => m > 0);
    const avgCompletionMinutes = round1(avg(completionMinutes));

    // ---- Mission lookup ----
    const missionById = new Map(missions.map((m) => [String(m._id), m]));

    // ---- Completion / skip per mission ----
    const perMission = new Map(); // missionId -> { completed, skipped }
    for (const p of progress) {
      const id = String(p.missionId);
      if (!perMission.has(id)) perMission.set(id, { completed: 0, skipped: 0 });
      const rec = perMission.get(id);
      if (p.status === 'completed') rec.completed += 1;
      else if (p.status === 'skipped') rec.skipped += 1;
    }

    const missionStats = [...perMission.entries()].map(([missionId, s]) => {
      const m = missionById.get(missionId);
      return {
        missionId,
        title: m?.missionText || m?.category || 'Untitled mission',
        category: m?.category || '',
        missionNumber: m?.missionNumber || 0,
        completed: s.completed,
        skipped: s.skipped,
      };
    });

    const completionByMission = [...missionStats]
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 10);

    const mostSkipped = [...missionStats]
      .filter((m) => m.skipped > 0)
      .sort((a, b) => b.skipped - a.skipped)
      .slice(0, 10)
      .map((m) => ({ title: m.title, skipped: m.skipped }));

    // ---- Drop-off: where doctors are currently stuck (by current day number) ----
    const dropOffMap = new Map(); // dayNumber -> count
    for (const e of enrollments) {
      if (e.status === 'completed') continue;
      const day = e.currentDayNumber || 1;
      dropOffMap.set(day, (dropOffMap.get(day) || 0) + 1);
    }
    const dropOff = [...dropOffMap.entries()]
      .map(([missionNumber, count]) => ({ missionNumber, count }))
      .sort((a, b) => b.count - a.count);

    // ---- AI usage ----
    let aiPrompts = 0;
    let aiDoctors = 0;
    for (const l of ledgers) {
      const used = Array.isArray(l.usage) ? l.usage.length : 0;
      aiPrompts += used;
      if (used > 0) aiDoctors += 1;
    }

    // ---- Specialty progress (avg daysCompleted grouped by Doctor.specialization) ----
    const doctorIds = enrollments.map((e) => e.doctorId).filter(Boolean);
    const doctors = await Doctor.find({ _id: { $in: doctorIds } })
      .select('specialization')
      .lean();
    const specById = new Map(doctors.map((d) => [String(d._id), d.specialization || 'Unspecified']));

    const specGroups = new Map(); // specialization -> [daysCompleted]
    for (const e of enrollments) {
      const spec = specById.get(String(e.doctorId)) || 'Unspecified';
      if (!specGroups.has(spec)) specGroups.set(spec, []);
      specGroups.get(spec).push(e.daysCompleted || 0);
    }
    const specialtyProgress = [...specGroups.entries()]
      .map(([specialization, days]) => ({
        specialization,
        doctors: days.length,
        avgDaysCompleted: round1(avg(days)),
      }))
      .sort((a, b) => b.avgDaysCompleted - a.avgDaysCompleted);

    return NextResponse.json({
      success: true,
      analytics: {
        totalEnrolled,
        activeUsers,
        setupPending,
        completed,
        avgDaysCompleted,
        avgPerformance,
        avgStreak,
        avgCompletionMinutes,
        completionByMission,
        mostSkipped,
        dropOff,
        aiUsage: { prompts: aiPrompts, doctors: aiDoctors },
        specialtyProgress,
      },
    });
  } catch (error) {
    console.error('[Practice OS analytics GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load analytics' }, { status: 500 });
  }
}
