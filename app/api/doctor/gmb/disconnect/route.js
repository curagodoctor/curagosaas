import { NextResponse } from 'next/server';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import connectDB from '@/lib/mongodb';
import GmbConnection from '@/models/GmbConnection';

/**
 * POST /api/doctor/gmb/disconnect
 * Disconnect GMB account or specific location
 * Query params:
 *   - connectionId: (optional) specific connection to disconnect
 */
export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    await connectDB();

    let query = {
      doctorId: doctor._id,
      status: { $in: ['active', 'expired', 'error'] },
    };

    // If specific connection ID provided, disconnect only that one
    if (connectionId) {
      query._id = connectionId;
    }

    // Find connection(s)
    const connections = await GmbConnection.find(query);

    if (!connections || connections.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No GMB connection found' },
        { status: 404 }
      );
    }

    // Update status to disconnected (keep record for audit)
    for (const connection of connections) {
      connection.status = 'disconnected';
      connection.accessToken = null;
      connection.refreshToken = null;
      await connection.save();
    }

    return NextResponse.json({
      success: true,
      message: connectionId
        ? 'Location disconnected successfully'
        : `${connections.length} GMB connection(s) disconnected successfully`,
      disconnectedCount: connections.length,
    });
  } catch (error) {
    console.error('[GMB Disconnect] Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Please login to continue' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to disconnect GMB account' },
      { status: 500 }
    );
  }
}
