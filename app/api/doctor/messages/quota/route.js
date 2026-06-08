import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import MessageQuota from '@/models/MessageQuota';
import { requireDoctorAuth } from '@/lib/doctorAuth';

export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const quota = await MessageQuota.getOrCreate(doctor._id);

    return NextResponse.json({
      success: true,
      quota: {
        sms: {
          limit: quota.smsLimit,
          used: quota.smsUsed,
          remaining: Math.max(0, quota.smsLimit - quota.smsUsed),
        },
        email: {
          limit: quota.emailLimit,
          used: quota.emailUsed,
          remaining: Math.max(0, quota.emailLimit - quota.emailUsed),
        },
        periodStart: quota.periodStart,
        periodEnd: quota.periodEnd,
      },
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Quota GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch quota' }, { status: 500 });
  }
}
