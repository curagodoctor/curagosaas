import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import BookingPage from '@/models/BookingPage';

// GET - Get public site data for a subdomain
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { subdomain } = await params;

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    // Find doctor by subdomain
    const doctor = await Doctor.findOne({
      subdomain: subdomain.toLowerCase(),
      isActive: true,
      isEmailVerified: true,
    }).select('-password -emailOTP -emailOTPExpiry').lean();

    if (!doctor) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Get the main booking page for this doctor
    const bookingPage = await BookingPage.findOne({
      doctorId: doctor._id,
      status: 'published',
    }).sort({ createdAt: 1 }).lean();

    // Increment views
    if (bookingPage) {
      await BookingPage.findByIdAndUpdate(bookingPage._id, {
        $inc: { views: 1 }
      });
    }

    return NextResponse.json({
      success: true,
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        displayName: doctor.displayName,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        profileImage: doctor.profileImage,
        bio: doctor.bio,
        whatsappNumber: doctor.whatsappNumber,
        subdomain: doctor.subdomain,
      },
      page: bookingPage ? {
        _id: bookingPage._id,
        title: bookingPage.title,
        slug: bookingPage.slug,
        metaDescription: bookingPage.metaDescription,
        sections: bookingPage.sections?.filter(s => s.visible !== false) || [],
        themeColor: bookingPage.themeColor,
        ogImage: bookingPage.ogImage,
      } : null,
    });
  } catch (error) {
    console.error('Get public site error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
