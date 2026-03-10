import { NextResponse } from 'next/server';
import { getCurrentDoctor } from '@/lib/doctorAuth';
import connectDB from '@/lib/mongodb';
import ConsultationMode from '@/models/ConsultationMode';

// GET - Get all consultation modes for the doctor
export async function GET(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const modes = await ConsultationMode.find({ doctorId: doctor._id })
      .sort({ sortOrder: 1 });

    return NextResponse.json({
      success: true,
      modes,
    });
  } catch (error) {
    console.error('Get modes error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// POST - Create new consultation mode
export async function POST(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { name, displayName, description, color } = await request.json();

    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'Name and displayName are required' },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await ConsultationMode.findOne({
      doctorId: doctor._id,
      name: name.toLowerCase(),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A mode with this name already exists' },
        { status: 400 }
      );
    }

    // Get next sort order
    const maxSort = await ConsultationMode.findOne({ doctorId: doctor._id })
      .sort({ sortOrder: -1 })
      .select('sortOrder');
    const sortOrder = (maxSort?.sortOrder || 0) + 1;

    const mode = await ConsultationMode.create({
      doctorId: doctor._id,
      name: name.toLowerCase(),
      displayName,
      description: description || '',
      color: color || '#3B82F6',
      sortOrder,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      mode,
    });
  } catch (error) {
    console.error('Create mode error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// PATCH - Update consultation mode
export async function PATCH(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id, displayName, description, color, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Mode ID is required' }, { status: 400 });
    }

    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (isActive !== undefined) updateData.isActive = isActive;

    const mode = await ConsultationMode.findOneAndUpdate(
      { _id: id, doctorId: doctor._id },
      updateData,
      { new: true }
    );

    if (!mode) {
      return NextResponse.json({ error: 'Mode not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      mode,
    });
  } catch (error) {
    console.error('Update mode error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// DELETE - Delete consultation mode
export async function DELETE(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Mode ID is required' }, { status: 400 });
    }

    const result = await ConsultationMode.findOneAndDelete({
      _id: id,
      doctorId: doctor._id,
    });

    if (!result) {
      return NextResponse.json({ error: 'Mode not found' }, { status: 404 });
    }

    // Also delete associated weekly schedules
    const WeeklySchedule = (await import('@/models/WeeklySchedule')).default;
    await WeeklySchedule.deleteMany({ doctorId: doctor._id, modeId: id });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete mode error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
