import { NextResponse } from 'next/server';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import connectDB from '@/lib/mongodb';
import ReviewRequestTemplate from '@/models/ReviewRequestTemplate';

/**
 * GET /api/doctor/gmb/templates
 * Get all review request templates for the doctor
 */
export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);

    await connectDB();

    const templates = await ReviewRequestTemplate.find({ doctorId: doctor._id })
      .sort({ channel: 1, isDefault: -1, name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('[Templates GET] Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Please login to continue' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/doctor/gmb/templates
 * Create a new template
 */
export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    const body = await request.json();

    await connectDB();

    // Validate required fields
    if (!body.name || !body.channel || !body.message) {
      return NextResponse.json(
        { success: false, error: 'Name, channel, and message are required' },
        { status: 400 }
      );
    }

    // Create template
    const template = await ReviewRequestTemplate.create({
      doctorId: doctor._id,
      name: body.name,
      description: body.description,
      channel: body.channel,
      subject: body.subject,
      message: body.message,
      delayHours: body.delayHours || 24,
      isDefault: body.isDefault || false,
      isActive: body.isActive !== false,
    });

    return NextResponse.json({
      success: true,
      template,
      message: 'Template created successfully',
    });
  } catch (error) {
    console.error('[Templates POST] Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Please login to continue' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}
