import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Booking from '@/models/Booking';
import BookingPage from '@/models/BookingPage';
import Contact from '@/models/Contact';
import ContactStatus from '@/models/ContactStatus';
import Workflow from '@/models/Workflow';
import WorkflowExecution from '@/models/WorkflowExecution';
import MessageTemplate from '@/models/MessageTemplate';
import MessageLog from '@/models/MessageLog';
import MessageQuota from '@/models/MessageQuota';
import TimeSlot from '@/models/TimeSlot';
import WeeklySchedule from '@/models/WeeklySchedule';
import DateOverride from '@/models/DateOverride';
import ConsultationMode from '@/models/ConsultationMode';
import MeetingLink from '@/models/MeetingLink';
import Subscription from '@/models/Subscription';
import AIToken from '@/models/AIToken';
import ReviewRequest from '@/models/ReviewRequest';
import ReviewRequestTemplate from '@/models/ReviewRequestTemplate';
import GmbConnection from '@/models/GmbConnection';
import GmbPost from '@/models/GmbPost';
import GmbReview from '@/models/GmbReview';
import GmbInsight from '@/models/GmbInsight';
import GmbFaq from '@/models/GmbFaq';
import Clinic from '@/models/Clinic';
import ClinicManager from '@/models/ClinicManager';
import SEOUser from '@/models/SEOUser';
import BlogArticle from '@/models/BlogArticle';

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

// DELETE - Remove doctor and all related data
export async function DELETE(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const doctorName = doctor.name;
    const doctorEmail = doctor.email;

    // Delete all related data in parallel
    const results = await Promise.allSettled([
      Booking.deleteMany({ doctorId: id }),
      BookingPage.deleteMany({ doctorId: id }),
      Contact.deleteMany({ doctorId: id }),
      ContactStatus.deleteMany({ doctorId: id }),
      Workflow.deleteMany({ doctorId: id }),
      WorkflowExecution.deleteMany({ doctorId: id }),
      MessageTemplate.deleteMany({ doctorId: id }),
      MessageLog.deleteMany({ doctorId: id }),
      MessageQuota.deleteMany({ doctorId: id }),
      TimeSlot.deleteMany({ doctorId: id }),
      WeeklySchedule.deleteMany({ doctorId: id }),
      DateOverride.deleteMany({ doctorId: id }),
      ConsultationMode.deleteMany({ doctorId: id }),
      MeetingLink.deleteMany({ doctorId: id }),
      Subscription.deleteMany({ doctorId: id }),
      AIToken.deleteMany({ doctorId: id }),
      ReviewRequest.deleteMany({ doctorId: id }),
      ReviewRequestTemplate.deleteMany({ doctorId: id }),
      GmbConnection.deleteMany({ doctorId: id }),
      GmbPost.deleteMany({ doctorId: id }),
      GmbReview.deleteMany({ doctorId: id }),
      GmbInsight.deleteMany({ doctorId: id }),
      GmbFaq.deleteMany({ doctorId: id }),
      Clinic.deleteMany({ doctorId: id }),
      ClinicManager.deleteMany({ doctorId: id }),
      SEOUser.deleteMany({ doctorId: id }),
      BlogArticle.deleteMany({ doctorId: id }),
    ]);

    // Count deleted records
    const deleted = {};
    const modelNames = [
      'bookings', 'bookingPages', 'contacts', 'contactStatuses',
      'workflows', 'workflowExecutions', 'messageTemplates', 'messageLogs',
      'messageQuotas', 'timeSlots', 'weeklySchedules', 'dateOverrides',
      'consultationModes', 'meetingLinks', 'subscriptions', 'aiTokens',
      'reviewRequests', 'reviewRequestTemplates', 'gmbConnections', 'gmbPosts',
      'gmbReviews', 'gmbInsights', 'gmbFaqs', 'clinics', 'clinicManagers',
      'seoUsers', 'blogArticles'
    ];

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        deleted[modelNames[i]] = result.value.deletedCount || 0;
      }
    });

    // Delete the doctor record itself
    await Doctor.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Doctor "${doctorName}" (${doctorEmail}) and all related data deleted`,
      deleted
    });

  } catch (error) {
    console.error('Delete doctor error:', error);
    return NextResponse.json(
      { error: 'Failed to delete doctor' },
      { status: 500 }
    );
  }
}
