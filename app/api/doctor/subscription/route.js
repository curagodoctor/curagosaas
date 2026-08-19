import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { hasActiveEntitlement } from '@/lib/entitlements';
import { hasActivePracticeBuilder } from '@/lib/practice-os/access';

export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const subscription = await Subscription.getOrCreateTrial(doctor._id);
    // isActive reflects the FULL entitlement: an active subscription OR an
    // in-progress paid Practice Builder pack (bundle). This is what the UI reads
    // to decide whether to show "trial expired / subscribe".
    const isActive = await hasActiveEntitlement(doctor._id);
    const viaPracticeBuilder = !(await Subscription.isActive(doctor._id)) && await hasActivePracticeBuilder(doctor._id);
    const daysRemaining = subscription.getDaysRemaining();

    return NextResponse.json({
      success: true,
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        isActive,
        viaPracticeBuilder,
        daysRemaining,
        trialStartDate: subscription.trialStartDate,
        trialEndDate: subscription.trialEndDate,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        amount: subscription.amount,
        cancelledAt: subscription.cancelledAt,
        razorpaySubscriptionId: subscription.razorpaySubscriptionId,
        promoCode: subscription.promoCode,
        premiumUnlockedAt: subscription.premiumUnlockedAt,
      },
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Subscription GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch subscription' }, { status: 500 });
  }
}
