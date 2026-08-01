import crypto from 'crypto';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import PracticeOsSettings from '@/models/practice-os/PracticeOsSettings';

/**
 * Practice OS — access + payment helpers.
 *
 * Access is gated by the `Doctor.practiceOsActive` flag, which is flipped true
 * by a successful Razorpay purchase (or a manual grant by a platform admin).
 */

// Price of the Practice OS programme, in rupees. Stored in the DB so the founder
// can change it from the dashboard without an env change (PRD §1). Falls back to
// the env var / ₹5,000 only if the settings read fails. Requires a DB connection.
export async function getPracticeOsPriceInr() {
  try {
    const settings = await PracticeOsSettings.getSettings();
    if (settings?.priceInInr > 0) return settings.priceInInr;
  } catch (e) {
    console.error('[Practice OS price] settings read failed:', e.message);
  }
  const n = parseInt(process.env.PRACTICE_OS_PRICE_INR || '', 10);
  return Number.isFinite(n) && n > 0 ? n : 5000;
}

/**
 * Require an authenticated doctor who has paid for (or been granted) Practice OS.
 * Throws Error('Unauthorized') if not logged in, Error('PaymentRequired') if
 * logged in but without access. Returns the doctor document otherwise.
 */
export async function requirePracticeOsDoctor(request) {
  const doctor = await requireDoctorAuth(request);
  if (!doctor.practiceOsActive) {
    const err = new Error('PaymentRequired');
    err.code = 'PaymentRequired';
    throw err;
  }
  return doctor;
}

/**
 * Practice OS uses its OWN Razorpay account, separate from the SaaS subscription
 * (which uses RAZORPAY_*). Set PRACTICE_OS_RAZORPAY_* to bill through the dedicated
 * dashboard; until then it falls back to the shared keys so checkout still works.
 */
export function getPracticeOsRazorpay() {
  return {
    keyId: process.env.PRACTICE_OS_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.PRACTICE_OS_RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.PRACTICE_OS_RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET || '',
    publicKeyId:
      process.env.NEXT_PUBLIC_PRACTICE_OS_RAZORPAY_KEY_ID ||
      process.env.PRACTICE_OS_RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      '',
  };
}

// Dev-only payment bypass. Requires BOTH a non-production build AND an explicit
// env flag, so it can never be enabled on Vercel/production by accident.
export function isDevPaymentBypass() {
  return process.env.NODE_ENV !== 'production' && process.env.PRACTICE_OS_DEV_BYPASS === 'true';
}

// Strict Razorpay signature check: HMAC-SHA256(order_id|payment_id, keySecret).
export function verifyRazorpaySignature(orderId, paymentId, signature) {
  if (!orderId || !paymentId || !signature) return false;
  const { keySecret } = getPracticeOsRazorpay();
  if (!keySecret) return false;
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

// Razorpay WEBHOOK signature check (HMAC-SHA256 of the raw body with the webhook secret).
export function verifyPracticeOsWebhookSignature(rawBody, signature) {
  if (!rawBody || !signature) return false;
  const { webhookSecret } = getPracticeOsRazorpay();
  if (!webhookSecret) return false;
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
