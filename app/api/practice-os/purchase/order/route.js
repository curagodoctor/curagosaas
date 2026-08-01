import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { getPracticeOsPriceInr, getPracticeOsRazorpay, isDevPaymentBypass } from '@/lib/practice-os/access';

export const runtime = 'nodejs';

// GET /api/practice-os/purchase/order — price + ownership (no order created).
export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();
    const rzp = getPracticeOsRazorpay();
    return NextResponse.json({
      success: true,
      amountInr: await getPracticeOsPriceInr(),
      alreadyOwned: !!doctor.practiceOsActive,
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

// POST /api/practice-os/purchase/order
// Creates a Razorpay order for the Practice OS programme for the current doctor.
export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    if (doctor.practiceOsActive) {
      return NextResponse.json({ success: true, alreadyOwned: true });
    }

    const rzp = getPracticeOsRazorpay();
    if (!rzp.keyId || !rzp.keySecret) {
      return NextResponse.json({ success: false, error: 'Payments are not configured.' }, { status: 500 });
    }

    const amountInr = await getPracticeOsPriceInr();
    const auth = Buffer.from(`${rzp.keyId}:${rzp.keySecret}`).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: amountInr * 100, // paise
        currency: 'INR',
        receipt: `pos_${doctor._id}_${Date.now()}`,
        notes: { type: 'practice_os', doctorId: String(doctor._id) },
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
