import crypto from 'crypto';
import { getPracticeOsRazorpay } from '@/lib/practice-os/access';

// ₹5,000/month Razorpay subscription for the optimization tier (§ landing offer).
// The ₹5,000 is EXCLUSIVE of GST; Razorpay charges the GST-inclusive total
// (₹5,000 + 18% = ₹5,900 by default). Base price + GST % are env-configurable.
const RAZORPAY_API = 'https://api.razorpay.com/v1';
export const BASE_INR = parseInt(process.env.PRACTICE_OS_OPTIMIZATION_PRICE_INR, 10) > 0
  ? parseInt(process.env.PRACTICE_OS_OPTIMIZATION_PRICE_INR, 10) : 5000;
export const GST_PERCENT = parseInt(process.env.PRACTICE_OS_GST_PERCENT, 10) >= 0
  ? parseInt(process.env.PRACTICE_OS_GST_PERCENT, 10) : 18;
export const TOTAL_INR = Math.round(BASE_INR * (1 + GST_PERCENT / 100)); // 5000 + 18% = 5900
const AMOUNT_PAISE = TOTAL_INR * 100;

// Billing cadence: a 28-day cycle, matching the Dominate Organic Search programme
// length (period:daily × interval:28 = exactly 28 days). Existing monthly
// subscriptions are NOT affected — Razorpay binds each subscription to the plan it
// was created on. Override with PRACTICE_OS_BILLING_PERIOD / _INTERVAL if needed.
const BILLING_PERIOD = process.env.PRACTICE_OS_BILLING_PERIOD || 'daily';
const BILLING_INTERVAL = parseInt(process.env.PRACTICE_OS_BILLING_INTERVAL, 10) > 0
  ? parseInt(process.env.PRACTICE_OS_BILLING_INTERVAL, 10) : 28;

function auth() {
  const { keyId, keySecret } = getPracticeOsRazorpay();
  return 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
}
async function rzp(endpoint, method = 'GET', body = null) {
  const res = await fetch(`${RAZORPAY_API}${endpoint}`, {
    method,
    headers: { Authorization: auth(), 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.description || `Razorpay error ${res.status}`);
  return data;
}

let cachedPlanId = null;
export async function getOrCreateOptimizationPlan() {
  if (process.env.PRACTICE_OS_OPTIMIZATION_PLAN_ID) return process.env.PRACTICE_OS_OPTIMIZATION_PLAN_ID;
  if (cachedPlanId) return cachedPlanId;
  try {
    const plans = await rzp('/plans?count=50');
    const existing = plans.items?.find((p) => p.item?.amount === AMOUNT_PAISE && p.period === BILLING_PERIOD && p.interval === BILLING_INTERVAL);
    if (existing) { cachedPlanId = existing.id; return cachedPlanId; }
  } catch { /* fall through to create */ }
  const plan = await rzp('/plans', 'POST', {
    period: BILLING_PERIOD, interval: BILLING_INTERVAL,
    item: {
      name: `CuraGo — Dominate Organic Search (28-day cycle, incl. ${GST_PERCENT}% GST)`,
      amount: AMOUNT_PAISE, currency: 'INR',
      description: `₹${BASE_INR} + ${GST_PERCENT}% GST = ₹${TOTAL_INR} every 28 days`,
    },
  });
  cachedPlanId = plan.id;
  return cachedPlanId;
}

export async function createOptimizationSubscription({ email, name }) {
  const planId = await getOrCreateOptimizationPlan();
  const sub = await rzp('/subscriptions', 'POST', {
    plan_id: planId, total_count: 120, quantity: 1, customer_notify: 1,
    notes: { name: name || '', email: email || '', product: 'practice-os-optimization' },
  });
  return { subscriptionId: sub.id, planId, status: sub.status, shortUrl: sub.short_url };
}

export async function fetchSubscription(subscriptionId) {
  return rzp(`/subscriptions/${subscriptionId}`);
}
export async function cancelOptimizationSubscription(subscriptionId) {
  return rzp(`/subscriptions/${subscriptionId}/cancel`, 'POST', { cancel_at_cycle_end: 1 });
}

// Razorpay subscription checkout returns razorpay_payment_id|razorpay_subscription_id|razorpay_signature.
export function verifySubscriptionSignature({ paymentId, subscriptionId, signature }) {
  const { keySecret } = getPracticeOsRazorpay();
  const expected = crypto.createHmac('sha256', keySecret).update(`${paymentId}|${subscriptionId}`).digest('hex');
  return expected === signature;
}
export function verifyWebhookSignature(rawBody, signature) {
  const { webhookSecret } = getPracticeOsRazorpay();
  if (!webhookSecret) return false;
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  return expected === signature;
}
