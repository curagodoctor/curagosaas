import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';

export const runtime = 'nodejs';

const WINDOWS = ['morning', 'afternoon', 'evening', 'night'];

// GET / PUT — the doctor's preferred notification window (§14).
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const profile = await PracticeOsProfile.findOne({ doctorId: doctor._id }).select('notificationWindow').lean();
    return NextResponse.json({ success: true, notificationWindow: profile?.notificationWindow || 'evening' });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { notificationWindow } = await request.json();
    if (!WINDOWS.includes(notificationWindow)) {
      return NextResponse.json({ success: false, error: 'Invalid window' }, { status: 400 });
    }
    await PracticeOsProfile.findOneAndUpdate(
      { doctorId: doctor._id },
      { $set: { notificationWindow } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    return NextResponse.json({ success: true, notificationWindow });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 });
  }
}
