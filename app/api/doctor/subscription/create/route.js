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

    // Create Razorpay subscription (this only creates the checkout link, NOT the payment)
    const result = await createSubscription(doctor.email, doctor.displayName || doctor.name);

    // Save the Razorpay subscription ID but keep status as pending
    // Actual activation happens via webhook when payment is confirmed
    if (existing) {
      existing.razorpaySubscriptionId = result.subscriptionId;
      // Don't change plan/status yet — wait for webhook confirmation
      await existing.save();
    } else {
      await Subscription.create({
        doctorId: doctor._id,
        plan: 'trial', // Keep as trial until payment confirmed
        status: 'active',
        razorpaySubscriptionId: result.subscriptionId,
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
