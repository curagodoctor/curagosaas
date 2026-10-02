import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Booking from '@/models/Booking';

// GET - Get all bookings for a specific doctor
export async function GET(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    await connectDB();

    // Verify doctor exists
    const doctor = await Doctor.findById(id).select('name displayName subdomain');
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Build query (counts only — patient details are NEVER returned to the platform
    // admin; they live on the doctor's own dashboard).
    const query = { doctorId: id };
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = dateFrom;
      if (dateTo) query.date.$lte = dateTo;
    }

    const [total, statusAgg, lastBookingAt] = await Promise.all([
      Booking.countDocuments(query),
      Booking.aggregate([{ $match: query }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Booking.findOne(query).sort({ createdAt: -1 }).select('createdAt').lean(),
    ]);

    return NextResponse.json({
      doctor: {
        id: doctor._id,
        name: doctor.displayName || doctor.name,
        subdomain: doctor.subdomain,
      },
      // Aggregate activity only — no patient-identifying data.
      stats: {
        total,
        byStatus: statusAgg.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
        lastBookingAt: lastBookingAt?.createdAt || null,
      },
    });

  } catch (error) {
    console.error('Get doctor bookings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
