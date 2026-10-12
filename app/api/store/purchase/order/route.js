import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import StoreProduct from '@/models/store/Product';
import { getPracticeOsRazorpay } from '@/lib/practice-os/access';
import { hasStoreProduct } from '@/lib/store/grant';

export const runtime = 'nodejs';

// POST /api/store/purchase/order — { productId }
// Logged-in: create a Razorpay order for a store product. Price is FINAL (GST-inclusive).
export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();
    const { productId } = await request.json();
    if (!productId) return NextResponse.json({ success: false, error: 'Missing product' }, { status: 400 });

    const p = await StoreProduct.findOne({ _id: productId, isPublished: true }).select('title priceInInr').lean();
    if (!p) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });

    if (await hasStoreProduct(doctor._id, p._id)) return NextResponse.json({ success: true, alreadyOwned: true });

    const total = p.priceInInr || 0;
    if (total <= 0) return NextResponse.json({ success: true, free: true }); // client calls verify with no payment

    const rzp = getPracticeOsRazorpay();
    if (!rzp.keyId || !rzp.keySecret) return NextResponse.json({ success: false, error: 'Payments are not configured.' }, { status: 500 });
    const auth = Buffer.from(`${rzp.keyId}:${rzp.keySecret}`).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: total * 100,
        currency: 'INR',
        receipt: `st_${doctor._id}_${Date.now()}`,
        notes: { type: 'store', doctorId: String(doctor._id), productId: String(p._id) },
      }),
    });
    if (!res.ok) { console.error('[store order] rzp', await res.text()); return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 502 }); }
    const order = await res.json();

    return NextResponse.json({
      success: true,
      order: { id: order.id, amount: order.amount, currency: order.currency },
      total, productId: String(p._id), key: rzp.publicKeyId,
      prefill: { name: doctor.displayName || doctor.name || '', email: doctor.email || '', contact: doctor.phone || '' },
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[store order]', error);
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}
