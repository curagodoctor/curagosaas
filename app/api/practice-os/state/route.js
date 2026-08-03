import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, isDevPaymentBypass } from '@/lib/practice-os/access';
import { computeState } from '@/lib/practice-os/engine';

// GET /api/practice-os/state?pack=<frameworkId> — one pack's Day-view feed.
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const packId = new URL(request.url).searchParams.get('pack');
    if (!packId) {
      return NextResponse.json({ success: false, error: 'Missing pack' }, { status: 400 });
    }
    const state = await computeState(doctor._id, packId);
    return NextResponse.json({ success: true, ...state, devBypass: isDevPaymentBypass() });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'PaymentRequired') {
      return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    }
    if (error.message === 'Pack not found') {
      return NextResponse.json({ success: false, error: 'Pack not found' }, { status: 404 });
    }
    console.error('[Practice OS state]', error);
    return NextResponse.json({ success: false, error: 'Failed to load state' }, { status: 500 });
  }
}
