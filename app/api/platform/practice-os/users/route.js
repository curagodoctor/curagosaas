import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';
import Doctor from '@/models/Doctor';
import PracticeOsEnrollment from '@/models/practice-os/PracticeOsEnrollment';
import PerformanceScore from '@/models/practice-os/PerformanceScore';

export const runtime = 'nodejs';

// GET /api/platform/practice-os/users — enrollments joined with doctor + performance.
export async function GET() {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const enrollments = await PracticeOsEnrollment.find({}).lean();
    const doctorIds = enrollments.map((e) => e.doctorId).filter(Boolean);

    const [doctors, scores] = await Promise.all([
      Doctor.find({ _id: { $in: doctorIds } })
        .select('name email specialization subdomain')
        .lean(),
      PerformanceScore.find({ doctorId: { $in: doctorIds } })
        .select('doctorId overallScore currentStreak')
        .lean(),
    ]);

    const doctorById = new Map(doctors.map((d) => [String(d._id), d]));
    const scoreByDoctor = new Map(scores.map((s) => [String(s.doctorId), s]));

    const users = enrollments.map((e) => {
      const d = doctorById.get(String(e.doctorId)) || {};
      const s = scoreByDoctor.get(String(e.doctorId)) || {};
      return {
        doctorId: String(e.doctorId),
        name: d.name || '—',
        email: d.email || '',
        specialization: d.specialization || '',
        status: e.status,
        daysCompleted: e.daysCompleted || 0,
        performance: s.overallScore || 0,
        currentStreak: s.currentStreak || 0,
        lastActiveAt: e.lastActiveAt || null,
      };
    });

    users.sort((a, b) => {
      const ta = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
      const tb = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
      return tb - ta;
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('[Practice OS users GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load users' }, { status: 500 });
  }
}
