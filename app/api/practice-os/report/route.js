import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import { getOrCreateEnrollment, getOrCreateScore } from '@/lib/practice-os/engine';
import { getOrCreateProfile } from '@/lib/practice-os/profile';
import Mission from '@/models/practice-os/Mission';
import UserMissionProgress from '@/models/practice-os/UserMissionProgress';
import PerformanceScore from '@/models/practice-os/PerformanceScore';
import KpiEntry from '@/models/practice-os/KpiEntry';
import Achievement from '@/models/practice-os/Achievement';
import { SCORE_WEIGHTS, SCORE_LABELS } from '@/models/practice-os/VisibilityScore';

export const runtime = 'nodejs';

// GET /api/practice-os/report — the doctor's Month/Progress report (PRD §20, §23).
// A ledger of real work done, quoted back against their day-0 six-month goal.
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();

    const packId = new URL(request.url).searchParams.get('pack');
    if (!packId) return NextResponse.json({ success: false, error: 'Missing pack' }, { status: 400 });

    const enr = await getOrCreateEnrollment(doctor._id, packId);
    const [score, profile] = await Promise.all([
      getOrCreateScore(doctor._id, packId),
      getOrCreateProfile(doctor._id),
    ]);
    const frameworkId = enr.frameworkId;

    const [progresses, perf, kpiRows, achRows, totalDays] = await Promise.all([
      UserMissionProgress.find({ doctorId: doctor._id, frameworkId, status: 'completed' }).lean(),
      PerformanceScore.findOne({ doctorId: doctor._id, frameworkId }).lean(),
      KpiEntry.find({ doctorId: doctor._id, frameworkId }).sort({ recordedAt: 1 }).lean(),
      Achievement.find({ doctorId: doctor._id, frameworkId }).sort({ awardedAt: -1 }).lean(),
      Mission.countDocuments({ frameworkId, status: 'published' }),
    ]);

    // Time invested — sum of actual minutes across completed days (never penalise long).
    const timeInvestedMinutes = (progresses || []).reduce(
      (sum, p) => sum + (Number(p.actualMinutes) || 0),
      0
    );

    // KPI deltas — first value, latest value, and the movement per metric.
    const kpiByKey = new Map();
    for (const r of kpiRows || []) {
      if (!kpiByKey.has(r.key)) {
        kpiByKey.set(r.key, {
          key: r.key,
          label: r.label || r.key,
          unit: r.unit || '',
          first: r.value,
          latest: r.value,
          count: 0,
        });
      }
      const e = kpiByKey.get(r.key);
      e.latest = r.value; // rows are sorted ascending by recordedAt, so last wins.
      e.count += 1;
    }
    const kpis = Array.from(kpiByKey.values()).map((e) => ({
      ...e,
      delta: e.latest - e.first,
    }));

    // Achievements — count + a few recent titles.
    const achievements = {
      count: (achRows || []).length,
      recent: (achRows || []).slice(0, 8).map((a) => ({
        title: a.title,
        type: a.type,
        awardedAt: a.awardedAt,
      })),
    };

    const visibilityScore = {
      total: score.total || 0,
      components: Object.keys(SCORE_WEIGHTS).map((key) => ({
        key,
        label: SCORE_LABELS[key],
        value: score.components?.[key] || 0,
        weight: SCORE_WEIGHTS[key],
      })),
    };

    const performance = perf
      ? {
          overall: perf.overallScore || 0,
          execution: perf.executionScore || 0,
          consistency: perf.consistencyScore || 0,
          learning: perf.learningScore || 0,
          currentStreak: perf.currentStreak || 0,
          longestStreak: perf.longestStreak || 0,
        }
      : {
          overall: 0, execution: 0, consistency: 0, learning: 0,
          currentStreak: 0, longestStreak: 0,
        };

    return NextResponse.json({
      success: true,
      report: {
        daysCompleted: enr.daysCompleted || 0,
        totalDays: totalDays || 0,
        timeInvestedMinutes,
        performance,
        visibilityScore,
        kpis,
        achievements,
        intentSixMonths: profile.intent?.sixMonths || '',
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[Practice OS report]', error);
    return NextResponse.json({ success: false, error: 'Failed to load report' }, { status: 500 });
  }
}
