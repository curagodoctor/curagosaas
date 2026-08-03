import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { isDevPaymentBypass } from '@/lib/practice-os/access';
import { grantPracticeOsAccess } from '@/lib/practice-os/grant';

export const runtime = 'nodejs';

// POST /api/practice-os/purchase/dev-grant
// LOCAL DEV ONLY — unlocks Practice OS without payment. Hard-guarded: returns 404
// unless NODE_ENV !== 'production' AND PRACTICE_OS_DEV_BYPASS=true.
export async function POST(request) {
  try {
    if (!isDevPaymentBypass()) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    const doctor = await requireDoctorAuth(request);
    await connectDB();
    const { packId } = await request.json().catch(() => ({}));
    if (!packId) return NextResponse.json({ success: false, error: 'Missing pack' }, { status: 400 });
    await grantPracticeOsAccess(doctor._id, packId, {
      paymentId: `dev_${doctor._id}_${packId}_${Date.now()}`,
      amountInInr: 0,
    });
    return NextResponse.json({ success: true, practiceOsActive: true, dev: true, packId: String(packId) });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[Practice OS dev-grant]', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
