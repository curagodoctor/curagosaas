import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import BookingPage from '@/models/BookingPage';
import { generateDoctorToken, setAuthCookie } from '@/lib/doctorAuth';
import { sendWelcomeEmail } from '@/lib/email';
import { initializeDefaultModes } from '@/lib/slotManagerDB';

// Create default website for new doctor
async function createDefaultWebsite(doctor) {
  // Check if website already exists
  const existing = await BookingPage.findOne({ doctorId: doctor._id });
  if (existing) return existing;

  const defaultSections = [
    {
      type: 'doctor_profile',
      order: 0,
      visible: true,
      config: {
        name: doctor.displayName || doctor.name,
        title: doctor.specialization || 'Medical Professional',
        qualifications: doctor.qualification || '',
        bio: doctor.bio || `Welcome to my clinic. I am committed to providing quality healthcare.`,
        imageUrl: doctor.profileImage || '',
        showBookButton: true,
      },
    },
    {
      type: 'booking_form',
      order: 1,
      visible: true,
      config: {
        title: 'Book Your Consultation',
        subtitle: 'Choose your preferred consultation mode and time slot',
      },
    },
    {
      type: 'whatsapp_sticky',
      order: 2,
      visible: true,
      config: {
        phoneNumber: doctor.whatsappNumber || doctor.phone,
        message: `Hi Dr. ${doctor.name}, I would like to book a consultation.`,
        buttonText: 'Book via WhatsApp',
      },
    },
    {
      type: 'footer',
      order: 3,
      visible: true,
      config: {
        showPoweredBy: true,
      },
    },
  ];

  const website = new BookingPage({
    doctorId: doctor._id,
    slug: 'home',
    title: doctor.displayName || doctor.name,
    metaDescription: `Book a consultation with ${doctor.displayName || doctor.name}`,
    status: 'published',
    publishedAt: new Date(),
    sections: defaultSections,
    paymentMode: 'no_payment',
    consultationFee: 0,
    bookingFee: 0,
    createdBy: 'system',
  });

  await website.save();
  return website;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find doctor with OTP fields included
    const doctor = await Doctor.findOne({ email: email.toLowerCase() })
      .select('+emailVerificationOTP +emailVerificationExpiry');

    if (!doctor) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (doctor.isEmailVerified) {
      return NextResponse.json(
        { error: 'Email already verified. Please login.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (!doctor.verifyEmailOTP(otp)) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark as verified
    doctor.isEmailVerified = true;
    doctor.emailVerificationOTP = undefined;
    doctor.emailVerificationExpiry = undefined;
    doctor.lastLoginAt = new Date();
    await doctor.save();

    // Create default website and consultation modes for new doctor
    try {
      await createDefaultWebsite(doctor);
      await initializeDefaultModes(doctor._id);
      console.log(`Default website and modes created for doctor: ${doctor.subdomain}`);
    } catch (err) {
      console.error('Error creating default website/modes:', err);
      // Don't fail verification if this fails
    }

    // Generate token
    const token = generateDoctorToken(doctor);

    // Set cookie
    await setAuthCookie(token);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(doctor.email, doctor.name, doctor.subdomain).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    // Return success with doctor info (exclude sensitive fields)
    const doctorData = {
      _id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      subdomain: doctor.subdomain,
      displayName: doctor.displayName,
    };

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      doctor: doctorData,
      token, // Also return token for client-side storage if needed
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// Resend OTP
export async function PUT(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const doctor = await Doctor.findOne({ email: email.toLowerCase() })
      .select('+emailVerificationOTP +emailVerificationExpiry');

    if (!doctor) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (doctor.isEmailVerified) {
      return NextResponse.json(
        { error: 'Email already verified. Please login.' },
        { status: 400 }
      );
    }

    // Generate new OTP
    const otp = doctor.generateEmailOTP();
    await doctor.save();

    // Send verification email
    const { sendVerificationEmail } = await import('@/lib/email');
    const emailResult = await sendVerificationEmail(email, otp, doctor.name);

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'New OTP sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
