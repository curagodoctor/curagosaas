import { NextResponse } from 'next/server';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import connectDB from '@/lib/mongodb';
import GmbConnection from '@/models/GmbConnection';
import ReviewRequest from '@/models/ReviewRequest';
import ReviewRequestTemplate from '@/models/ReviewRequestTemplate';
import Booking from '@/models/Booking';

/**
 * GET /api/doctor/gmb/requests
 * Get all review requests for the doctor
 */
export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    await connectDB();

    // Build query
    const query = { doctorId: doctor._id };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Get requests with pagination
    const [requests, total, stats] = await Promise.all([
      ReviewRequest.find(query)
        .sort({ scheduledAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ReviewRequest.countDocuments(query),
      ReviewRequest.getStatsForDoctor(doctor._id, 30),
    ]);

    return NextResponse.json({
      success: true,
      requests,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Review Requests GET] Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Please login to continue' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get review requests' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/doctor/gmb/requests
 * Manually create a review request
 */
export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    const body = await request.json();

    await connectDB();

    // Get active GMB connection
    const connection = await GmbConnection.findActiveByDoctor(doctor._id);
    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'No GMB connection found. Please connect your Google Business account.' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.patientName || !body.patientPhone) {
      return NextResponse.json(
        { success: false, error: 'Patient name and phone are required' },
        { status: 400 }
      );
    }

    // Get template
    let template;
    if (body.templateId) {
      template = await ReviewRequestTemplate.findOne({
        _id: body.templateId,
        doctorId: doctor._id,
      });
    } else {
      template = await ReviewRequestTemplate.getDefault(doctor._id, body.channel || 'whatsapp');
    }

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'No template found. Please create a review request template first.' },
        { status: 400 }
      );
    }

    // Create review request
    const reviewRequest = await ReviewRequest.create({
      doctorId: doctor._id,
      bookingId: body.bookingId || null,
      gmbConnectionId: connection._id,
      patientName: body.patientName,
      patientPhone: body.patientPhone,
      patientEmail: body.patientEmail,
      channel: template.channel,
      messageTemplate: template.message,
      scheduledAt: body.scheduledAt || new Date(),
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      reviewRequest,
      message: 'Review request created successfully',
    });
  } catch (error) {
    console.error('[Review Requests POST] Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Please login to continue' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create review request' },
      { status: 500 }
    );
  }
}
