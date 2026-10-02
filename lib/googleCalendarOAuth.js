/**
 * Per-doctor Google Calendar OAuth.
 *
 * Lets a doctor connect their OWN Google account so bookings create a Google Meet
 * event on their calendar (doctor + patient as attendees) — nothing on the shared
 * CuraGo service account. Reuses the existing GMB OAuth client; override with
 * GOOGLE_CALENDAR_* env vars.
 *
 * One-time Google Cloud Console setup: add the redirect URI
 *   https://curago.in/api/doctor/google-calendar/callback
 * to the OAuth client's "Authorized redirect URIs". The calendar.events scope is
 * "sensitive", so production use needs Google app verification (same as GMB).
 */
const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_GMB_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_GMB_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL || 'https://curago.in'}/api/doctor/google-calendar/callback`;

// calendar.events = create/manage events (incl. Meet); email/profile = know which
// Google account was connected.
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'openid',
  'email',
  'profile',
];

export function isCalendarOAuthConfigured() {
  return !!(CLIENT_ID && CLIENT_SECRET);
}

// `state` carries the doctorId (verified in the callback against the session).
export function getCalendarAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',   // need a refresh token for ongoing event creation
    prompt: 'consent',        // force refresh_token every time
    include_granted_scopes: 'true',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Exchange the auth code → { refreshToken, accessToken, email }.
export async function exchangeCalendarCode(code) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
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
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error_description || 'Failed to exchange Google authorization code.');
  }
  const tokens = await res.json();
  // Which account connected? Read it from the userinfo endpoint.
  let email = '';
  try {
    const u = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }).then((r) => r.json());
    email = u?.email || '';
  } catch { /* best-effort */ }
  return { refreshToken: tokens.refresh_token || '', accessToken: tokens.access_token || '', email };
}

// Refresh an access token from a stored refresh token.
export async function refreshCalendarAccessToken(refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error_description || 'Failed to refresh Google access token.');
  }
  const t = await res.json();
  return t.access_token;
}
