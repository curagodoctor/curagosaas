import { NextResponse } from 'next/server';
import { getCurrentDoctor } from '@/lib/doctorAuth';
import connectDB from '@/lib/mongodb';
import TimeSlot from '@/models/TimeSlot';
import ConsultationMode from '@/models/ConsultationMode';
import WeeklySchedule from '@/models/WeeklySchedule';

// Helper to format time
function formatTimeLabel(time24) {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

// Initialize default data for a doctor
async function initializeDoctorSlots(doctorId) {
  // Check if doctor has consultation modes
  let modes = await ConsultationMode.find({ doctorId });

  if (modes.length === 0) {
    // Create default modes for this doctor
    const defaultModes = [
      {
        doctorId,
        name: 'online',
        displayName: 'Online Consultation',
        description: 'Video consultation from the comfort of your home',
        color: '#3B82F6',
        isActive: true,
        sortOrder: 1,
      },
      {
        doctorId,
        name: 'in-clinic',
        displayName: 'In-Clinic Visit',
        description: 'Visit the clinic for in-person consultation',
        color: '#10B981',
        isActive: true,
        sortOrder: 2,
      },
    ];

    modes = await ConsultationMode.insertMany(defaultModes);

    // Initialize weekly schedule for all days
    for (const mode of modes) {
      for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
        await WeeklySchedule.create({
          doctorId,
          modeId: mode._id,
          dayOfWeek,
          isEnabled: false,
          enabledSlots: [],
        });
      }
    }
  }

  // Check if doctor has time slots
  const slotCount = await TimeSlot.countDocuments({ doctorId });

  if (slotCount === 0) {
    // Create default time slots (6 AM - 10 PM)
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute of [0, 30]) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          doctorId,
          time,
          label: formatTimeLabel(time),
          isActive: true,
        });
      }
    }
    await TimeSlot.insertMany(slots);
  }

  return modes;
}

// GET - Get all slots, modes, and schedules for the doctor
export async function GET(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Initialize default data if needed
    await initializeDoctorSlots(doctor._id);

    // Get consultation modes
    const modes = await ConsultationMode.find({ doctorId: doctor._id })
      .sort({ sortOrder: 1 });

    // Get time slots
    const timeSlots = await TimeSlot.find({ doctorId: doctor._id })
      .sort({ time: 1 });

    // Get weekly schedules
    const schedules = await WeeklySchedule.find({ doctorId: doctor._id });

    return NextResponse.json({
      success: true,
      modes,
      timeSlots,
      schedules,
    });
  } catch (error) {
    console.error('Get doctor slots error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// POST - Add new time slot
export async function POST(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { time } = await request.json();

    if (!time) {
      return NextResponse.json({ error: 'Time is required' }, { status: 400 });
    }

    // Check if slot exists
    const existing = await TimeSlot.findOne({ doctorId: doctor._id, time });
    if (existing) {
      return NextResponse.json({ error: 'Slot already exists' }, { status: 400 });
    }

    const slot = await TimeSlot.create({
      doctorId: doctor._id,
      time,
      label: formatTimeLabel(time),
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      slot,
    });
  } catch (error) {
    console.error('Add slot error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// PATCH - Update slot status or toggle slot
export async function PATCH(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { time, isActive } = await request.json();

    if (!time || isActive === undefined) {
      return NextResponse.json(
        { error: 'Time and isActive are required' },
        { status: 400 }
      );
    }

    const slot = await TimeSlot.findOneAndUpdate(
      { doctorId: doctor._id, time },
      { isActive },
      { new: true }
    );

    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      slot,
    });
  } catch (error) {
    console.error('Update slot error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// DELETE - Remove time slot
export async function DELETE(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const time = searchParams.get('time');

    if (!time) {
      return NextResponse.json({ error: 'Time is required' }, { status: 400 });
    }

    const result = await TimeSlot.findOneAndDelete({
      doctorId: doctor._id,
      time,
    });

    if (!result) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Also remove from all weekly schedules
    await WeeklySchedule.updateMany(
      { doctorId: doctor._id, enabledSlots: time },
      { $pull: { enabledSlots: time } }
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete slot error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
