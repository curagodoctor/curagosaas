/**
 * Feature entitlements.
 *
 * Single source of truth for deciding which premium features a doctor can use.
 *
 * A doctor gets the premium features (Contacts, Workflows, Messaging) when their
 * subscription is "active" — which means any of:
 *   - inside the 30-day trial window
 *   - an active paid monthly subscription
 *   - a promo-code-unlocked premium plan (e.g. CURAGO50, ZEROTOPRACTICE)
 *
 * Once the trial expires and there is no payment / promo, the doctor falls back
 * to the "free" tier and these features are locked until they subscribe or
 * redeem a promo code.
 *
 * This mirrors the gate already used by the workflow-processor cron
 * (Subscription.isActive), keeping backend behaviour consistent.
 */

import { NextResponse } from 'next/server';
import Subscription from '@/models/Subscription';

// Feature keys used across the app
export const FEATURES = {
  CONTACTS: 'contacts',
  WORKFLOWS: 'workflows',
  MESSAGING: 'messaging',
};

// Features that require an active subscription / promo unlock.
export const PREMIUM_FEATURES = [
  FEATURES.CONTACTS,
  FEATURES.WORKFLOWS,
  FEATURES.MESSAGING,
];

const UPGRADE_URL = '/admin/dashboard/settings?tab=subscription';

/**
 * Compute the full entitlement snapshot for a doctor.
 * Used by the /api/doctor/entitlements endpoint and anywhere the UI needs it.
 *
 * @param {string|import('mongoose').Types.ObjectId} doctorId
 * @returns {Promise<{plan:string, status:string, isActive:boolean, daysRemaining:number, isPromoUnlocked:boolean, promoCode:string|null, features:Record<string,boolean>}>}
 */
export async function getEntitlements(doctorId) {
  const sub = await Subscription.getOrCreateTrial(doctorId);
  const isActive = await Subscription.isActive(doctorId);
  const daysRemaining = typeof sub.getDaysRemaining === 'function' ? sub.getDaysRemaining() : 0;

  const features = {};
  for (const f of PREMIUM_FEATURES) {
    features[f] = isActive;
  }

  return {
    plan: sub.plan,
    status: sub.status,
    isActive,
    daysRemaining,
    isPromoUnlocked: sub.plan === 'premium' && !!sub.promoCode,
    promoCode: sub.promoCode || null,
    features,
  };
}

/**
 * Boolean check: can this doctor use the given feature?
 * Non-premium features are always allowed.
 *
 * @param {string|import('mongoose').Types.ObjectId} doctorId
 * @param {string} feature - one of FEATURES.*
 * @returns {Promise<boolean>}
 */
export async function hasFeature(doctorId, feature) {
  if (!PREMIUM_FEATURES.includes(feature)) return true;
  return Subscription.isActive(doctorId);
}

/**
 * Guard for API routes. Throws a tagged error when the feature is locked so the
 * route's catch block (or requireFeatureOr403) can return a 403 upgrade payload.
 *
 * @param {string|import('mongoose').Types.ObjectId} doctorId
 * @param {string} feature
 */
export async function requireFeature(doctorId, feature) {
  const allowed = await hasFeature(doctorId, feature);
  if (!allowed) {
    const err = new Error('FEATURE_LOCKED');
    err.code = 'FEATURE_LOCKED';
    err.feature = feature;
    throw err;
  }
}

/**
 * The standard 403 response body for a locked feature. The `upgrade` block gives
 * the frontend everything it needs to render an upgrade/redeem prompt.
 *
 * @param {string} feature
 * @returns {NextResponse}
 */
export function featureLockedResponse(feature) {
  return NextResponse.json(
    {
      success: false,
      error: 'This feature requires an active subscription or promo code.',
      code: 'FEATURE_LOCKED',
      feature,
      upgrade: {
        required: true,
        message: 'Upgrade your plan or redeem a promo code to unlock Contacts, Workflows and Messaging.',
        url: UPGRADE_URL,
      },
    },
    { status: 403 }
  );
}

/**
 * Convenience wrapper: check a feature and return a ready 403 response if locked,
 * otherwise null (caller proceeds). Keeps route handlers terse.
 *
 * @param {string|import('mongoose').Types.ObjectId} doctorId
 * @param {string} feature
 * @returns {Promise<NextResponse|null>}
 */
export async function requireFeatureOr403(doctorId, feature) {
  const allowed = await hasFeature(doctorId, feature);
  return allowed ? null : featureLockedResponse(feature);
}
