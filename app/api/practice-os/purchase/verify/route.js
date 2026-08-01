import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { getPracticeOsPriceInr, verifyRazorpaySignature } from '@/lib/practice-os/access';
import { grantPracticeOsAccess } from '@/lib/practice-os/grant';

export const runtime = 'nodejs';

// POST /api/practice-os/purchase/verify
// Verifies a Razorpay payment, records it, and unlocks Practice OS for the doctor.
export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
    if (!razorpay_payment_id) {
      return NextResponse.json({ success: false, error: 'Missing payment id' }, { status: 400 });
    }

    // Strict signature verification — this route is the sole source of truth for
    // unlocking access, so a bad/absent signature must be rejected.
    if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 });
    }

    // Record + unlock + enrol (idempotent; the webhook may also do this).
    await grantPracticeOsAccess(doctor._id, {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id || '',
      signature: razorpay_signature || '',
      amountInInr: await getPracticeOsPriceInr(),
    });

    return NextResponse.json({ success: true, practiceOsActive: true });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Practice OS verify]', error);
    return NextResponse.json({ success: false, error: 'Failed to verify payment' }, { status: 500 });
  }
}
