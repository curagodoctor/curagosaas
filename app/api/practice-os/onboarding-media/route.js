import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';

export const runtime = 'nodejs';

// POST { profileImage?, clinicPhotos? } — persist onboarding photos:
//  - profile photo → Doctor.profileImage (used site-wide)
//  - clinic/landscape photos → PracticeOsProfile.variables.clinicPhotos (used
//    when generating the website)
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { profileImage, clinicPhotos } = await request.json();

    if (typeof profileImage === 'string' && profileImage) {
      await Doctor.updateOne({ _id: doctor._id }, { $set: { profileImage } });
    }
    if (Array.isArray(clinicPhotos)) {
      const clean = clinicPhotos.filter((u) => typeof u === 'string' && u).slice(0, 6);
      await PracticeOsProfile.findOneAndUpdate(
        { doctorId: doctor._id },
        { $set: { 'variables.clinicPhotos': clean } },
        { upsert: true, setDefaultsOnInsert: true },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[onboarding-media]', error);
    return NextResponse.json({ success: false, error: 'Failed to save photos' }, { status: 500 });
  }
}
