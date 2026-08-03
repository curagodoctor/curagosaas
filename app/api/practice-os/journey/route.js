import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import JourneyTimeline from '@/models/practice-os/JourneyTimeline';

export const runtime = 'nodejs';

// GET /api/practice-os/journey — the doctor's practice-building timeline (§18).
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const packId = new URL(request.url).searchParams.get('pack');
    const filter = { doctorId: doctor._id, ...(packId ? { frameworkId: packId } : {}) };
    const entries = await JourneyTimeline.find(filter)
      .sort({ occurredAt: -1 })
      .limit(300)
      .lean();
    return NextResponse.json({ success: true, entries });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[Practice OS journey]', error);
    return NextResponse.json({ success: false, error: 'Failed to load journey' }, { status: 500 });
  }
}
