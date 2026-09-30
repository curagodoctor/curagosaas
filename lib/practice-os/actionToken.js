// Signed, expiring tokens for one-tap actions from an email — publish or edit a
// day's blog page WITHOUT logging in. A token encodes { doctorId, missionId,
// action } and is HMAC-signed, so it can't be forged or retargeted, and it stops
// working after `expiresInDays`. This is the ONLY auth for the /p/* public routes.
import crypto from 'crypto';

// Reuse an existing app secret so no new env var is required (falls back through
// a few common ones). In production set ACTION_TOKEN_SECRET for a dedicated key.
const SECRET =
  process.env.ACTION_TOKEN_SECRET ||
  process.env.JWT_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  process.env.RAZORPAY_KEY_SECRET ||
  'curago-practice-os-action-token-fallback-secret';

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const fromB64url = (s) => Buffer.from(String(s), 'base64url').toString('utf8');

function sign(payloadStr) {
  return crypto.createHmac('sha256', SECRET).update(payloadStr).digest('base64url');
}

// action: 'publish' | 'edit'
export function signActionToken({ doctorId, missionId, action }, { expiresInDays = 30 } = {}) {
  const payload = {
    d: String(doctorId),
    m: String(missionId),
    a: action,
    e: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

// Returns { doctorId, missionId, action } or null if invalid/expired/tampered.
export function verifyActionToken(token) {
  try {
    const [body, sig] = String(token || '').split('.');
    if (!body || !sig) return null;
    // Constant-time compare to resist timing attacks.
    const expected = sign(body);
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(fromB64url(body));
    if (!payload?.d || !payload?.m || !payload?.a) return null;
    if (!payload.e || Date.now() > payload.e) return null;
    return { doctorId: payload.d, missionId: payload.m, action: payload.a };
  } catch {
    return null;
  }
}
