import { NextResponse } from 'next/server';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import connectDB from '@/lib/mongodb';
import GmbConnection from '@/models/GmbConnection';
import GmbPost from '@/models/GmbPost';
import GmbReview from '@/models/GmbReview';
import ReviewRequest from '@/models/ReviewRequest';

/**
 * GET /api/doctor/gmb
 * Get all GMB connections and stats for the doctor
 */
export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);

    await connectDB();

    // Get ALL connections for this doctor (not just one)
    const connections = await GmbConnection.find({
      doctorId: doctor._id,
      status: { $in: ['active', 'expired', 'error'] },
    }).sort({ businessName: 1 });

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        success: true,
        connected: false,
        connections: [],
      });
    }

    // Get stats for dashboard (aggregated across all connections)
    const [postStats, reviewStats, requestStats] = await Promise.all([
      // Post stats
      GmbPost.aggregate([
        { $match: { doctorId: doctor._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // Review stats (last 30 days)
      GmbReview.getStatsForDoctor(doctor._id, 30),

      // Review request stats (last 30 days)
      ReviewRequest.getStatsForDoctor(doctor._id, 30),
    ]);

    // Format post stats
    const posts = {
      total: 0,
      scheduled: 0,
      published: 0,
      draft: 0,
      failed: 0,
    };
    postStats.forEach(s => {
      posts[s._id] = s.count;
      posts.total += s.count;
    });

    // Format connections
    const formattedConnections = connections.map(conn => ({
      id: conn._id,
      status: conn.status,
      businessName: conn.businessName,
      locationName: conn.locationName,
      locationAddress: conn.locationAddress,
      businessPhone: conn.businessPhone,
      businessWebsite: conn.businessWebsite,
      businessCategory: conn.businessCategory,
      placeId: conn.placeId,
      lastSyncAt: conn.lastSyncAt,
      features: conn.features,
    }));

    return NextResponse.json({
      success: true,
      connected: true,
      connections: formattedConnections,
      // Keep single connection for backward compatibility
      connection: formattedConnections[0],
      stats: {
        posts,
        reviews: reviewStats,
        requests: requestStats,
      },
    });
  } catch (error) {
    console.error('[GMB] Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Please login to continue' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get GMB data' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/doctor/gmb
 * Update GMB connection settings (features toggle)
 */
export async function PATCH(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    const body = await request.json();

    await connectDB();

    const connection = await GmbConnection.findActiveByDoctor(doctor._id);

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'No GMB connection found' },
        { status: 404 }
      );
    }

    // Update features if provided
    if (body.features) {
      connection.features = {
        ...connection.features,
        ...body.features,
      };
    }

    await connection.save();

    return NextResponse.json({
      success: true,
      features: connection.features,
    });
  } catch (error) {
    console.error('[GMB PATCH] Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Please login to continue' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update GMB settings' },
      { status: 500 }
    );
  }
}
