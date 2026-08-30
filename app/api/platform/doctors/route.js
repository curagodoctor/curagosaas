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
      // Escape regex metacharacters so a search like "+91..." or "dr. x" doesn't
      // build an invalid regex (which throws and makes search look broken).
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const or = [
        { name: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
        { subdomain: { $regex: safe, $options: 'i' } },
        { displayName: { $regex: safe, $options: 'i' } },
        { phone: { $regex: safe, $options: 'i' } },
      ];

      // Normalized phone match — a phone search should hit regardless of how the
      // number is stored (with/without +91, spaces, dashes). Drop the country code
      // (last 10 digits) and match those digits allowing any separators between
      // them, so "+91 98765 43210", "919876543210" and "9876543210" all match.
      const digits = search.replace(/\D/g, '');
      if (digits.length >= 4) {
        const core = digits.length > 10 ? digits.slice(-10) : digits;
        const loosePhone = core.split('').join('[^0-9]*');
        or.push({ phone: { $regex: loosePhone } });
      }

      query.$or = or;
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
