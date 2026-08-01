import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';
import Doctor from '@/models/Doctor';
import PracticeOsEnrollment from '@/models/practice-os/PracticeOsEnrollment';
import UserMissionProgress from '@/models/practice-os/UserMissionProgress';
import PerformanceScore from '@/models/practice-os/PerformanceScore';
import Mission from '@/models/practice-os/Mission';
import KpiEntry from '@/models/practice-os/KpiEntry';
import JourneyTimeline from '@/models/practice-os/JourneyTimeline';

export const runtime = 'nodejs';

// GET /api/platform/practice-os/users/[id] — full per-doctor Practice OS record.
export async function GET(request, { params }) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const { id } = await params;

    const doctor = await Doctor.findById(id)
      .select('name email specialization qualification subdomain phone')
      .lean();
    if (!doctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }

    const [enrollment, progressRaw, performance, kpis, journey] = await Promise.all([
      PracticeOsEnrollment.findOne({ doctorId: id }).lean(),
      UserMissionProgress.find({ doctorId: id }).lean(),
      PerformanceScore.findOne({ doctorId: id }).lean(),
      KpiEntry.find({ doctorId: id }).sort({ recordedAt: 1 }).lean(),
      JourneyTimeline.find({ doctorId: id }).sort({ occurredAt: -1 }).lean(),
    ]);

    // Join progress with mission title/number.
    const missionIds = progressRaw.map((p) => p.missionId).filter(Boolean);
    const missions = await Mission.find({ _id: { $in: missionIds } })
      .select('missionText category missionNumber dayNumber weekNumber estimatedMinutes')
      .lean();
    const missionById = new Map(missions.map((m) => [String(m._id), m]));

    const progress = progressRaw
      .map((p) => {
        const m = missionById.get(String(p.missionId)) || {};
        return {
          _id: String(p._id),
          missionId: String(p.missionId),
          title: m.missionText || m.category || 'Untitled mission',
          missionNumber: m.missionNumber || 0,
          dayNumber: m.dayNumber || 0,
          weekNumber: m.weekNumber || 0,
          estimatedMinutes: m.estimatedMinutes || 0,
          status: p.status,
          actualMinutes: p.actualMinutes || 0,
          completedAt: p.completedAt || null,
          unlockedAt: p.unlockedAt || null,
        };
      })
      .sort((a, b) => a.missionNumber - b.missionNumber);

    return NextResponse.json({
      success: true,
      doctor,
      enrollment: enrollment || null,
      progress,
      performance: performance || null,
      kpis,
      journey,
    });
  } catch (error) {
    console.error('[Practice OS user detail GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load doctor record' }, { status: 500 });
  }
}
