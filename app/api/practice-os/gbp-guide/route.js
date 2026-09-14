import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import PracticeOsSettings from '@/models/practice-os/PracticeOsSettings';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';
import { DEFAULT_GBP_GUIDE } from '@/lib/practice-os/gbpGuide';

export const runtime = 'nodejs';

// GET — the GBP setup guide (admin override or built-in default) + this doctor's
// task progress and whether they've acknowledged the mandatory suspension block.
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const settings = await PracticeOsSettings.getSettings();
    const blocks = Array.isArray(settings.gbpGuide) && settings.gbpGuide.length ? settings.gbpGuide : DEFAULT_GBP_GUIDE;
    const profile = await PracticeOsProfile.findOne({ doctorId: doctor._id }).select('gbpProgress gbpRiskAcknowledgedAt').lean();
    return NextResponse.json({
      success: true,
      blocks,
      progress: profile?.gbpProgress || {},
      riskAcknowledged: !!profile?.gbpRiskAcknowledgedAt,
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[gbp-guide GET]', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

// POST { progress?, riskAcknowledged? } — persist task ticks + the risk consent.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { progress, riskAcknowledged } = await request.json();
    const set = {};
    if (progress && typeof progress === 'object') set.gbpProgress = progress;
    if (riskAcknowledged) set.gbpRiskAcknowledgedAt = new Date();
    if (Object.keys(set).length) {
      await PracticeOsProfile.findOneAndUpdate(
        { doctorId: doctor._id }, { $set: set }, { upsert: true, setDefaultsOnInsert: true },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[gbp-guide POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 });
  }
}
