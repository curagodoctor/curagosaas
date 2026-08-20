import crypto from 'crypto';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import Framework from '@/models/practice-os/Framework';
import PracticeOsPurchase from '@/models/practice-os/PracticeOsPurchase';
import PracticeOsEnrollment from '@/models/practice-os/PracticeOsEnrollment';

/**
 * Practice OS — access + payment helpers.
 *
 * Access is PER-PACK: a doctor owns a framework (pack) if it's free, if they
 * have a completed PracticeOsPurchase for it, or (in dev) via the bypass. There
 * is no single global Practice OS price or access flag anymore.
 */

// The price of a specific pack, in rupees. 0 = free. Requires a DB connection.
export async function getFrameworkPriceInr(frameworkId) {
  const fw = await Framework.findById(frameworkId).select('priceInInr').lean();
  return Math.max(0, fw?.priceInInr || 0);
}

// GST percentage added on top of the pack price at checkout. Configurable via
// PRACTICE_OS_GST_PERCENT; defaults to 18% (standard GST for digital services in India).
export function getGstPercent() {
  const n = parseFloat(process.env.PRACTICE_OS_GST_PERCENT || '');
  return Number.isFinite(n) && n >= 0 ? n : 18;
}

// Price breakdown for a base amount: { base, gst, total, pct } (all rupees).
export function computeGst(baseInr) {
  const pct = getGstPercent();
  const base = Math.max(0, Math.round(Number(baseInr) || 0));
  const gst = Math.round((base * pct) / 100);
  return { base, gst, total: base + gst, pct };
}

/**
 * Does this doctor have access to this pack? Pass the framework document (or its
 * id). Free packs and the dev bypass are always accessible; otherwise a
 * completed purchase for (doctor, pack) is required.
 */
// True while the doctor is still working through a paid Practice Builder pack —
// i.e. they bought a pack and haven't completed all its missions yet. Used to
// bundle the Website Builder premium features in FOR THE DURATION of the pack;
// once every purchased pack is completed, this returns false and they're back on
// the free tier (asked to subscribe). Free-pack access does NOT count.
export async function hasActivePracticeBuilder(doctorId) {
  // Only real per-pack purchases count (must have a frameworkId) — legacy global
  // purchases with no pack can never be "completed", so they don't grant premium.
  const purchases = await PracticeOsPurchase.find({ doctorId, status: 'completed', frameworkId: { $ne: null } }).select('frameworkId').lean();
  let purchasedIds = purchases.map((p) => String(p.frameworkId)).filter((id) => id && id !== 'undefined');
  if (!purchasedIds.length) return false;
  // Ignore purchases whose pack no longer exists (deleted / ghost entitlements) —
  // a deleted pack must not silently keep the Website Builder bundle alive.
  const existing = await Framework.find({ _id: { $in: purchasedIds } }).select('_id').lean();
  const existingIds = new Set(existing.map((f) => String(f._id)));
  purchasedIds = purchasedIds.filter((id) => existingIds.has(id));
  if (!purchasedIds.length) return false;
  // Packs whose enrollment is fully completed (all missions done).
  const completed = await PracticeOsEnrollment.find({ doctorId, status: 'completed' }).select('frameworkId').lean();
  const completedIds = new Set(completed.map((e) => String(e.frameworkId)));
  // Still active if at least one purchased pack isn't finished yet.
  return purchasedIds.some((id) => !completedIds.has(id));
}

export async function hasPackAccess(doctorId, frameworkOrId) {
  if (isDevPaymentBypass()) return true;
  const fw = frameworkOrId && frameworkOrId._id
    ? frameworkOrId
    : await Framework.findById(frameworkOrId).select('priceInInr isActive isPublished').lean();
  if (!fw) return false;
  if ((fw.priceInInr || 0) <= 0) return true; // free pack
  const paid = await PracticeOsPurchase.findOne({
    doctorId, frameworkId: fw._id, status: 'completed',
  }).select('_id').lean();
  return !!paid;
}

/**
 * Require an authenticated doctor. (Per-pack entitlement is enforced downstream
 * by the engine via hasPackAccess, since access is no longer a global flag.)
 * Throws Error('Unauthorized') if not logged in.
 */
export async function requirePracticeOsDoctor(request) {
  return requireDoctorAuth(request);
}

// Throw PaymentRequired if the doctor doesn't own the given pack.
export async function assertPackAccess(doctorId, frameworkOrId) {
  if (!(await hasPackAccess(doctorId, frameworkOrId))) {
    const err = new Error('PaymentRequired');
    err.code = 'PaymentRequired';
    throw err;
  }
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
