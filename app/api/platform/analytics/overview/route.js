import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Booking from '@/models/Booking';
import BookingPage from '@/models/BookingPage';
import { subDays, subMonths, startOfDay, endOfDay, startOfWeek, format } from 'date-fns';

export async function GET() {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Parallel queries for efficiency
    const [
      totalDoctors,
      activeDoctors,
      lastMonthDoctors,
      totalBookings,
      monthlyBookings,
      lastMonthBookings,
      totalViews,
      bookingsByMode,
      bookingsByTime,
      recentBookings,
      recentDoctors,
      dailyBookings,
      weeklySignups,
      bookingsByStatus,
      bookingsByWeekday,
      topDoctorsByBookings,
      topDoctorsByViews,
    ] = await Promise.all([
      // Total doctors
      Doctor.countDocuments(),

      // Active doctors (logged in last 30 days)
      Doctor.countDocuments({ lastLoginAt: { $gte: thirtyDaysAgo } }),

      // Doctors from last month (for growth calculation)
      Doctor.countDocuments({ createdAt: { $lt: startOfThisMonth } }),

      // Total bookings (confirmed only)
      Booking.countDocuments({ status: 'confirmed' }),

      // This month's bookings
      Booking.countDocuments({
        status: 'confirmed',
        createdAt: { $gte: startOfThisMonth }
      }),

      // Last month's bookings (for comparison)
      Booking.countDocuments({
        status: 'confirmed',
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
      }),

      // Total page views
      BookingPage.aggregate([
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]),

      // Bookings by mode
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: '$mode', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Bookings by time slot (top 10)
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: '$time', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Recent bookings
      Booking.find({ status: 'confirmed' })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('doctorId', 'name displayName subdomain')
        .lean(),

      // Recent doctors
      Doctor.find()
        .select('name email subdomain createdAt isActive')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // Daily bookings for last 30 days
      Booking.aggregate([
        {
          $match: {
            status: 'confirmed',
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Weekly doctor signups (last 12 weeks)
      Doctor.aggregate([
        {
          $match: {
            createdAt: { $gte: subDays(now, 84) } // 12 weeks
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%U',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Bookings by status
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // Bookings by weekday
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        {
          $group: {
            _id: { $dayOfWeek: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Top doctors by bookings
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: '$doctorId', bookings: { $sum: 1 } } },
        { $sort: { bookings: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'doctors',
            localField: '_id',
            foreignField: '_id',
            as: 'doctor'
          }
        },
        { $unwind: '$doctor' },
        {
          $project: {
            id: '$_id',
            name: { $ifNull: ['$doctor.displayName', '$doctor.name'] },
            bookings: 1
          }
        }
      ]),

      // Top doctors by views
      BookingPage.aggregate([
        { $group: { _id: '$doctorId', views: { $sum: '$views' } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'doctors',
            localField: '_id',
            foreignField: '_id',
            as: 'doctor'
          }
        },
        { $unwind: '$doctor' },
        {
          $project: {
            id: '$_id',
            name: { $ifNull: ['$doctor.displayName', '$doctor.name'] },
            views: 1
          }
        }
      ])
    ]);

    // Calculate stats
    const views = totalViews[0]?.total || 0;
    const conversionRate = views > 0 ? ((totalBookings / views) * 100).toFixed(2) : 0;
    const doctorGrowth = lastMonthDoctors > 0
      ? (((totalDoctors - lastMonthDoctors) / lastMonthDoctors) * 100).toFixed(1)
      : 100;
    const bookingGrowth = lastMonthBookings > 0
      ? (((monthlyBookings - lastMonthBookings) / lastMonthBookings) * 100).toFixed(1)
      : 100;

    // Process status counts
    const statusMap = new Map(bookingsByStatus.map(s => [s._id, s.count]));
    const confirmedBookings = statusMap.get('confirmed') || 0;
    const pendingBookings = statusMap.get('pending_payment') || 0;
    const cancelledBookings = statusMap.get('cancelled') || 0;
    const expiredBookings = statusMap.get('expired') || 0;

    // Fill in missing days for daily bookings
    const dailyBookingsMap = new Map(dailyBookings.map(d => [d._id, d.count]));
    const filledDailyBookings = [];
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(now, i), 'yyyy-MM-dd');
      filledDailyBookings.push({
        date,
        count: dailyBookingsMap.get(date) || 0
      });
    }

    return NextResponse.json({
      stats: {
        totalDoctors,
        activeDoctors,
        doctorGrowth: parseFloat(doctorGrowth),
        totalBookings,
        monthlyBookings,
        bookingGrowth: parseFloat(bookingGrowth),
        totalViews: views,
        conversionRate: parseFloat(conversionRate),
        avgBookingsPerDoctor: totalDoctors > 0 ? (totalBookings / totalDoctors).toFixed(1) : 0,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        expiredBookings
      },
      trends: {
        bookings: filledDailyBookings,
        signups: weeklySignups.map(w => ({
          week: w._id,
          count: w.count
        }))
      },
      distribution: {
        byMode: bookingsByMode.map(m => ({
          mode: m._id || 'Unknown',
          count: m.count
        })),
        byTimeSlot: bookingsByTime.map(t => ({
          time: t._id,
          count: t.count
        })),
        byWeekday: bookingsByWeekday.map(w => ({
          dayOfWeek: w._id - 1, // MongoDB returns 1-7 (Sun=1), convert to 0-6
          count: w.count
        })),
        topDoctors: topDoctorsByBookings.map(d => ({
          id: d.id,
          name: d.name,
          bookings: d.bookings
        })),
        topDoctorsByViews: topDoctorsByViews.map(d => ({
          id: d.id,
          name: d.name,
          views: d.views
        }))
      },
      recent: {
        bookings: recentBookings.map(b => ({
          id: b._id,
          patientName: b.name,
          doctor: b.doctorId?.displayName || b.doctorId?.name || 'Unknown',
          doctorSubdomain: b.doctorId?.subdomain,
          mode: b.mode,
          date: b.date,
          time: b.time,
          createdAt: b.createdAt
        })),
        doctors: recentDoctors.map(d => ({
          id: d._id,
          name: d.name,
          email: d.email,
          subdomain: d.subdomain,
          isActive: d.isActive,
          createdAt: d.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Analytics overview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
