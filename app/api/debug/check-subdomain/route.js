import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';

/**
 * GET /api/debug/check-subdomain?subdomain=rishikapatil12
 * Debug endpoint to check if a subdomain exists
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');

    if (!subdomain) {
      return NextResponse.json({ error: 'subdomain param required' }, { status: 400 });
    }

    await connectDB();

    // Check all doctors with this subdomain (regardless of status)
    const doctor = await Doctor.findOne({
      subdomain: subdomain.toLowerCase(),
    }).select('subdomain name isActive isEmailVerified createdAt').lean();

    if (!doctor) {
      return NextResponse.json({
        found: false,
        subdomain,
        message: 'No doctor found with this subdomain',
      });
    }

    return NextResponse.json({
      found: true,
      subdomain,
      doctor: {
        name: doctor.name,
        isActive: doctor.isActive,
        isEmailVerified: doctor.isEmailVerified,
        createdAt: doctor.createdAt,
      },
      wouldShow: doctor.isActive && doctor.isEmailVerified,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
