import { NextResponse } from 'next/server';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Booking from '@/models/Booking';
import BookingPage from '@/models/BookingPage';

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
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const verified = searchParams.get('verified'); // 'true', 'false'

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subdomain: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (verified === 'true') {
      query.isEmailVerified = true;
    } else if (verified === 'false') {
      query.isEmailVerified = false;
    }

    // Build sort
    const validSortFields = ['createdAt', 'name', 'email', 'lastLoginAt', 'subdomain'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    // Get total count
    const total = await Doctor.countDocuments(query);
    const activeCount = await Doctor.countDocuments({ isActive: true });
    const verifiedCount = await Doctor.countDocuments({ isEmailVerified: true });

    // Get doctors with pagination
    const skip = (page - 1) * limit;
    const doctors = await Doctor.find(query)
      .select('-password -emailVerificationOTP -emailVerificationExpiry')
      .sort(sort)
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

    // Get booking count and revenue per doctor
    const doctorStats = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $lookup: {
          from: 'bookingpages',
          localField: 'doctorId',
          foreignField: 'doctorId',
          as: 'pages'
        }
      },
      {
        $group: {
          _id: '$doctorId',
          bookingCount: { $sum: 1 }
        }
      }
    ]);

    // Get views per doctor
    const doctorViews = await BookingPage.aggregate([
      {
        $group: {
          _id: '$doctorId',
          totalViews: { $sum: '$views' }
        }
      }
    ]);

    const bookingCountMap = {};
    doctorStats.forEach((item) => {
      if (item._id) {
        bookingCountMap[item._id.toString()] = {
          bookingCount: item.bookingCount
        };
      }
    });

    const viewsMap = {};
    doctorViews.forEach((item) => {
      if (item._id) {
        viewsMap[item._id.toString()] = item.totalViews;
      }
    });

    // Add stats to each doctor
    const doctorsWithStats = doctors.map((doctor) => {
      const stats = bookingCountMap[doctor._id.toString()] || { bookingCount: 0 };
      return {
        ...doctor,
        bookingCount: stats.bookingCount,
        totalViews: viewsMap[doctor._id.toString()] || 0
      };
    });

    return NextResponse.json({
      success: true,
      doctors: doctorsWithStats,
      total,
      activeCount,
      verifiedCount,
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
