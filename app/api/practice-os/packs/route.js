import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, isDevPaymentBypass } from '@/lib/practice-os/access';
import { listPacksForDoctor } from '@/lib/practice-os/engine';

export const runtime = 'nodejs';

// GET /api/practice-os/packs — the pack catalog with this doctor's per-pack
// ownership, progress, XP, streak, and next-up. Feeds the pack-selection screen.
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const packs = await listPacksForDoctor(doctor._id);
    return NextResponse.json({ success: true, packs, devBypass: isDevPaymentBypass() });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Practice OS packs]', error);
    return NextResponse.json({ success: false, error: 'Failed to load packs' }, { status: 500 });
  }
}
