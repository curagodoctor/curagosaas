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

// Does this doctor have AI access (the paid tier)? AI features — generate/edit
// site, generate blog/page — are PAID only. A doctor has AI if they're mid-pack
// (hasActivePracticeBuilder) OR bought any paid pack within the validity window
// (default 30 days, PRACTICE_OS_AI_VALIDITY_DAYS). The free tier (manual builder
// only, no completed purchase) gets no AI.
export async function hasAiAccess(doctorId) {
  if (isDevPaymentBypass()) return true;
  if (await hasActivePracticeBuilder(doctorId)) return true;
  const validityDays = parseInt(process.env.PRACTICE_OS_AI_VALIDITY_DAYS, 10) > 0
    ? parseInt(process.env.PRACTICE_OS_AI_VALIDITY_DAYS, 10) : 30;
  const cutoff = new Date(Date.now() - validityDays * 24 * 60 * 60 * 1000);
  const recent = await PracticeOsPurchase.findOne({
    doctorId, status: 'completed', frameworkId: { $ne: null }, createdAt: { $gte: cutoff },
  }).select('_id').lean();
  return !!recent;
}

// Throw PaymentRequired when the doctor isn't on the paid (AI) tier.
export async function assertAiAccess(doctorId) {
  if (await hasAiAccess(doctorId)) return; // paid tier
  // §4 — free tier is allowed as long as it still has lifetime credits left.
  const AiCreditLedger = (await import('@/models/practice-os/AiCreditLedger')).default;
  const ledger = await AiCreditLedger.getOrCreateForToday(doctorId, false);
  if ((ledger?.dailyBalance || 0) > 0) return;
  const err = new Error('PaymentRequired');
  err.code = 'PaymentRequired';
  throw err;
}

// Is a pack unlocked for this doctor? A normal pack is always unlocked. A
// continuation pack unlocks only once the doctor has COMPLETED its prerequisite
// pack (PracticeOsEnrollment.status === 'completed'). Returns
// { unlocked, prerequisiteFrameworkId } so callers can show a "locked" state.
export async function getPackUnlockState(doctorId, frameworkOrId) {
  const fw = frameworkOrId && frameworkOrId._id
    ? frameworkOrId
    : await Framework.findById(frameworkOrId).select('isContinuation prerequisiteFrameworkId').lean();
  if (!fw) return { unlocked: false, prerequisiteFrameworkId: null };
  if (!fw.isContinuation || !fw.prerequisiteFrameworkId) return { unlocked: true, prerequisiteFrameworkId: null };
  if (isDevPaymentBypass()) return { unlocked: true, prerequisiteFrameworkId: String(fw.prerequisiteFrameworkId) };
  const done = await PracticeOsEnrollment.findOne({
    doctorId, frameworkId: fw.prerequisiteFrameworkId, status: 'completed',
  }).select('_id').lean();
  return { unlocked: !!done, prerequisiteFrameworkId: String(fw.prerequisiteFrameworkId) };
}

// Throw a typed error if a continuation pack's prerequisite isn't completed.
export async function assertPackUnlocked(doctorId, frameworkOrId) {
  const { unlocked } = await getPackUnlockState(doctorId, frameworkOrId);
  if (!unlocked) {
    const err = new Error('PackLocked');
    err.code = 'PackLocked';
    throw err;
  }
}

export async function hasPackAccess(doctorId, frameworkOrId) {
  if (isDevPaymentBypass()) return true;
  const fw = frameworkOrId && frameworkOrId._id
    ? frameworkOrId
    : await Framework.findById(frameworkOrId).select('priceInInr isActive isPublished tier').lean();
  if (!fw) return false;
  // §3 v1 — optimization (daily-engine) packs ALWAYS sit behind the founder's Get
  // Access grant, even when priced 0 — otherwise a free daily pack would be
  // "owned" by every doctor (incl. those still under review). Check the grant
  // first, before the free-pack bypass.
  if ((fw.tier || 'optimization') === 'optimization') {
    // Active OR grace OR locked (view-only) — i.e. anyone who has EVER had access
    // can still see the pack. New-task unlocking and completion are gated by phase
    // in the engine (grace freezes new tasks; locked is view-only).
    const { phase } = await getOptimizationAccessState(doctorId);
    return phase !== 'none';
  }
  if ((fw.priceInInr || 0) <= 0) return true; // free (setup) pack
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

/**
 * §7 — has the founder granted this doctor access to the optimization work?
 * The setup funnel is always free; optimization sits behind this flag, set when
 * the founder approves the doctor's access request. Reads the per-doctor profile.
 */
export async function hasOptimizationAccess(doctorId) {
  const PracticeOsProfile = (await import('@/models/practice-os/PracticeOsProfile')).default;
  const profile = await PracticeOsProfile.findOne({ doctorId }).select('optimizationAccess').lean();
  const a = profile?.optimizationAccess;
  if (a?.granted && a?.permanent) return true; // founder override — never expires
  // A 30-day grant (legacy grants without expiresAt are grandfathered as valid).
  if (a?.granted && (!a.expiresAt || new Date(a.expiresAt) > new Date())) return true;
  // A paid ₹5,000/mo subscription keeps access on after the free month.
  return hasActiveOptimizationSubscription(doctorId);
}

// Active recurring subscription for the optimization tier (₹5,000/mo). Kept in a
// dedicated helper so the payment layer can flip it via the Razorpay webhook.
export async function hasActiveOptimizationSubscription(doctorId) {
  const OptimizationSubscription = (await import('@/models/practice-os/OptimizationSubscription')).default;
  const sub = await OptimizationSubscription.findOne({ doctorId, status: 'active' })
    .select('currentPeriodEnd status').lean();
  if (!sub) return false;
  return !sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > new Date();
}

// Grace window (days) after access ends, during which the doctor can still finish
// their already-unlocked backlog before everything goes view-only.
export const OPTIMIZATION_GRACE_DAYS = 7;

/**
 * The doctor's optimization access PHASE, for cadence:
 *  - 'active' : entitled now (free 28-day grant, founder-permanent, or paid sub).
 *              New tasks keep unlocking daily.
 *  - 'grace'  : access ended within the last 7 days (they cancelled the sub, or the
 *              free access lapsed without subscribing). NO new tasks unlock, but they
 *              may finish the already-unlocked backlog (still capped 7/day).
 *  - 'locked' : grace is over. View-only — they can see tasks/content but not finish
 *              or generate until they resubscribe.
 *  - 'none'   : never had access.
 * `accessEndAt` is when entitlement lapsed; `graceEndAt` = accessEndAt + 7 days.
 */
export async function getOptimizationAccessState(doctorId) {
  if (isDevPaymentBypass()) return { phase: 'active', accessEndAt: null, graceEndAt: null };
  const PracticeOsProfile = (await import('@/models/practice-os/PracticeOsProfile')).default;
  const OptimizationSubscription = (await import('@/models/practice-os/OptimizationSubscription')).default;
  const [profile, sub] = await Promise.all([
    PracticeOsProfile.findOne({ doctorId }).select('optimizationAccess').lean(),
    OptimizationSubscription.findOne({ doctorId }).sort({ updatedAt: -1 }).select('status currentPeriodEnd updatedAt').lean(),
  ]);
  const a = profile?.optimizationAccess;
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // Founder override — never expires.
  if (a?.granted && a?.permanent) return { phase: 'active', accessEndAt: null, graceEndAt: null };

  // Active paid subscription — entitled.
  const subActive = sub && sub.status === 'active' && (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd).getTime() > now);
  if (subActive) return { phase: 'active', accessEndAt: null, graceEndAt: null };

  // Free grant still valid (or a legacy grant with no expiry).
  const grantEnd = a?.expiresAt ? new Date(a.expiresAt).getTime() : null;
  if (a?.granted && !grantEnd) return { phase: 'active', accessEndAt: null, graceEndAt: null };
  if (a?.granted && grantEnd && grantEnd > now) return { phase: 'active', accessEndAt: grantEnd, graceEndAt: null };

  // Did they ever have access? (grant issued, or a subscription existed.)
  const everHad = !!(a?.grantedAt || grantEnd || sub);
  if (!everHad) return { phase: 'none', accessEndAt: null, graceEndAt: null };

  // Access has ended — the later of the free-grant expiry and the sub's period-end
  // (or the sub's last update if it cancelled with no period end).
  const subEnd = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).getTime()
    : (sub?.updatedAt ? new Date(sub.updatedAt).getTime() : 0);
  const accessEndAt = Math.max(grantEnd || 0, subEnd || 0) || (a?.grantedAt ? new Date(a.grantedAt).getTime() : now);
  const graceEndAt = accessEndAt + OPTIMIZATION_GRACE_DAYS * DAY;
  return { phase: now <= graceEndAt ? 'grace' : 'locked', accessEndAt, graceEndAt };
}

// Can the doctor still ACT (open/finish tasks, spend credits)? True while active
// or within the grace window.
export async function hasOptimizationWorkingAccess(doctorId) {
  const { phase } = await getOptimizationAccessState(doctorId);
  return phase === 'active' || phase === 'grace';
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
