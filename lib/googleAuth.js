/**
 * Google Sign-In (OAuth) — basic account sign-in/up.
 *
 * Uses only the non-sensitive `openid email profile` scopes, so it does NOT
 * require Google app verification (unlike calendar/GMB scopes). Reuses the
 * existing GMB OAuth client by default; override with GOOGLE_OAUTH_* env vars.
 *
 * IMPORTANT (one-time setup): add the redirect URI
 *   https://curago.in/api/auth/google/callback
 * to the OAuth client's "Authorized redirect URIs" in Google Cloud Console.
 */

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_GMB_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_GMB_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.GOOGLE_OAUTH_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL || 'https://curago.in'}/api/auth/google/callback`;

export function isGoogleAuthConfigured() {
  return !!(CLIENT_ID && CLIENT_SECRET);
}

export function getRedirectUri() {
  return REDIRECT_URI;
}

/**
 * Build the Google consent URL. `state` is our signed/opaque anti-CSRF token
 * (also carries the entry point).
 */
export function buildGoogleAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
    include_granted_scopes: 'true',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange the auth code for the user's Google profile.
 * @returns {Promise<{email, name, picture, googleId, emailVerified}>}
 */
export async function exchangeCodeForUser(code) {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokens.access_token) {
    throw new Error(tokens.error_description || tokens.error || 'Google token exchange failed');
  }

  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const u = await userRes.json();
  if (!u.email) throw new Error('Google did not return an email');

  return {
    email: String(u.email).toLowerCase(),
    name: u.name || u.given_name || u.email.split('@')[0],
    picture: u.picture || null,
    googleId: u.sub,
    emailVerified: u.email_verified !== false,
  };
}
