import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import {
  isAdminEmail,
  generateAdminToken,
  setAdminCookie,
} from '@/lib/platformAdminAuth';
import PlatformAdminOtp from '@/models/PlatformAdminOtp';

// Step 2 of 2: verify the emailed OTP, then issue the session cookie.
export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Only proceed for a configured admin email (defends against verifying an
    // OTP row for a non-admin, and against stale accounts).
    if (!(await isAdminEmail(email))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await connectDB();

    const result = await PlatformAdminOtp.verify(email, otp);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // OTP good — issue the short-lived, versioned session.
    const token = generateAdminToken(email);
    await setAdminCookie(token);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      admin: {
        email: email.toLowerCase(),
        role: 'platform_admin',
      },
    });
  } catch (error) {
    console.error('Platform admin OTP verify error:', error);
    return NextResponse.json(
      { error: 'Verification failed', details: error.message },
      { status: 500 }
    );
  }
}
