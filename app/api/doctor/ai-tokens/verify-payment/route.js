import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIToken from '@/models/AIToken';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import crypto from 'crypto';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const TOKEN_PACKS = {
  starter: { tokens: 10, amount: 500 },
  pro: { tokens: 25, amount: 1000 },
  business: { tokens: 50, amount: 1800 },
};

export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, pack } = await request.json();

    if (!razorpay_payment_id || !pack) {
      return NextResponse.json({ success: false, error: 'Payment ID and pack are required' }, { status: 400 });
    }

    const selectedPack = TOKEN_PACKS[pack];
    if (!selectedPack) {
      return NextResponse.json({ success: false, error: 'Invalid pack' }, { status: 400 });
    }

    // Verify signature
    if (razorpay_order_id && razorpay_signature) {
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    // Credit tokens
    const updated = await AIToken.addTokens(
      doctor._id,
      selectedPack.tokens,
      razorpay_payment_id,
      selectedPack.amount
    );

    return NextResponse.json({
      success: true,
      balance: updated.balance,
      tokensAdded: selectedPack.tokens,
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[AITokens VerifyPayment]', error);
    return NextResponse.json({ success: false, error: 'Failed to verify payment' }, { status: 500 });
  }
}
