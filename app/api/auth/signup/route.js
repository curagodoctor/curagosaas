import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import { sendVerificationEmail } from '@/lib/email';
import { checkSubdomainAvailability, isValidSubdomain } from '@/lib/doctorAuth';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      subdomain,
      isLicensedProfessional,
      referralCode,
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !password || !subdomain) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!isLicensedProfessional) {
      return NextResponse.json(
        { error: 'You must confirm that you are a licensed medical professional' },
        { status: 400 }
      );
    }

    // Validate subdomain format
    if (!isValidSubdomain(subdomain)) {
      return NextResponse.json(
        { error: 'Invalid subdomain. Use only lowercase letters, numbers, and hyphens (3-30 characters)' },
        { status: 400 }
      );
    }

    // Check subdomain availability
    const subdomainCheck = await checkSubdomainAvailability(subdomain);
    if (!subdomainCheck.available) {
      return NextResponse.json(
        { error: subdomainCheck.reason },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if email already exists
    const existingEmail = await Doctor.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existingPhone = await Doctor.findOne({ phone });
    if (existingPhone) {
      return NextResponse.json(
        { error: 'An account with this phone number already exists' },
        { status: 400 }
      );
    }

    // Find referrer if referral code provided
    let referredBy = null;
    if (referralCode) {
      const referrer = await Doctor.findOne({ myReferralCode: referralCode.toUpperCase() });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    // Create doctor (password will be hashed by pre-save hook)
    const doctor = new Doctor({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      subdomain: subdomain.toLowerCase(),
      displayName: name, // Default display name to name
      whatsappNumber: phone, // Default WhatsApp to phone
      isLicensedProfessional,
      referralCode: referralCode || undefined,
      referredBy,
      isEmailVerified: false,
      isActive: true,
    });

    // Generate OTP
    const otp = doctor.generateEmailOTP();

    // Save doctor
    await doctor.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(email, otp, name);

    if (!emailResult.success) {
      // Delete the doctor if email fails (to allow retry)
      await Doctor.findByIdAndDelete(doctor._id);
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
      doctorId: doctor._id,
      email: doctor.email,
    });
  } catch (error) {
    console.error('Signup error:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        { error: `This ${field} is already registered` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
