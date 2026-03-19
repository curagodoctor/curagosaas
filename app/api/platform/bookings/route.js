import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Doctor from '@/models/Doctor';

// GET - Get all bookings across platform
export async function GET(request) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');
    const mode = searchParams.get('mode');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    await connectDB();

    // Build query
    const query = {};

    if (doctorId) {
      query.doctorId = doctorId;
    }

    if (status) {
      query.status = status;
    }

    if (mode) {
      query.mode = mode;
    }

    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = dateFrom;
      if (dateTo) query.date.$lte = dateTo;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { whatsapp: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [bookings, total, stats] = await Promise.all([
      Booking.find(query)
        .populate('doctorId', 'name displayName subdomain')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(query),
      // Get status breakdown
      Booking.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Get list of doctors for filter dropdown
    const doctors = await Doctor.find({ isActive: true })
      .select('name displayName subdomain')
      .sort({ name: 1 })
      .lean();

    // Get unique modes for filter dropdown
    const modes = await Booking.distinct('mode');

    return NextResponse.json({
      bookings: bookings.map(b => ({
        ...b,
        doctorName: b.doctorId?.displayName || b.doctorId?.name || 'Unknown',
        doctorSubdomain: b.doctorId?.subdomain
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        byStatus: stats.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {})
      },
      filters: {
        doctors: doctors.map(d => ({
          id: d._id,
          name: d.displayName || d.name,
          subdomain: d.subdomain
        })),
        modes,
        statuses: ['pending_payment', 'confirmed', 'expired', 'cancelled']
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
