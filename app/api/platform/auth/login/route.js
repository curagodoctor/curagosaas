import { NextResponse } from 'next/server';
import {
  validateAdminCredentials,
  generateAdminToken,
  setAdminCookie,
} from '@/lib/platformAdminAuth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate credentials against environment variables
    const isValid = validateAdminCredentials(email, password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token and set cookie
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
    console.error('Platform admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 500 }
    );
  }
}
