import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';

export const runtime = 'nodejs';

const RE = /^[a-zA-Z0-9_]{3,20}$/; // 3–20 chars, letters/numbers/underscore

// GET /api/practice-os/username — the doctor's current leaderboard name.
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    return NextResponse.json({ success: true, username: doctor.username || '' });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/practice-os/username — { username } → set a unique leaderboard name.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { username } = await request.json();
    const name = String(username || '').trim();

    if (!RE.test(name)) {
      return NextResponse.json({ success: false, error: '3–20 letters, numbers or underscore.' }, { status: 400 });
    }
    const lower = name.toLowerCase();

    // Taken by someone else?
    const clash = await Doctor.findOne({ usernameLower: lower, _id: { $ne: doctor._id } }).select('_id').lean();
    if (clash) {
      return NextResponse.json({ success: false, error: 'That name is taken — try another.' }, { status: 409 });
    }

    await Doctor.updateOne({ _id: doctor._id }, { $set: { username: name, usernameLower: lower } });
    return NextResponse.json({ success: true, username: name });
  } catch (error) {
    // Unique-index race → treat as taken.
    if (error?.code === 11000) {
      return NextResponse.json({ success: false, error: 'That name is taken — try another.' }, { status: 409 });
    }
    return errorResponse(error);
  }
}

function errorResponse(error) {
  if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
  console.error('[Practice OS username]', error);
  return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
}
