import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import Doctor from '@/models/Doctor';
import connectDB from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
const JWT_EXPIRES_IN = '30d';
const COOKIE_NAME = 'doctor_token';

/**
 * Generate JWT token for a doctor
 */
export function generateDoctorToken(doctor) {
  return jwt.sign(
    {
      doctorId: doctor._id.toString(),
      email: doctor.email,
      subdomain: doctor.subdomain,
      role: 'doctor',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify JWT token
 */
export function verifyDoctorToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}

/**
 * Set auth cookie (for API routes)
 */
export async function setAuthCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });
}

/**
 * Clear auth cookie (for logout)
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get auth cookie value
 */
export async function getAuthCookie() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value || null;
}

/**
 * Get current doctor from request (for API routes)
 * Returns doctor document or null if not authenticated
 */
export async function getCurrentDoctor(request) {
  try {
    let token = null;

    // Check Authorization header first
    const authHeader = request?.headers?.get?.('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // If no header, try to get cookie from request headers (more reliable)
    if (!token) {
      const cookieHeader = request?.headers?.get?.('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const trimmed = cookie.trim();
          const eqIndex = trimmed.indexOf('=');
          if (eqIndex > 0) {
            const key = trimmed.substring(0, eqIndex);
            const value = trimmed.substring(eqIndex + 1);
            acc[key] = value;
          }
          return acc;
        }, {});
        token = cookies[COOKIE_NAME];
        // URL decode if needed
        if (token && token.includes('%')) {
          try {
            token = decodeURIComponent(token);
          } catch (e) {
            // Ignore decode errors
          }
        }
      }
    }

    // Fallback to Next.js cookies() API
    if (!token) {
      try {
        const cookieStore = await cookies();
        const cookie = cookieStore.get(COOKIE_NAME);
        token = cookie?.value;
      } catch (cookieError) {
        // Ignore cookie access errors
      }
    }

    // Validate token - must be a proper JWT (starts with eyJ)
    if (!token || token === 'null' || token === 'undefined' || !token.startsWith('eyJ')) {
      return null;
    }

    const decoded = verifyDoctorToken(token);
    if (!decoded) {
      return null;
    }

    await connectDB();
    const doctor = await Doctor.findById(decoded.doctorId).select('-password');

    if (!doctor || !doctor.isActive || !doctor.isEmailVerified) {
      return null;
    }

    return doctor;
  } catch (error) {
    console.error('[AUTH] getCurrentDoctor error:', error.message);
    return null;
  }
}

/**
 * Check if doctor is authenticated (middleware-style for API routes)
 */
export async function isDoctorAuthenticated(request) {
  const doctor = await getCurrentDoctor(request);
  return !!doctor;
}

/**
 * Require doctor authentication (throws if not authenticated)
 * Use in API routes: const doctor = await requireDoctorAuth(request);
 */
export async function requireDoctorAuth(request) {
  const doctor = await getCurrentDoctor(request);
  if (!doctor) {
    throw new Error('Unauthorized');
  }
  return doctor;
}

/**
 * Get doctor from token (without DB lookup, for quick checks)
 */
export function getDoctorFromToken(token) {
  const decoded = verifyDoctorToken(token);
  if (!decoded) return null;
  return {
    doctorId: decoded.doctorId,
    email: decoded.email,
    subdomain: decoded.subdomain,
  };
}

/**
 * Validate subdomain format
 */
export function isValidSubdomain(subdomain) {
  if (!subdomain || typeof subdomain !== 'string') return false;
  if (subdomain.length < 3 || subdomain.length > 30) return false;

  // Must be lowercase letters, numbers, and hyphens only
  // Cannot start or end with hyphen
  const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return pattern.test(subdomain);
}

/**
 * Reserved subdomains that cannot be used
 */
export const RESERVED_SUBDOMAINS = [
  'www',
  'admin',
  'api',
  'app',
  'dashboard',
  'login',
  'signup',
  'register',
  'support',
  'help',
  'blog',
  'docs',
  'mail',
  'email',
  'ftp',
  'cdn',
  'static',
  'assets',
  'images',
  'img',
  'js',
  'css',
  'fonts',
  'test',
  'dev',
  'staging',
  'prod',
  'production',
  'demo',
  'status',
  'health',
  'metrics',
  'analytics',
  'curago',
  'team',
  'about',
  'contact',
  'pricing',
  'terms',
  'privacy',
  'legal',
];

/**
 * Check if subdomain is available
 */
export async function checkSubdomainAvailability(subdomain) {
  if (!isValidSubdomain(subdomain)) {
    return { available: false, reason: 'Invalid subdomain format' };
  }

  if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
    return { available: false, reason: 'This subdomain is reserved' };
  }

  await connectDB();
  const existing = await Doctor.findOne({ subdomain: subdomain.toLowerCase() });

  if (existing) {
    return { available: false, reason: 'Subdomain already taken' };
  }

  return { available: true };
}
