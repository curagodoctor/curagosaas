import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { validateAdminCredentials } from '@/lib/platformAdminAuth';
import PlatformAdminOtp from '@/models/PlatformAdminOtp';
import { sendPlatformAdminOtpEmail } from '@/lib/email';

// Step 1 of 2: verify email + password, then email a one-time code.
// No session cookie is issued here — that only happens after OTP verification.
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate credentials against the admin accounts in the DB
    const isValid = await validateAdminCredentials(email, password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    await connectDB();

    // Issue + email a one-time code. We do NOT reveal the code in the response.
    const { code } = await PlatformAdminOtp.issue(email);
    const sent = await sendPlatformAdminOtpEmail(email.toLowerCase(), code);

    if (!sent?.success) {
      console.error('Failed to send admin OTP email:', sent?.error);
      return NextResponse.json(
        { error: 'Could not send your verification code. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      otpRequired: true,
      email: email.toLowerCase(),
      message: 'A verification code has been sent to your email.',
    });
  } catch (error) {
    console.error('Platform admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 500 }
    );
  }
}
