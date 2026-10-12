import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyPracticeOsWebhookSignature } from '@/lib/practice-os/access';
import { grantStoreAccess } from '@/lib/store/grant';

export const runtime = 'nodejs';

/**
 * POST /api/store/purchase/webhook
 * Razorpay webhook backstop for LOGGED-IN store purchases (notes.type === 'store'
 * with a doctorId). Fires even if the buyer closes the tab before the browser
 * verify callback. Idempotent with the callback. Guest ('store_public') purchases
 * are handled by the public claim route, not here.
 * Register for order.paid / payment.captured with the Practice OS webhook secret.
 */
export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const hasSecret = !!(process.env.PRACTICE_OS_RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET);
    if (hasSecret && (!signature || !verifyPracticeOsWebhookSignature(body, signature))) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    if (event.event !== 'order.paid' && event.event !== 'payment.captured') {
      return NextResponse.json({ success: true, ignored: event.event });
    }

    const order = event.payload?.order?.entity;
    const payment = event.payload?.payment?.entity;
    const notes = order?.notes || payment?.notes || {};
    if (notes.type !== 'store' || !notes.doctorId || !notes.productId) {
      return NextResponse.json({ success: true, ignored: 'not a logged-in store order' });
    }
    const paymentId = payment?.id;
    if (!paymentId) return NextResponse.json({ success: true, ignored: 'no payment id yet' });

    await connectDB();
    const total = Math.round(((payment?.amount ?? order?.amount) || 0) / 100);
    await grantStoreAccess(notes.doctorId, notes.productId, {
      paymentId, orderId: order?.id || payment?.order_id || '', amountInInr: total,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[store webhook]', error);
    return NextResponse.json({ success: false, error: 'Webhook error' }, { status: 500 });
  }
}
