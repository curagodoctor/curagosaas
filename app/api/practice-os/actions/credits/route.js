import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, hasAiAccess } from '@/lib/practice-os/access';
import { getRemainingCredits } from '@/lib/practice-os/aiCredits';

export const runtime = 'nodejs';

// GET — the doctor's AI tier + today's remaining credit balance, for the AI builder.
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const access = await hasAiAccess(doctor._id);
    const remaining = access ? await getRemainingCredits(doctor._id) : 0;
    return NextResponse.json({ success: true, access, remaining });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
