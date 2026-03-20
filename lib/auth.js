import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// SECURITY: Session secret must be set in environment - no fallback allowed
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET;
if (!SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('CRITICAL: SESSION_SECRET or JWT_SECRET environment variable must be set');
}
const COOKIE_NAME = 'doctor_token';

/**
 * Verify admin credentials (legacy - for backwards compatibility)
 * SECURITY: Credentials must be set in environment - no defaults allowed
 * @param {string} username
 * @param {string} password
 * @returns {boolean}
 */
export const verifyAdminCredentials = (username, password) => {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.error('SECURITY: Admin credentials not configured in environment');
    return false;
  }

  return username === adminUsername && password === adminPassword;
};

/**
 * Generate JWT token
 * @param {Object} payload
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, SESSION_SECRET, { expiresIn: '30d' });
};

/**
 * Verify JWT token
 * @param {string} token
 * @returns {Object|null} Decoded token or null if invalid
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SESSION_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Middleware to check if user is authenticated (for API routes)
 * Supports both cookie-based auth (new) and Bearer token (legacy)
 * @param {Request} request
 * @returns {boolean}
 */
export const isAuthenticated = async (request) => {
  try {
    let token = null;

    // 1. First try to get token from cookie (new auth system)
    try {
      const cookieStore = await cookies();
      const cookie = cookieStore.get(COOKIE_NAME);
      if (cookie?.value) {
        token = cookie.value;
      }
    } catch (e) {
      // Cookie access may fail in some contexts, continue to header check
    }

    // 2. Fall back to Authorization header (legacy)
    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return false;
    }

    const decoded = verifyToken(token);
    return decoded !== null;
  } catch (error) {
    console.error('isAuthenticated error:', error);
    return false;
  }
};

/**
 * Get current user from token (for API routes)
 * @param {Request} request
 * @returns {Object|null}
 */
export const getCurrentUser = async (request) => {
  try {
    let token = null;

    // 1. First try to get token from cookie
    try {
      const cookieStore = await cookies();
      const cookie = cookieStore.get(COOKIE_NAME);
      if (cookie?.value) {
        token = cookie.value;
      }
    } catch (e) {
      // Continue to header check
    }

    // 2. Fall back to Authorization header
    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return null;
    }

    return verifyToken(token);
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return null;
  }
};
