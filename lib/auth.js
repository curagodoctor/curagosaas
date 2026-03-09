import jwt from "jsonwebtoken";

const SESSION_SECRET = process.env.SESSION_SECRET || "fallback-secret-key";

/**
 * Verify admin credentials
 * @param {string} username
 * @param {string} password
 * @returns {boolean}
 */
export const verifyAdminCredentials = (username, password) => {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  // Log environment variable status (only once during cold start)
  if (!global._authConfigLogged) {
    console.log("Auth config loaded:", {
      usernameConfigured: !!process.env.ADMIN_USERNAME,
      passwordConfigured: !!process.env.ADMIN_PASSWORD,
      sessionSecretConfigured: !!process.env.SESSION_SECRET,
    });
    global._authConfigLogged = true;
  }

  return username === adminUsername && password === adminPassword;
};

/**
 * Generate JWT token
 * @param {Object} payload
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
  // Set expiration to 30 days for admin sessions
  return jwt.sign(payload, SESSION_SECRET, { expiresIn: '30d' });
};

/**
 * Verify JWT token
 * @param {string} token
 * @returns {Object|null} Decoded token or null if invalid
 */
export const verifyToken = (token) => {
  try {
    console.log('verifyToken - SESSION_SECRET exists:', !!SESSION_SECRET); // Debug
    const result = jwt.verify(token, SESSION_SECRET);
    console.log('verifyToken - success:', result); // Debug
    return result;
  } catch (error) {
    console.log('verifyToken - error:', error.message); // Debug
    return null;
  }
};

/**
 * Middleware to check if user is authenticated (for API routes)
 * @param {Request} request
 * @returns {boolean}
 */
export const isAuthenticated = (request) => {
  try {
    const authHeader = request.headers.get("authorization");
    console.log('isAuthenticated - authHeader:', authHeader); // Debug

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log('isAuthenticated - No valid auth header'); // Debug
      return false;
    }

    const token = authHeader.substring(7);
    console.log('isAuthenticated - token:', token.substring(0, 20) + '...'); // Debug (partial)

    const decoded = verifyToken(token);
    console.log('isAuthenticated - decoded:', decoded); // Debug

    return decoded !== null;
  } catch (error) {
    console.log('isAuthenticated - error:', error); // Debug
    return false;
  }
};
