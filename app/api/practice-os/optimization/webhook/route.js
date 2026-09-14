import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyWebhookSignature } from '@/lib/practice-os/optimizationSubscription';
import OptimizationSubscription from '@/models/practice-os/OptimizationSubscription';

export const runtime = 'nodejs';

// POST — Razorpay subscription webhook. Keeps OptimizationSubscription.status +
// currentPeriodEnd in sync so access stays correct across renewals/cancellations.
// Configure this URL + secret in the Razorpay dashboard (subscription events).
export async function POST(request) {
  try {
    const raw = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';
    if (!verifyWebhookSignature(raw, signature)) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }
    const event = JSON.parse(raw);
    const sub = event?.payload?.subscription?.entity;
    if (!sub?.id) return NextResponse.json({ success: true, ignored: true });

    await connectDB();
    // Map Razorpay subscription status → our status; active/authenticated/charged = live.
    const rawStatus = sub.status || '';
    const activeStates = ['active', 'authenticated'];
    const endedStates = ['cancelled', 'completed', 'expired', 'halted'];
    let status = rawStatus;
    if (event.event === 'subscription.charged') status = 'active';
    else if (endedStates.includes(rawStatus)) status = rawStatus;
    else if (activeStates.includes(rawStatus)) status = 'active';

    const set = { status };
    if (sub.current_end) set.currentPeriodEnd = new Date(sub.current_end * 1000);

    await OptimizationSubscription.findOneAndUpdate(
      { razorpaySubscriptionId: sub.id }, { $set: set },
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[optimization webhook]', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
