/**
 * Platform access tiers — the single source of truth for Free / Paid / Founder.
 *
 * One doctor has one effective tier, resolved as:
 *   founder            → 'founder'   (manual comp; full platform minus Dominate Organic Search; AI not refilled)
 *   active ₹500/mo sub → 'paid'      (full platform; DOS is a separate add-on)
 *   explicit 'paid'    → 'paid'      (manual comp even without a live subscription)
 *   otherwise          → 'free'      (1 website page + 5 blogs, most features locked, AI not refilled)
 *
 * Every feature gate in the app should read `capabilitiesFor(tier)` rather than
 * re-deriving plan logic, so the matrix below is the one place tiers are defined.
 */

import Subscription from '@/models/Subscription';
import Doctor from '@/models/Doctor';

export const TIERS = { FREE: 'free', PAID: 'paid', FOUNDER: 'founder' };

/**
 * A genuinely PAID subscription — monthly (Razorpay) or premium (promo unlock),
 * status active. Deliberately NOT Subscription.isActive(): that counts the 30-day
 * trial as active and even auto-creates a trial for no-sub doctors. In the new
 * tier model the trial IS the free tier, so trial must never resolve to 'paid'.
 */
export async function hasPaidSubscription(doctorId) {
  if (!doctorId) return false;
  const sub = await Subscription.findOne({ doctorId }).select('plan status').lean();
  if (!sub || sub.status !== 'active') return false;
  return sub.plan === 'premium' || sub.plan === 'monthly';
}

// Free-tier hard caps on owned assets. null elsewhere = unlimited.
export const FREE_LIMITS = { maxPages: 1, maxBlogs: 5 };

// Feature keys the UI + API gates reference. `true` in a tier = usable.
export const CAP = {
  WEBSITE_BUILDER: 'websiteBuilder', // drag-drop pages (subject to maxPages on free)
  AI_GENERATE: 'aiGenerate',         // AI website/content generation (within credits)
  BLOG_BUILDER: 'blogBuilder',       // blog articles (subject to maxBlogs on free)
  WEBSITE_ENQUIRIES: 'websiteEnquiries',
  BOOKING_SYSTEM: 'bookingSystem',   // bookings + slot manager + clinic manager
  CONTACTS: 'contacts',
  WORKFLOWS: 'workflows',
  TEMPLATES: 'templates',
  MESSAGING: 'messaging',
  ANALYTICS: 'analytics',
  CONTENT_PLANNER: 'contentPlanner',
  WORKSPACE: 'workspace',
  SCHEDULE: 'schedule',
  GBP: 'gbp',
  CUSTOMISATION: 'customisation',    // diseases & treatments, content instructions
  PROFILE: 'profile',
  LINKS: 'links',
  SETTINGS: 'settings',
  CUSTOM_DOMAIN: 'customDomain',
  TRACKING: 'tracking',              // meta pixel + GTM
  SEO_DELEGATION: 'seoDelegation',
};

/**
 * The capability snapshot for a tier. `maxPages`/`maxBlogs` null = unlimited.
 * `aiRefill` true = daily AI credit top-up (paid only); false = capped pool, no refill.
 * `dos` is the Dominate Organic Search add-on state: 'purchasable' | 'locked'.
 */
export function capabilitiesFor(tier) {
  const paid = tier === TIERS.PAID;
  const founder = tier === TIERS.FOUNDER;
  const full = paid || founder; // full platform (everything except the free-only limits)

  return {
    tier,
    maxPages: full ? null : FREE_LIMITS.maxPages,
    maxBlogs: full ? null : FREE_LIMITS.maxBlogs,
    aiRefill: paid,                 // only paid gets a daily refill; free & founder are capped
    dos: paid ? 'purchasable' : 'locked', // free & founder cannot access DOS
    features: {
      [CAP.WEBSITE_BUILDER]: true,  // all tiers can build (free is capped by maxPages)
      [CAP.AI_GENERATE]: true,      // all can generate within their credit pool
      [CAP.BLOG_BUILDER]: true,     // all can blog (free is capped by maxBlogs)
      [CAP.WEBSITE_ENQUIRIES]: true,
      [CAP.BOOKING_SYSTEM]: full,
      [CAP.CONTACTS]: full,
      [CAP.WORKFLOWS]: full,
      [CAP.TEMPLATES]: full,
      [CAP.MESSAGING]: full,
      [CAP.ANALYTICS]: full,
      [CAP.CONTENT_PLANNER]: full,
      [CAP.WORKSPACE]: full,
      [CAP.SCHEDULE]: full,
      [CAP.GBP]: true,
      [CAP.CUSTOMISATION]: full,
      [CAP.PROFILE]: true,
      [CAP.LINKS]: true,
      [CAP.SETTINGS]: true,
      [CAP.CUSTOM_DOMAIN]: true,
      [CAP.TRACKING]: true,
      [CAP.SEO_DELEGATION]: true,
    },
  };
}

/**
 * Resolve a doctor's effective tier. Accepts a doctorId (string/ObjectId) or a
 * Doctor doc/lean object that already carries `accessTier` + `_id`.
 */
export async function getEffectiveTier(doctorOrId) {
  let accessTier = null;
  let doctorId = doctorOrId;
  if (doctorOrId && typeof doctorOrId === 'object' && 'accessTier' in doctorOrId) {
    accessTier = doctorOrId.accessTier || 'free';
    doctorId = doctorOrId._id || doctorOrId.id;
  } else {
    const doc = await Doctor.findById(doctorOrId).select('accessTier').lean();
    accessTier = doc?.accessTier || 'free';
  }

  if (accessTier === TIERS.FOUNDER) return TIERS.FOUNDER;
  // A live PAID subscription always counts as paid, even if the stored tier
  // wasn't synced yet. (Trial does NOT count — see hasPaidSubscription.)
  try {
    if (await hasPaidSubscription(doctorId)) return TIERS.PAID;
  } catch { /* subscription lookup is best-effort */ }
  // Honour an explicit 'paid' comp even without a live subscription.
  if (accessTier === TIERS.PAID) return TIERS.PAID;
  return TIERS.FREE;
}

/** Tier + full capability snapshot for a doctor. Used by /api/auth/me and gates. */
export async function getTierContext(doctorOrId) {
  const tier = await getEffectiveTier(doctorOrId);
  return capabilitiesFor(tier);
}

/** Boolean gate: can this tier use a feature key (one of CAP.*)? */
export function tierCan(tier, feature) {
  return !!capabilitiesFor(tier).features[feature];
}

/**
 * Keep the stored Doctor.accessTier in sync with subscription state. Called after
 * a subscription activates/lapses or a promo unlocks premium. NEVER downgrades a
 * 'founder' (that's a manual comp set only from platform-admin). Returns the tier
 * that was written (or the preserved founder tier).
 */
export async function syncDoctorTier(doctorId) {
  const doc = await Doctor.findById(doctorId).select('accessTier').lean();
  if (!doc) return null;
  if (doc.accessTier === TIERS.FOUNDER) return TIERS.FOUNDER; // comp — never auto-changed
  let next = TIERS.FREE;
  try { if (await hasPaidSubscription(doctorId)) next = TIERS.PAID; } catch { /* best-effort */ }
  if (next !== doc.accessTier) {
    await Doctor.updateOne({ _id: doctorId }, { $set: { accessTier: next } });
  }
  return next;
}
