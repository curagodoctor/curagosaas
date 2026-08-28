import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Framework from '@/models/practice-os/Framework';
import Doctor from '@/models/Doctor';
import PendingPurchase from '@/models/practice-os/PendingPurchase';
import { getFrameworkPriceInr, computeGst, verifyRazorpaySignature } from '@/lib/practice-os/access';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/public/practice-os/claim
// Paid:  { slug, email, name, phone, razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Free:  { slug, email, name, phone }
// Creates a durable PendingPurchase (survives refresh) and returns a claimToken.
// Idempotent on the Razorpay payment id.
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { slug, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    const email = String(body.email || '').toLowerCase().trim();
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();

    if (!slug) return NextResponse.json({ success: false, error: 'Missing pack' }, { status: 400 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ success: false, error: 'A valid email is required.' }, { status: 400 });

    const fw = await Framework.findOne({ slug: String(slug).toLowerCase(), isPublished: true, isActive: true }).select('title priceInInr').lean();
    if (!fw) return NextResponse.json({ success: false, error: 'Pack not found' }, { status: 404 });

    const amountInr = await getFrameworkPriceInr(fw._id);
    const isFree = amountInr <= 0;
    const existingUser = !!(await Doctor.findOne({ email }).select('_id').lean());

    if (!isFree) {
      // Paid: verify the Razorpay signature before recording anything.
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json({ success: false, error: 'Missing payment details.' }, { status: 400 });
      }
      if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        return NextResponse.json({ success: false, error: 'Payment could not be verified.' }, { status: 400 });
      }
      // Idempotency: if this payment was already recorded, return the same token.
      const already = await PendingPurchase.findOne({ paymentId: razorpay_payment_id }).lean();
      if (already) {
        return NextResponse.json({ success: true, claimToken: already.claimToken, email, existingUser });
      }
    }

    const g = computeGst(amountInr);
    const claimToken = PendingPurchase.generateToken();
    const doc = await PendingPurchase.create({
      frameworkId: fw._id,
      claimToken,
      buyerEmail: email,
      buyerName: name,
      buyerPhone: phone,
      isFree,
      amountInInr: isFree ? 0 : g.total,
      baseInInr: g.base, gstInInr: g.gst, gstPercent: g.pct,
      paymentId: isFree ? '' : razorpay_payment_id,
      orderId: isFree ? '' : (razorpay_order_id || ''),
      signature: isFree ? '' : (razorpay_signature || ''),
    });

    return NextResponse.json({ success: true, claimToken: doc.claimToken, email, existingUser });
  } catch (error) {
    console.error('[Public claim]', error);
    return NextResponse.json({ success: false, error: 'Could not record your purchase. Please contact support with your payment id.' }, { status: 500 });
  }
}
