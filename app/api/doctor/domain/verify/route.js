import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { verifyDomain, getDomainConfig } from '@/lib/vercelDomains';

// POST — trigger DNS verification check
export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    if (!doctor.customDomain) {
      return NextResponse.json({ success: false, error: 'No custom domain set' }, { status: 400 });
    }

    const verifyResult = await verifyDomain(doctor.customDomain);
    const config = await getDomainConfig(doctor.customDomain);

    return NextResponse.json({
      success: true,
      domain: doctor.customDomain,
      verified: verifyResult.verified || false,
      ...config,
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Domain Verify]', error);
    return NextResponse.json({ success: false, error: 'Failed to verify domain' }, { status: 500 });
  }
}
