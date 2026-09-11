import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';

export const runtime = 'nodejs';

// POST { profileImage?, clinicPhotos?, localAreas?, relevantLinks? } — persist
// onboarding media/metadata:
//  - profile photo → Doctor.profileImage (used site-wide)
//  - clinic/landscape photos → PracticeOsProfile.variables.clinicPhotos
//  - localAreas (§5b) → PracticeOsProfile.variables.localAreas
//  - relevantLinks (§5e) → PracticeOsProfile.variables.relevantLinks
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { profileImage, clinicPhotos, localAreas, relevantLinks } = await request.json();

    if (typeof profileImage === 'string' && profileImage) {
      await Doctor.updateOne({ _id: doctor._id }, { $set: { profileImage } });
    }
    const set = {};
    if (Array.isArray(clinicPhotos)) set['variables.clinicPhotos'] = clinicPhotos.filter((u) => typeof u === 'string' && u).slice(0, 6);
    if (Array.isArray(localAreas)) set['variables.localAreas'] = localAreas.map((a) => String(a).trim()).filter(Boolean).slice(0, 20);
    if (Array.isArray(relevantLinks)) set['variables.relevantLinks'] = relevantLinks
      .map((l) => ({ label: String(l?.label || '').trim(), url: String(l?.url || '').trim() }))
      .filter((l) => l.url).slice(0, 20);
    if (Object.keys(set).length) {
      await PracticeOsProfile.findOneAndUpdate(
        { doctorId: doctor._id }, { $set: set }, { upsert: true, setDefaultsOnInsert: true },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[onboarding-media]', error);
    return NextResponse.json({ success: false, error: 'Failed to save photos' }, { status: 500 });
  }
}
