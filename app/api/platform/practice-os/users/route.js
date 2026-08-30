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

    // One row PER DOCTOR (not per enrollment) — a doctor with several packs used
    // to appear multiple times. Aggregate their packs; per-pack detail lives in
    // the doctor's record view.
    const byDoctor = new Map();
    for (const e of enrollments) {
      const k = String(e.doctorId);
      if (!k) continue;
      const cur = byDoctor.get(k) || { packCount: 0, daysCompleted: 0, statuses: [], lastActiveAt: null };
      cur.packCount += 1;
      cur.daysCompleted += e.daysCompleted || 0;
      cur.statuses.push(e.status);
      const la = e.lastActiveAt ? new Date(e.lastActiveAt).getTime() : 0;
      if (la > (cur.lastActiveAt ? new Date(cur.lastActiveAt).getTime() : 0)) cur.lastActiveAt = e.lastActiveAt;
      byDoctor.set(k, cur);
    }

    const users = [...byDoctor.entries()].map(([doctorId, agg]) => {
      const d = doctorById.get(doctorId) || {};
      const s = scoreByDoctor.get(doctorId) || {};
      const status = agg.statuses.includes('active') ? 'active'
        : agg.statuses.every((x) => x === 'completed') ? 'completed'
        : (agg.statuses[0] || 'active');
      return {
        doctorId,
        name: d.name || '—',
        email: d.email || '',
        specialization: d.specialization || '',
        packCount: agg.packCount,
        status,
        daysCompleted: agg.daysCompleted,
        performance: s.overallScore || 0,
        currentStreak: s.currentStreak || 0,
        lastActiveAt: agg.lastActiveAt,
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
