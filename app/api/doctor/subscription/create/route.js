import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { createSubscription } from '@/lib/razorpaySubscription';

export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    // Check if already has active paid subscription
    const existing = await Subscription.findOne({ doctorId: doctor._id });
    if (existing?.plan === 'monthly' && existing?.status === 'active') {
      return NextResponse.json({ success: false, error: 'Already have an active subscription' }, { status: 400 });
    }

    // Create Razorpay subscription
    const result = await createSubscription(doctor.email, doctor.displayName || doctor.name);

    // Update subscription record
    if (existing) {
      existing.razorpaySubscriptionId = result.subscriptionId;
      existing.plan = 'monthly';
      existing.status = 'active';
      const now = new Date();
      existing.currentPeriodStart = now;
      existing.currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      await existing.save();
    } else {
      const now = new Date();
      await Subscription.create({
        doctorId: doctor._id,
        plan: 'monthly',
        status: 'active',
        razorpaySubscriptionId: result.subscriptionId,
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
        amount: 1000,
      });
    }

    return NextResponse.json({
      success: true,
      subscriptionId: result.subscriptionId,
      shortUrl: result.shortUrl,
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Subscription Create]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create subscription' }, { status: 500 });
  }
}
