import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import ReferenceCode from '@/models/ReferenceCode';
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
      referenceCode,
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

    // Validate reference code (optional - if provided, validate it)
    let refCodeResult = null;
    if (referenceCode) {
      refCodeResult = await ReferenceCode.validateCode(referenceCode);
      if (!refCodeResult.valid) {
        return NextResponse.json(
          { error: 'INVALID_REFERENCE_CODE', message: refCodeResult.reason },
          { status: 400 }
        );
      }
    }

    // Check if email already exists
    const existingEmail = await Doctor.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      // Be specific when the account was created with Google, so the doctor knows
      // to use "Continue with Google" instead of guessing a password.
      if (existingEmail.authProvider === 'google') {
        return NextResponse.json(
          { error: 'This email is registered with Google sign-in. Please use "Continue with Google" to log in.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in instead.' },
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
      platformReferenceCode: referenceCode ? referenceCode.toUpperCase() : null,
      isEmailVerified: false,
      isActive: true,
    });

    // Generate OTP
    const otp = doctor.generateEmailOTP();

    // Save doctor
    await doctor.save();

    // Track reference code usage (only if a code was provided)
    if (refCodeResult && refCodeResult.refCode) {
      await ReferenceCode.findByIdAndUpdate(refCodeResult.refCode._id, {
        $inc: { usedCount: 1 },
        $push: { usedBy: { doctorId: doctor._id, usedAt: new Date() } },
      });
    }

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
