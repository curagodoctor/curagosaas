import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { verifyWebhookSignature } from '@/lib/razorpaySubscription';

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // Verify signature if webhook secret is configured
    if (process.env.RAZORPAY_WEBHOOK_SECRET && signature) {
      const isValid = verifyWebhookSignature(body, signature);
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    const payload = event.payload?.subscription?.entity;

    if (!payload) {
      return NextResponse.json({ success: true, message: 'No subscription payload' });
    }

    await connectDB();

    const subscriptionId = payload.id;
    const sub = await Subscription.findOne({ razorpaySubscriptionId: subscriptionId });

    if (!sub) {
      console.warn(`[Razorpay Webhook] No subscription found for ${subscriptionId}`);
      return NextResponse.json({ success: true, message: 'Subscription not found' });
    }

    switch (eventType) {
      case 'subscription.activated':
        sub.status = 'active';
        sub.plan = 'monthly';
        if (payload.current_start) sub.currentPeriodStart = new Date(payload.current_start * 1000);
        if (payload.current_end) sub.currentPeriodEnd = new Date(payload.current_end * 1000);
        break;

      case 'subscription.charged':
        sub.status = 'active';
        if (payload.current_start) sub.currentPeriodStart = new Date(payload.current_start * 1000);
        if (payload.current_end) sub.currentPeriodEnd = new Date(payload.current_end * 1000);
        break;

      case 'subscription.pending':
        sub.status = 'past_due';
        break;

      case 'subscription.halted':
      case 'subscription.cancelled':
        sub.status = 'cancelled';
        sub.cancelledAt = new Date();
        break;

      case 'subscription.completed':
        sub.status = 'expired';
        break;

      default:
        console.log(`[Razorpay Webhook] Unhandled event: ${eventType}`);
    }

    await sub.save();
    console.log(`[Razorpay Webhook] ${eventType} processed for subscription ${subscriptionId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Razorpay Webhook] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
