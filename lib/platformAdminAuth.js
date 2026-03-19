import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const COOKIE_NAME = 'platform_admin_token';
const TOKEN_EXPIRY = '7d';

// Environment-based admin credentials
const PLATFORM_ADMIN_EMAIL = process.env.PLATFORM_ADMIN_EMAIL;
const PLATFORM_ADMIN_PASSWORD = process.env.PLATFORM_ADMIN_PASSWORD;

/**
 * Validate admin credentials against environment variables
 */
export const validateAdminCredentials = (email, password) => {
  if (!PLATFORM_ADMIN_EMAIL || !PLATFORM_ADMIN_PASSWORD) {
    console.error('Platform admin credentials not configured in environment');
    return false;
  }

  return (
    email.toLowerCase() === PLATFORM_ADMIN_EMAIL.toLowerCase() &&
    password === PLATFORM_ADMIN_PASSWORD
  );
};

/**
 * Generate JWT token for platform admin
 */
export const generateAdminToken = (email) => {
  const payload = {
    email: email.toLowerCase(),
    role: 'platform_admin',
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
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
    maxAge: 7 * 24 * 60 * 60, // 7 days
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
