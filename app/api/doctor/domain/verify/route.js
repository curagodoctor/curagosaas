import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { verifyDomain, getDomainConfig, dnsPointsToVercel } from '@/lib/vercelDomains';

export const runtime = 'nodejs';

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
    // Real DNS lookup — a domain that actually resolves to Vercel is live even if
    // Vercel's project "verified" flag says otherwise (nameserver-managed domains,
    // token/project mismatches). This stops working domains reading "not propagated".
    const dnsCheck = await dnsPointsToVercel(doctor.customDomain);
    const hasConflict = (dnsCheck.conflictingRecords || []).length > 0;
    // Connected = points at Vercel (API flag or real DNS) AND no conflicting record.
    const connected = !hasConflict
      && !!(verifyResult.verified || config.verified || config.configured || dnsCheck.pointsToVercel);

    return NextResponse.json({
      success: true,
      domain: doctor.customDomain,
      ...config,
      // Override after ...config so the combined signal wins.
      verified: connected,
      vercelVerified: verifyResult.verified || false,
      conflict: hasConflict ? dnsCheck.conflictingRecords : null,
      dns: dnsCheck,
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Domain Verify]', error);
    return NextResponse.json({ success: false, error: 'Failed to verify domain' }, { status: 500 });
  }
}
