import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIToken from '@/models/AIToken';
import { requireDoctorAuth } from '@/lib/doctorAuth';

export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const record = await AIToken.getOrCreate(doctor._id);

    return NextResponse.json({
      success: true,
      balance: record.balance,
      purchases: record.purchases.slice(-10).reverse(),
      usage: record.usage.slice(-20).reverse(),
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[AITokens GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tokens' }, { status: 500 });
  }
}
