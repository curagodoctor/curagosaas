import { NextResponse } from 'next/server';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { pendingConnections, createConnection } from '../callback/route';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import GmbConnection from '@/models/GmbConnection';

/**
 * GET /api/doctor/gmb/select-locations?pending=xxx
 * Get available locations from pending connection
 */
export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    const { searchParams } = new URL(request.url);
    const pendingId = searchParams.get('pending');

    if (!pendingId) {
      return NextResponse.json(
        { success: false, error: 'Missing pending connection ID' },
        { status: 400 }
      );
    }

    const pending = pendingConnections.get(pendingId);

    if (!pending) {
      return NextResponse.json(
        { success: false, error: 'Connection expired. Please try connecting again.' },
        { status: 404 }
      );
    }

    // Verify this pending connection belongs to this doctor
    if (pending.doctorId !== doctor._id.toString()) {
      return NextResponse.json(
        { success: false, error: 'Invalid connection' },
        { status: 403 }
      );
    }

    // Check if expired
    if (pending.expiresAt < Date.now()) {
      pendingConnections.delete(pendingId);
      return NextResponse.json(
        { success: false, error: 'Connection expired. Please try connecting again.' },
        { status: 410 }
      );
    }

    // Get already connected locations for this doctor
    await connectDB();
    const existingConnections = await GmbConnection.find({
      doctorId: doctor._id,
      status: { $in: ['active', 'expired'] },
    }).select('locationId');

    const connectedLocationIds = existingConnections.map(c => c.locationId);

    // Mark which locations are already connected
    const locations = pending.locations.map(loc => ({
      ...loc,
      alreadyConnected: connectedLocationIds.includes(loc.locationId),
    }));

    return NextResponse.json({
      success: true,
      locations,
    });
  } catch (error) {
    console.error('[GMB Select Locations GET] Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Please login to continue' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get locations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/doctor/gmb/select-locations
 * Connect selected locations
 */
export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    const { pendingId, locationIds } = await request.json();

    if (!pendingId || !locationIds || !Array.isArray(locationIds) || locationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please select at least one location' },
        { status: 400 }
      );
    }

    const pending = pendingConnections.get(pendingId);

    if (!pending) {
      return NextResponse.json(
        { success: false, error: 'Connection expired. Please try connecting again.' },
        { status: 404 }
      );
    }

    // Verify this pending connection belongs to this doctor
    if (pending.doctorId !== doctor._id.toString()) {
      return NextResponse.json(
        { success: false, error: 'Invalid connection' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get full doctor document
    const fullDoctor = await Doctor.findById(doctor._id);

    // Connect each selected location
    const connectedLocations = [];
    for (const locationId of locationIds) {
      const location = pending.locations.find(loc => loc.locationId === locationId);
      if (location) {
        await createConnection(fullDoctor, pending.tokens, location);
        connectedLocations.push(location.businessName);
      }
    }

    // Clean up pending connection
    pendingConnections.delete(pendingId);

    return NextResponse.json({
      success: true,
      message: `Connected ${connectedLocations.length} location(s)`,
      connectedLocations,
    });
  } catch (error) {
    console.error('[GMB Select Locations POST] Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Please login to continue' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to connect locations' },
      { status: 500 }
    );
  }
}
