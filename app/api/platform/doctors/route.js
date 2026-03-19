import { NextResponse } from 'next/server';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Booking from '@/models/Booking';

export async function GET(request) {
  try {
    // Verify platform admin authentication
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || ''; // 'active', 'inactive', ''

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subdomain: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Get total count
    const total = await Doctor.countDocuments(query);
    const activeCount = await Doctor.countDocuments({ isActive: true });

    // Get doctors with pagination
    const skip = (page - 1) * limit;
    const doctors = await Doctor.find(query)
      .select('-password -emailVerificationOTP -emailVerificationExpiry')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get booking stats
    const totalBookings = await Booking.countDocuments({ status: 'confirmed' });

    // Today's bookings
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = await Booking.countDocuments({
      date: today,
      status: 'confirmed',
    });

    // Get booking count per doctor
    const doctorBookingCounts = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: '$doctorId', count: { $sum: 1 } } },
    ]);

    const bookingCountMap = {};
    doctorBookingCounts.forEach((item) => {
      if (item._id) {
        bookingCountMap[item._id.toString()] = item.count;
      }
    });

    // Add booking count to each doctor
    const doctorsWithStats = doctors.map((doctor) => ({
      ...doctor,
      bookingCount: bookingCountMap[doctor._id.toString()] || 0,
    }));

    return NextResponse.json({
      success: true,
      doctors: doctorsWithStats,
      total,
      activeCount,
      totalBookings,
      todayBookings,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Platform doctors API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctors', details: error.message },
      { status: 500 }
    );
  }
}
