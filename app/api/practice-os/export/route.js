import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';
import PracticeOsEnrollment from '@/models/practice-os/PracticeOsEnrollment';
import UserMissionProgress from '@/models/practice-os/UserMissionProgress';
import VisibilityScore from '@/models/practice-os/VisibilityScore';
import PerformanceScore from '@/models/practice-os/PerformanceScore';
import KpiEntry from '@/models/practice-os/KpiEntry';
import JourneyTimeline from '@/models/practice-os/JourneyTimeline';
import PracticeOsDocument from '@/models/practice-os/PracticeOsDocument';

export const runtime = 'nodejs';

// GET /api/practice-os/export — download the doctor's full Practice OS data
// (progress, scores, KPIs, journey, workspace docs, profile) as a JSON backup.
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const id = doctor._id;

    const [profile, enrollments, progress, visibility, performance, kpis, journey, documents] = await Promise.all([
      PracticeOsProfile.findOne({ doctorId: id }).lean(),
      PracticeOsEnrollment.find({ doctorId: id }).lean(),
      UserMissionProgress.find({ doctorId: id }).lean(),
      VisibilityScore.find({ doctorId: id }).lean(),
      PerformanceScore.find({ doctorId: id }).lean(),
      KpiEntry.find({ doctorId: id }).sort({ recordedAt: 1 }).lean(),
      JourneyTimeline.find({ doctorId: id }).sort({ occurredAt: 1 }).lean(),
      PracticeOsDocument.find({ doctorId: id }).sort({ updatedAt: -1 }).lean(),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      doctor: { name: doctor.displayName || doctor.name, email: doctor.email },
      profile: profile ? { intent: profile.intent, summary: profile.credentials?.summary, variables: profile.variables, fields: profile.credentials?.extracted } : null,
      enrollments,
      progress,
      visibilityScores: visibility,
      performanceScores: performance,
      kpis,
      journey,
      documents,
    };

    const date = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="practice-os-backup-${date}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return new Response('Unauthorized', { status: 401 });
    if (error.message === 'PaymentRequired') return new Response('PaymentRequired', { status: 402 });
    console.error('[Practice OS export]', error);
    return new Response('Export failed', { status: 500 });
  }
}
