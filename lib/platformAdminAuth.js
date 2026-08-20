import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import PlatformAdmin from '@/models/PlatformAdmin';

// SECURITY: JWT_SECRET must be set in environment - no fallback allowed
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not set');
}
const COOKIE_NAME = 'platform_admin_token';

// Session length — admins are logged out and must sign in again after this.
// Configurable via env; defaults to 8 hours (a working session).
const SESSION_HOURS = Number(process.env.PLATFORM_ADMIN_SESSION_HOURS) || 8;
const SESSION_SECONDS = SESSION_HOURS * 60 * 60;

// Token version. Bump this (in code or via PLATFORM_ADMIN_TOKEN_VERSION) to
// instantly invalidate EVERY existing admin session — old tokens carry a
// different (or no) version and are rejected, forcing a fresh login + OTP.
const TOKEN_VERSION = String(process.env.PLATFORM_ADMIN_TOKEN_VERSION || '2');

/** Is this email a known, active admin account? (DB lookup) */
export const isAdminEmail = async (email) => {
  await connectDB();
  return PlatformAdmin.isAdminEmail(email);
};

/**
 * Validate admin credentials against the DB (bcrypt-hashed passwords).
 * Returns true on a valid email + password.
 */
export const validateAdminCredentials = async (email, password) => {
  await connectDB();
  const admin = await PlatformAdmin.validateCredentials(email, password);
  return !!admin;
};

/**
 * Generate JWT token for platform admin
 */
export const generateAdminToken = (email) => {
  const payload = {
    email: String(email).toLowerCase(),
    role: 'platform_admin',
    v: TOKEN_VERSION,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${SESSION_HOURS}h` });
};

/**
 * Verify JWT token
 */
export const verifyAdminToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'platform_admin') {
      return null;
    }
    // Reject any token that isn't on the current version (forces re-login).
    // Bumping TOKEN_VERSION invalidates every existing session. Credential/
    // account validity is enforced at login; here we stay crypto-only so this
    // remains synchronous and hits no DB on every request.
    if (String(decoded.v) !== TOKEN_VERSION) {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Set admin auth cookie
 */
export const setAdminCookie = async (token) => {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_SECONDS,
    path: '/',
  });
};

/**
 * Clear admin auth cookie
 */
export const clearAdminCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
};

/**
 * Get admin from cookie (for API routes)
 */
export const getAdminFromCookie = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyAdminToken(token);
};

/**
 * Middleware helper to check if request is from authenticated platform admin
 */
export const requirePlatformAdmin = async () => {
  const admin = await getAdminFromCookie();

  if (!admin) {
    return { authenticated: false, admin: null };
  }

  return { authenticated: true, admin };
};

/**
 * Get token from request headers (for client-side API calls)
 */
export const getAdminFromRequest = (request) => {
  // First check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyAdminToken(token);
  }

  // Then check cookie header
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => c.split('='))
    );
    const token = cookies[COOKIE_NAME];
    if (token) {
      return verifyAdminToken(token);
    }
  }

  return null;
};
