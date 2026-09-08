import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import PracticeOsSettings from '@/models/practice-os/PracticeOsSettings';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';

export const runtime = 'nodejs';

// GET — the orientation video set (§6) + whether this doctor has already
// acknowledged watching them. Free/setup step, so no pack gate.
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();

    const settings = await PracticeOsSettings.getSettings();
    const videos = (settings.orientationVideos || [])
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const profile = await PracticeOsProfile.findOne({ doctorId: doctor._id }).select('orientationConsent').lean();
    const consent = profile?.orientationConsent || { acknowledgedAt: null, videoCount: 0 };

    return NextResponse.json({ success: true, videos, consent });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[practice-os orientation GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load orientation' }, { status: 500 });
  }
}

// POST — record the acknowledgement/consent. Idempotent; stamps the time and how
// many videos existed at consent time (so a later-added video can re-prompt).
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();

    const settings = await PracticeOsSettings.getSettings();
    const videoCount = (settings.orientationVideos || []).length;

    await PracticeOsProfile.findOneAndUpdate(
      { doctorId: doctor._id },
      { $set: { 'orientationConsent.acknowledgedAt': new Date(), 'orientationConsent.videoCount': videoCount } },
      { upsert: true, setDefaultsOnInsert: true },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[practice-os orientation POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to save acknowledgement' }, { status: 500 });
  }
}
