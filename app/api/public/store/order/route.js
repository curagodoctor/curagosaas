import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import StoreProduct from '@/models/store/Product';
import { getPracticeOsRazorpay } from '@/lib/practice-os/access';

export const runtime = 'nodejs';

// POST /api/public/store/order — { productId }
// Guest checkout: create a Razorpay order for a store product (no login). Price is
// FINAL (GST-inclusive). Free products return { free: true } → client goes to claim.
export async function POST(request) {
  try {
    await connectDB();
    const { productId } = await request.json();
    if (!productId) return NextResponse.json({ success: false, error: 'Missing product' }, { status: 400 });

    const p = await StoreProduct.findOne({ _id: productId, isPublished: true }).select('title priceInInr').lean();
    if (!p) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });

    const total = p.priceInInr || 0;
    if (total <= 0) return NextResponse.json({ success: true, free: true, title: p.title });

    const rzp = getPracticeOsRazorpay();
    if (!rzp.keyId || !rzp.keySecret) return NextResponse.json({ success: false, error: 'Payments are not configured.' }, { status: 500 });
    const auth = Buffer.from(`${rzp.keyId}:${rzp.keySecret}`).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: total * 100,
        currency: 'INR',
        receipt: `stg_${String(p._id).slice(-8)}_${Date.now()}`,
        notes: { type: 'store_public', productId: String(p._id) },
      }),
    });
    if (!res.ok) { console.error('[store public order] rzp', await res.text()); return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 502 }); }
    const order = await res.json();

    return NextResponse.json({ success: true, free: false, orderId: order.id, amount: order.amount, currency: order.currency, keyId: rzp.publicKeyId, title: p.title, total });
  } catch (error) {
    console.error('[store public order]', error);
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}

// GET ?email= — does an account already exist? (client decides signup vs login).
export async function GET(request) {
  try {
    await connectDB();
    const email = (new URL(request.url).searchParams.get('email') || '').toLowerCase().trim();
    if (!email) return NextResponse.json({ success: true, exists: false });
    const doc = await Doctor.findOne({ email }).select('_id').lean();
    return NextResponse.json({ success: true, exists: !!doc });
  } catch {
    return NextResponse.json({ success: true, exists: false });
  }
}
