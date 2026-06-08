import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { cancelSubscription } from '@/lib/razorpaySubscription';

export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const sub = await Subscription.findOne({ doctorId: doctor._id });
    if (!sub) {
      return NextResponse.json({ success: false, error: 'No subscription found' }, { status: 404 });
    }

    if (sub.status === 'cancelled') {
      return NextResponse.json({ success: false, error: 'Subscription is already cancelled' }, { status: 400 });
    }

    // Try to cancel on Razorpay if there's a subscription ID
    if (sub.razorpaySubscriptionId) {
      try {
        await cancelSubscription(sub.razorpaySubscriptionId);
      } catch (razorpayError) {
        // If Razorpay cancel fails (e.g., no billing cycle, already cancelled),
        // still cancel in our DB — the subscription was never paid anyway
        console.warn('[Subscription Cancel] Razorpay cancel failed:', razorpayError.message);
      }
    }

    sub.status = 'cancelled';
    sub.cancelledAt = new Date();
    sub.plan = sub.plan === 'monthly' ? 'monthly' : 'trial'; // Keep original plan type
    await sub.save();

    return NextResponse.json({ success: true, message: 'Subscription cancelled.' });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Subscription Cancel]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to cancel' }, { status: 500 });
  }
}
