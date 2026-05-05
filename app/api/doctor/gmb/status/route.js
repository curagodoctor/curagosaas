import { NextResponse } from 'next/server';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { getConnectionStatus, isGmbConfigured } from '@/lib/gmb';

/**
 * GET /api/doctor/gmb/status
 * Get GMB connection status for the current doctor
 */
export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);

    // Check if GMB is configured
    const configured = isGmbConfigured();

    // Get connection status
    const status = await getConnectionStatus(doctor._id);

    return NextResponse.json({
      success: true,
      configured,
      ...status,
    });
  } catch (error) {
    console.error('[GMB Status] Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Please login to continue' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get GMB status' },
      { status: 500 }
    );
  }
}
