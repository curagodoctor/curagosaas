import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import { verifySubscriptionSignature, fetchSubscription } from '@/lib/practice-os/optimizationSubscription';
import OptimizationSubscription from '@/models/practice-os/OptimizationSubscription';

export const runtime = 'nodejs';

// POST — verify the Razorpay subscription checkout callback and activate access.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = await request.json();
    if (!verifySubscriptionSignature({ paymentId: razorpay_payment_id, subscriptionId: razorpay_subscription_id, signature: razorpay_signature })) {
      return NextResponse.json({ success: false, error: 'Payment could not be verified.' }, { status: 400 });
    }
    // Confirm with Razorpay + capture the current period end for gating.
    let currentPeriodEnd = null;
    try { const s = await fetchSubscription(razorpay_subscription_id); if (s.current_end) currentPeriodEnd = new Date(s.current_end * 1000); } catch { /* best effort */ }

    await OptimizationSubscription.findOneAndUpdate(
      { doctorId: doctor._id },
      { $set: { razorpaySubscriptionId: razorpay_subscription_id, status: 'active', currentPeriodEnd } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[optimization verify]', error);
    return NextResponse.json({ success: false, error: 'Verification failed.' }, { status: 500 });
  }
}
