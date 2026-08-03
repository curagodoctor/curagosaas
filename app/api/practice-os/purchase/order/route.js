import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { getFrameworkPriceInr, getPracticeOsRazorpay, isDevPaymentBypass, hasPackAccess } from '@/lib/practice-os/access';
import Framework from '@/models/practice-os/Framework';

export const runtime = 'nodejs';

// GET /api/practice-os/purchase/order?pack=<frameworkId> — price + ownership for
// one pack (no order created).
export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();
    const packId = new URL(request.url).searchParams.get('pack');
    if (!packId) return NextResponse.json({ success: false, error: 'Missing pack' }, { status: 400 });
    const fw = await Framework.findById(packId).select('title priceInInr isPublished isActive').lean();
    if (!fw) return NextResponse.json({ success: false, error: 'Pack not found' }, { status: 404 });
    const rzp = getPracticeOsRazorpay();
    return NextResponse.json({
      success: true,
      pack: { id: String(fw._id), title: fw.title },
      amountInr: fw.priceInInr || 0,
      free: (fw.priceInInr || 0) <= 0,
      alreadyOwned: await hasPackAccess(doctor._id, fw),
      configured: !!(rzp.keyId && rzp.keySecret),
      devBypass: isDevPaymentBypass(),
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

// POST /api/practice-os/purchase/order — { packId }
// Creates a Razorpay order for one pack for the current doctor.
export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();
    const { packId } = await request.json();
    if (!packId) return NextResponse.json({ success: false, error: 'Missing pack' }, { status: 400 });

    const fw = await Framework.findById(packId).select('title priceInInr').lean();
    if (!fw) return NextResponse.json({ success: false, error: 'Pack not found' }, { status: 404 });

    if (await hasPackAccess(doctor._id, fw)) {
      return NextResponse.json({ success: true, alreadyOwned: true });
    }

    const rzp = getPracticeOsRazorpay();
    if (!rzp.keyId || !rzp.keySecret) {
      return NextResponse.json({ success: false, error: 'Payments are not configured.' }, { status: 500 });
    }

    const amountInr = await getFrameworkPriceInr(packId);
    if (amountInr <= 0) {
      return NextResponse.json({ success: false, error: 'This pack is free — no payment needed.' }, { status: 400 });
    }
    const auth = Buffer.from(`${rzp.keyId}:${rzp.keySecret}`).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: amountInr * 100, // paise
        currency: 'INR',
        receipt: `pos_${doctor._id}_${Date.now()}`,
        notes: { type: 'practice_os', doctorId: String(doctor._id), frameworkId: String(packId) },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[Practice OS order] Razorpay error:', text);
      return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 502 });
    }

    const order = await res.json();
    return NextResponse.json({
      success: true,
      order: { id: order.id, amount: order.amount, currency: order.currency },
      amountInr,
      packId: String(packId),
      key: rzp.publicKeyId,
      prefill: { name: doctor.displayName || doctor.name || '', email: doctor.email || '', contact: doctor.phone || '' },
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Practice OS order]', error);
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}
