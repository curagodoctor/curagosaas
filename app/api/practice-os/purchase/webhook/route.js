import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyPracticeOsWebhookSignature } from '@/lib/practice-os/access';
import { grantPracticeOsAccess } from '@/lib/practice-os/grant';

export const runtime = 'nodejs';

/**
 * POST /api/practice-os/purchase/webhook
 *
 * Razorpay webhook — the server-side source of truth for Practice OS purchases.
 * Fires even if the buyer closes the tab before the browser verify callback, so
 * access is never stranded on a completed payment. Idempotent with the callback.
 *
 * Register this URL in the Razorpay dashboard for the `order.paid` and
 * `payment.captured` events, using RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(request) {
  try {
    const body = await request.text();          // raw body — needed for signature
    const signature = request.headers.get('x-razorpay-signature');

    // Verify against the Practice OS webhook secret (its own Razorpay account).
    const hasSecret = !!(process.env.PRACTICE_OS_RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET);
    if (hasSecret) {
      if (!signature || !verifyPracticeOsWebhookSignature(body, signature)) {
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    if (eventType !== 'order.paid' && eventType !== 'payment.captured') {
      return NextResponse.json({ success: true, ignored: eventType });
    }

    const order = event.payload?.order?.entity;
    const payment = event.payload?.payment?.entity;
    // We stamp `notes` on the order at creation; fall back to the payment's notes.
    const notes = order?.notes || payment?.notes || {};

    if (notes.type !== 'practice_os' || !notes.doctorId) {
      return NextResponse.json({ success: true, ignored: 'not a practice_os order' });
    }

    const paymentId = payment?.id;
    if (!paymentId) {
      return NextResponse.json({ success: true, ignored: 'no payment id yet' });
    }

    await connectDB();
    await grantPracticeOsAccess(notes.doctorId, {
      paymentId,
      orderId: order?.id || payment?.order_id || '',
      amountInInr: Math.round(((payment?.amount ?? order?.amount) || 0) / 100),
    });

    console.log(`[Practice OS webhook] ${eventType} granted access to doctor ${notes.doctorId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Practice OS webhook]', error);
    // 500 tells Razorpay to retry.
    return NextResponse.json({ success: false, error: 'Webhook error' }, { status: 500 });
  }
}
