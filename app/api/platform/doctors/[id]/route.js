import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Booking from '@/models/Booking';
import BookingPage from '@/models/BookingPage';

// GET - Get single doctor with full details
export async function GET(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const doctor = await Doctor.findById(id)
      .select('-password -emailVerificationOTP -emailVerificationExpiry')
      .lean();

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Get booking stats
    const [totalBookings, confirmedBookings, bookingPages] = await Promise.all([
      Booking.countDocuments({ doctorId: id }),
      Booking.countDocuments({ doctorId: id, status: 'confirmed' }),
      BookingPage.find({ doctorId: id })
        .select('slug title status views bookings publishedAt')
        .lean()
    ]);

    // Calculate total views and page bookings
    const totalViews = bookingPages.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalPageBookings = bookingPages.reduce((sum, p) => sum + (p.bookings || 0), 0);

    return NextResponse.json({
      doctor: {
        ...doctor,
        stats: {
          totalBookings,
          confirmedBookings,
          totalViews,
          totalPageBookings,
          bookingPagesCount: bookingPages.length
        }
      },
      bookingPages
    });

  } catch (error) {
    console.error('Get doctor error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctor' },
      { status: 500 }
    );
  }
}

// PATCH - Update doctor
export async function PATCH(request, { params }) {
  try {
    const { authenticated, admin } = await requirePlatformAdmin();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Fields that platform admin can update
    const allowedFields = [
      'name',
      'displayName',
      'specialization',
      'qualification',
      'bio',
      'whatsappNumber',
      'profileImage',
      'licenseNumber',
      'timezone',
      'isEmailVerified',
      'isActive'
    ];

    // Apply updates
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        doctor[field] = body[field];
      }
    }

    // Track suspension
    if (body.isActive === false && doctor.isActive === true) {
      doctor.suspendedAt = new Date();
      doctor.suspendedReason = body.suspendReason || 'Suspended by platform admin';
    } else if (body.isActive === true && doctor.isActive === false) {
      doctor.suspendedAt = null;
      doctor.suspendedReason = null;
    }

    await doctor.save();

    return NextResponse.json({
      success: true,
      message: 'Doctor updated successfully',
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        subdomain: doctor.subdomain,
        isActive: doctor.isActive,
        isEmailVerified: doctor.isEmailVerified
      }
    });

  } catch (error) {
    console.error('Update doctor error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return NextResponse.json(
        { error: messages.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update doctor' },
      { status: 500 }
    );
  }
}
