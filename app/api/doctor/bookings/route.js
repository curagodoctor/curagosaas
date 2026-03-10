import { NextResponse } from 'next/server';
import { getCurrentDoctor } from '@/lib/doctorAuth';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';

// GET - Get all bookings for the doctor
export async function GET(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    const query = { doctorId: doctor._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (date) {
      query.date = date;
    }

    // Get total count
    const total = await Booking.countDocuments(query);

    // Get bookings with pagination
    const bookings = await Booking.find(query)
      .populate('modeId', 'name displayName color')
      .sort({ date: -1, time: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get stats
    const stats = await Booking.aggregate([
      { $match: { doctorId: doctor._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap = {
      total: total,
      confirmed: 0,
      pending_payment: 0,
      cancelled: 0,
      expired: 0,
    };

    stats.forEach((s) => {
      statsMap[s._id] = s.count;
    });

    return NextResponse.json({
      success: true,
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: statsMap,
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// PATCH - Update booking status (cancel booking)
export async function PATCH(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { bookingId, status } = await request.json();

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: 'Booking ID and status are required' },
        { status: 400 }
      );
    }

    // Only allow cancellation
    if (status !== 'cancelled') {
      return NextResponse.json(
        { error: 'Only cancellation is allowed' },
        { status: 400 }
      );
    }

    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, doctorId: doctor._id },
      { status },
      { new: true }
    );

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
