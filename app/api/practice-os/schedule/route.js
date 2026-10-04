import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import { getOrCreateProfile } from '@/lib/practice-os/profile';

export const runtime = 'nodejs';

// The doctor's notification cadence (set after payment):
//   daily  → a notification every day
//   weekly → only on their chosen "CuraGo day" (0=Sun … 6=Sat)

export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const profile = await getOrCreateProfile(doctor._id);
    return NextResponse.json({
      success: true,
      scheduleType: profile.scheduleType || 'daily',
      curagoDay: typeof profile.curagoDay === 'number' ? profile.curagoDay : null,
      scheduleChosen: !!profile.scheduleChosen,
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const scheduleType = body.scheduleType === 'weekly' ? 'weekly' : 'daily';
    let curagoDay = null;
    if (scheduleType === 'weekly') {
      const d = Number(body.curagoDay);
      if (!Number.isInteger(d) || d < 0 || d > 6) {
        return NextResponse.json({ success: false, error: 'Pick a CuraGo day (0–6).' }, { status: 400 });
      }
      curagoDay = d;
    }
    const profile = await getOrCreateProfile(doctor._id);
    profile.scheduleType = scheduleType;
    profile.curagoDay = curagoDay;
    profile.scheduleChosen = true;
    await profile.save();
    return NextResponse.json({ success: true, scheduleType, curagoDay, scheduleChosen: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[practice-os schedule]', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
