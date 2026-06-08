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

    if (sub.plan === 'trial') {
      // Cancel trial immediately
      sub.status = 'cancelled';
      sub.cancelledAt = new Date();
      await sub.save();
      return NextResponse.json({ success: true, message: 'Trial cancelled' });
    }

    if (sub.razorpaySubscriptionId) {
      await cancelSubscription(sub.razorpaySubscriptionId);
    }

    sub.status = 'cancelled';
    sub.cancelledAt = new Date();
    await sub.save();

    return NextResponse.json({ success: true, message: 'Subscription cancelled. Access continues until end of billing period.' });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Subscription Cancel]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to cancel' }, { status: 500 });
  }
}
