import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import StoreProduct from '@/models/store/Product';
import PendingStorePurchase from '@/models/store/PendingStorePurchase';
import { verifyRazorpaySignature } from '@/lib/practice-os/access';

export const runtime = 'nodejs';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/public/store/claim
// Paid: { productId, email, name, phone, razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Free: { productId, email, name, phone }
// Writes a durable PendingStorePurchase and returns a claimToken. Idempotent on paymentId.
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { productId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    const email = String(body.email || '').toLowerCase().trim();
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();

    if (!productId) return NextResponse.json({ success: false, error: 'Missing product' }, { status: 400 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ success: false, error: 'A valid email is required.' }, { status: 400 });

    const p = await StoreProduct.findOne({ _id: productId, isPublished: true }).select('title priceInInr').lean();
    if (!p) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });

    const total = p.priceInInr || 0;
    const isFree = total <= 0;
    const existingUser = !!(await Doctor.findOne({ email }).select('_id').lean());

    if (!isFree) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json({ success: false, error: 'Missing payment details.' }, { status: 400 });
      }
      if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        return NextResponse.json({ success: false, error: 'Payment could not be verified.' }, { status: 400 });
      }
      const already = await PendingStorePurchase.findOne({ paymentId: razorpay_payment_id }).lean();
      if (already) return NextResponse.json({ success: true, claimToken: already.claimToken, email, existingUser });
    }

    const claimToken = PendingStorePurchase.generateToken();
    const doc = await PendingStorePurchase.create({
      productId: p._id,
      claimToken,
      buyerEmail: email, buyerName: name, buyerPhone: phone,
      isFree,
      amountInInr: isFree ? 0 : total,
      paymentId: isFree ? '' : razorpay_payment_id,
      orderId: isFree ? '' : (razorpay_order_id || ''),
      signature: isFree ? '' : (razorpay_signature || ''),
    });

    return NextResponse.json({ success: true, claimToken: doc.claimToken, email, existingUser });
  } catch (error) {
    console.error('[store public claim]', error);
    return NextResponse.json({ success: false, error: 'Could not record your purchase. Please contact support with your payment id.' }, { status: 500 });
  }
}
