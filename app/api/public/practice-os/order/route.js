import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Framework from '@/models/practice-os/Framework';
import Doctor from '@/models/Doctor';
import { getFrameworkPriceInr, computeGst, getPracticeOsRazorpay } from '@/lib/practice-os/access';

export const runtime = 'nodejs';

// POST /api/public/practice-os/order — { slug }
// Public: create a Razorpay order for a pack (guest checkout, no login). Returns
// the order + public key. Free packs return { free: true } (no order needed).
export async function POST(request) {
  try {
    await connectDB();
    const { slug } = await request.json();
    if (!slug) return NextResponse.json({ success: false, error: 'Missing pack' }, { status: 400 });

    const fw = await Framework.findOne({ slug: String(slug).toLowerCase(), isPublished: true, isActive: true })
      .select('title priceInInr').lean();
    if (!fw) return NextResponse.json({ success: false, error: 'Pack not found' }, { status: 404 });

    const amountInr = await getFrameworkPriceInr(fw._id);
    if (amountInr <= 0) {
      // Free pack — no payment; the client goes straight to claim.
      return NextResponse.json({ success: true, free: true, title: fw.title });
    }

    const rzp = getPracticeOsRazorpay();
    if (!rzp.keyId || !rzp.keySecret) {
      return NextResponse.json({ success: false, error: 'Payments are not configured.' }, { status: 500 });
    }

    const { base, gst, total, pct } = computeGst(amountInr);
    const auth = Buffer.from(`${rzp.keyId}:${rzp.keySecret}`).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: total * 100,
        currency: 'INR',
        receipt: `posg_${String(fw._id).slice(-8)}_${Date.now()}`,
        notes: { type: 'practice_os_public', frameworkId: String(fw._id), base: String(base), gst: String(gst), gstPercent: String(pct) },
      }),
    });
    if (!res.ok) {
      console.error('[Public order] Razorpay error:', await res.text());
      return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 502 });
    }
    const order = await res.json();

    return NextResponse.json({
      success: true,
      free: false,
      orderId: order.id,
      amount: order.amount,       // paise
      currency: order.currency,
      keyId: rzp.publicKeyId,
      title: fw.title,
      price: { base, gst, total, pct },
    });
  } catch (error) {
    console.error('[Public order]', error);
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}

// GET ?email=… — does this email already have an account? (client decides
// signup vs login after purchase).
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
