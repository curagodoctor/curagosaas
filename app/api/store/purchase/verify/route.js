import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { verifyRazorpaySignature } from '@/lib/practice-os/access';
import StoreProduct from '@/models/store/Product';
import { grantStoreAccess } from '@/lib/store/grant';

export const runtime = 'nodejs';

// POST /api/store/purchase/verify — { productId, razorpay_* }
// Verifies the payment and unlocks the product for the doctor. For a FREE product
// no payment is required. Idempotent (grantStoreAccess dedupes on paymentId).
export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();
    const { productId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
    if (!productId) return NextResponse.json({ success: false, error: 'Missing product' }, { status: 400 });

    const p = await StoreProduct.findOne({ _id: productId, isPublished: true }).select('priceInInr').lean();
    if (!p) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });

    const total = p.priceInInr || 0;
    if (total > 0) {
      if (!razorpay_payment_id) return NextResponse.json({ success: false, error: 'Missing payment id' }, { status: 400 });
      if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 });
      }
    }

    await grantStoreAccess(doctor._id, p._id, {
      paymentId: total > 0 ? razorpay_payment_id : '', // free → synthetic id inside grant
      orderId: razorpay_order_id || '', signature: razorpay_signature || '', amountInInr: total,
    });

    return NextResponse.json({ success: true, productId: String(p._id) });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[store verify]', error);
    return NextResponse.json({ success: false, error: 'Failed to verify payment' }, { status: 500 });
  }
}
