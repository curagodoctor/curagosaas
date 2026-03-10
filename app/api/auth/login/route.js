import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import { generateDoctorToken, setAuthCookie } from '@/lib/doctorAuth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find doctor with password field included
    const doctor = await Doctor.findOne({ email: email.toLowerCase() })
      .select('+password');

    if (!doctor) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!doctor.isEmailVerified) {
      return NextResponse.json(
        {
          error: 'Please verify your email first',
          needsVerification: true,
          email: doctor.email,
        },
        { status: 403 }
      );
    }

    // Check if account is active
    if (!doctor.isActive) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await doctor.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    doctor.lastLoginAt = new Date();
    await doctor.save();

    // Generate token
    const token = generateDoctorToken(doctor);

    // Set cookie
    await setAuthCookie(token);

    // Return success with doctor info (exclude sensitive fields)
    const doctorData = {
      _id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      subdomain: doctor.subdomain,
      displayName: doctor.displayName,
      profileImage: doctor.profileImage,
    };

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      doctor: doctorData,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
