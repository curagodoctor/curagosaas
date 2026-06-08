import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import crypto from 'crypto';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const TOKEN_PACKS = {
  starter: { tokens: 10, amount: 500, name: 'Starter Pack' },
  pro: { tokens: 25, amount: 1000, name: 'Pro Pack' },
  business: { tokens: 50, amount: 1800, name: 'Business Pack' },
};

export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const { pack } = await request.json();

    if (!TOKEN_PACKS[pack]) {
      return NextResponse.json({ success: false, error: 'Invalid token pack. Choose: starter, pro, or business' }, { status: 400 });
    }

    const selectedPack = TOKEN_PACKS[pack];

    // Create Razorpay order
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: selectedPack.amount * 100, // paise
        currency: 'INR',
        receipt: `aitk_${Date.now()}`,
        notes: {
          type: 'ai_token_purchase',
          doctorId: doctor._id.toString(),
          pack,
          tokens: selectedPack.tokens,
        },
      }),
    });

    const order = await orderRes.json();
    if (!orderRes.ok) {
      throw new Error(order.error?.description || 'Failed to create order');
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      pack: selectedPack,
      key: RAZORPAY_KEY_ID,
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[AITokens Purchase]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
