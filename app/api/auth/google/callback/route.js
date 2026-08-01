import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import { generateDoctorToken } from '@/lib/doctorAuth';
import { exchangeCodeForUser } from '@/lib/googleAuth';

export const runtime = 'nodejs';

// Both entry points land on the shared /app shell. When Razorpay is built (last),
// a practice-os entry without access will route through checkout before /app.
const DEST = {
  'website-builder': '/app',
  'practice-os': '/app',
};

function redirectTo(origin, path) {
  return NextResponse.redirect(new URL(path, origin));
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const stateRaw = searchParams.get('state');
  const oauthError = searchParams.get('error');

  if (oauthError || !code || !stateRaw) {
    return redirectTo(origin, '/login?error=google');
  }

  // Decode + CSRF-check state.
  let entry = 'website-builder';
  try {
    const state = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8'));
    entry = state.entry === 'practice-os' ? 'practice-os' : 'website-builder';
    const cookieNonce = request.cookies.get('g_oauth_state')?.value;
    if (!cookieNonce || cookieNonce !== state.nonce) {
      return redirectTo(origin, '/login?error=state');
    }
  } catch {
    return redirectTo(origin, '/login?error=state');
  }

  try {
    const gUser = await exchangeCodeForUser(code);
    await connectDB();

    // Match by googleId first, then by email (link existing password account).
    let doctor = await Doctor.findOne({ googleId: gUser.googleId });
    if (!doctor) doctor = await Doctor.findOne({ email: gUser.email });

    if (!doctor) {
      doctor = await Doctor.create({
        name: gUser.name,
        email: gUser.email,
        displayName: gUser.name,
        profileImage: gUser.picture || null,
        authProvider: 'google',
        googleId: gUser.googleId,
        isEmailVerified: true,
        isActive: true,
        websiteBuilderActive: entry === 'website-builder',
        // practiceOsActive stays false until payment
      });
    } else {
      // Link Google to an existing account + activate the entry product.
      if (!doctor.googleId) doctor.googleId = gUser.googleId;
      if (!doctor.profileImage && gUser.picture) doctor.profileImage = gUser.picture;
      doctor.isEmailVerified = true;
      if (entry === 'website-builder') doctor.websiteBuilderActive = true;
      doctor.lastLoginAt = new Date();
      await doctor.save();
    }

    if (!doctor.isActive) {
      return redirectTo(origin, '/login?error=suspended');
    }

    const dest = DEST[entry] || '/app';
    const token = generateDoctorToken(doctor);
    const res = redirectTo(origin, dest);
    res.cookies.set('doctor_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
    res.cookies.delete('g_oauth_state');
    return res;
  } catch (error) {
    console.error('[Google OAuth callback]', error.message);
    return redirectTo(origin, '/login?error=google');
  }
}
