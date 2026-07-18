import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import Mission from '@/models/practice-os/Mission';
import Doctor from '@/models/Doctor';
import UserMissionProgress from '@/models/practice-os/UserMissionProgress';

/**
 * POST /api/platform/practice-os/missions/[id]/unlock
 * Manually unlock a mission for a doctor (admin override). Writes a
 * UserMissionProgress record with status 'available' so the doctor can start it
 * regardless of the normal sequential unlock schedule.
 * Body: { doctorEmail } (or { doctorId }).
 */
export async function POST(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    const mission = await Mission.findById(id).select('frameworkId');
    if (!mission) return NextResponse.json({ success: false, error: 'Mission not found' }, { status: 404 });

    // Resolve the doctor by id or email.
    let doctor = null;
    if (body.doctorId) {
      doctor = await Doctor.findById(body.doctorId).select('_id name displayName email');
    } else if (body.doctorEmail) {
      doctor = await Doctor.findOne({ email: body.doctorEmail.trim().toLowerCase() }).select('_id name displayName email');
    }
    if (!doctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found for that email' }, { status: 404 });
    }

    const progress = await UserMissionProgress.findOneAndUpdate(
      { doctorId: doctor._id, missionId: mission._id },
      {
        $set: { status: 'available', unlockedAt: new Date(), manuallyUnlocked: true },
        $setOnInsert: { frameworkId: mission.frameworkId },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      message: `Mission unlocked for ${doctor.displayName || doctor.name || doctor.email}.`,
      progress: { status: progress.status, unlockedAt: progress.unlockedAt },
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Practice OS Manual Unlock]', error);
    return NextResponse.json({ success: false, error: 'Failed to unlock mission' }, { status: 500 });
  }
}
