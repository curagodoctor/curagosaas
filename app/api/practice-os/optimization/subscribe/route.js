import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, getPracticeOsRazorpay } from '@/lib/practice-os/access';
import { createOptimizationSubscription } from '@/lib/practice-os/optimizationSubscription';
import OptimizationSubscription from '@/models/practice-os/OptimizationSubscription';

export const runtime = 'nodejs';

// POST — start a ₹5,000/mo optimization subscription. Returns the Razorpay
// subscription id + public key for the client checkout.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { publicKeyId, keyId } = getPracticeOsRazorpay();
    if (!keyId) return NextResponse.json({ success: false, error: 'Payments are not configured yet.' }, { status: 503 });

    const { subscriptionId, planId, status } = await createOptimizationSubscription({
      email: doctor.email, name: doctor.displayName || doctor.name,
    });
    await OptimizationSubscription.findOneAndUpdate(
      { doctorId: doctor._id },
      { $set: { razorpaySubscriptionId: subscriptionId, razorpayPlanId: planId, status: status || 'created' } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    return NextResponse.json({ success: true, subscriptionId, keyId: publicKeyId || keyId });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[optimization subscribe]', error);
    return NextResponse.json({ success: false, error: 'Could not start the subscription.' }, { status: 500 });
  }
}
