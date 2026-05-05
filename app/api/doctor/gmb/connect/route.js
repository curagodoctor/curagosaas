import { NextResponse } from 'next/server';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { getAuthorizationUrl, isGmbConfigured } from '@/lib/gmb';

/**
 * GET /api/doctor/gmb/connect
 * Initiate GMB OAuth flow - returns authorization URL
 */
export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);

    // Check if GMB is configured
    if (!isGmbConfigured()) {
      return NextResponse.json(
        { success: false, error: 'GMB integration is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Generate authorization URL with doctor ID as state
    const authUrl = getAuthorizationUrl(doctor._id.toString());

    return NextResponse.json({
      success: true,
      authUrl,
    });
  } catch (error) {
    console.error('[GMB Connect] Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Please login to continue' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initiate GMB connection' },
      { status: 500 }
    );
  }
}
