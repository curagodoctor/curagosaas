import { NextResponse } from 'next/server';
import { getDoctorFromRequest } from '@/lib/doctorAuth';
import connectDB from '@/lib/mongodb';
import WeeklySchedule from '@/models/WeeklySchedule';
import ConsultationMode from '@/models/ConsultationMode';

// GET - Get weekly schedule for the doctor
export async function GET(request) {
  try {
    const doctor = await getDoctorFromRequest(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const schedules = await WeeklySchedule.find({ doctorId: doctor._id })
      .populate('modeId', 'name displayName color');

    return NextResponse.json({
      success: true,
      schedules,
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// PUT - Update weekly schedule
export async function PUT(request) {
  try {
    const doctor = await getDoctorFromRequest(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { modeId, dayOfWeek, isEnabled, enabledSlots } = await request.json();

    if (!modeId || dayOfWeek === undefined) {
      return NextResponse.json(
        { error: 'modeId and dayOfWeek are required' },
        { status: 400 }
      );
    }

    // Verify mode belongs to doctor
    const mode = await ConsultationMode.findOne({
      _id: modeId,
      doctorId: doctor._id,
    });

    if (!mode) {
      return NextResponse.json({ error: 'Mode not found' }, { status: 404 });
    }

    const schedule = await WeeklySchedule.findOneAndUpdate(
      { doctorId: doctor._id, modeId, dayOfWeek },
      {
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        enabledSlots: enabledSlots || [],
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      schedule,
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// PATCH - Toggle day enabled/disabled
export async function PATCH(request) {
  try {
    const doctor = await getDoctorFromRequest(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { modeId, dayOfWeek, isEnabled } = await request.json();

    if (!modeId || dayOfWeek === undefined || isEnabled === undefined) {
      return NextResponse.json(
        { error: 'modeId, dayOfWeek, and isEnabled are required' },
        { status: 400 }
      );
    }

    const schedule = await WeeklySchedule.findOneAndUpdate(
      { doctorId: doctor._id, modeId, dayOfWeek },
      { isEnabled },
      { new: true }
    );

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      schedule,
    });
  } catch (error) {
    console.error('Toggle schedule error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
