import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { buildGoogleAuthUrl, isGoogleAuthConfigured } from '@/lib/googleAuth';

export const runtime = 'nodejs';

// GET /api/auth/google?entry=practice-os|website-builder
// Kicks off Google sign-in. The entry point is preserved through `state` so the
// callback knows where to route the user afterwards.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const entry = searchParams.get('entry') === 'practice-os' ? 'practice-os' : 'website-builder';

  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(new URL('/login?error=google_unavailable', origin));
  }

  // Anti-CSRF: random nonce in an httpOnly cookie, echoed in `state`.
  const nonce = crypto.randomUUID();
  const state = Buffer.from(JSON.stringify({ entry, nonce })).toString('base64url');

  const res = NextResponse.redirect(buildGoogleAuthUrl(state));
  res.cookies.set('g_oauth_state', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60,
    path: '/',
  });
  return res;
}
