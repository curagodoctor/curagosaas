import crypto from 'crypto';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_API = 'https://api.razorpay.com/v1';

function getAuthHeader() {
  return 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
}

async function razorpayRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${RAZORPAY_API}${endpoint}`, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.description || `Razorpay API error: ${res.status}`);
  }
  return data;
}

// Create a monthly subscription plan (₹1,000/month)
let cachedPlanId = null;
export async function getOrCreatePlan() {
  if (cachedPlanId) return cachedPlanId;

  // Check if plan already exists by listing plans
  try {
    const plans = await razorpayRequest('/plans?count=10');
    const existing = plans.items?.find(
      p => p.item?.amount === 100000 && p.period === 'monthly' && p.interval === 1
    );
    if (existing) {
      cachedPlanId = existing.id;
      return cachedPlanId;
    }
  } catch (e) {
    // Plans list may fail, proceed to create
  }

  // Create new plan
  const plan = await razorpayRequest('/plans', 'POST', {
    period: 'monthly',
    interval: 1,
    item: {
      name: 'CuraGo Monthly Subscription',
      amount: 100000, // ₹1,000 in paise
      currency: 'INR',
      description: 'Monthly subscription for CuraGo platform',
    },
  });

  cachedPlanId = plan.id;
  return cachedPlanId;
}

// Create a subscription for a doctor with 30-day trial
export async function createSubscription(email, doctorName) {
  const planId = await getOrCreatePlan();

  const subscription = await razorpayRequest('/subscriptions', 'POST', {
    plan_id: planId,
    total_count: 120, // Max 10 years
    quantity: 1,
    customer_notify: 1,
    notes: {
      doctorName,
      email,
    },
  });

  return {
    subscriptionId: subscription.id,
    shortUrl: subscription.short_url,
    status: subscription.status,
  };
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId) {
  return razorpayRequest(`/subscriptions/${subscriptionId}/cancel`, 'POST', {
    cancel_at_cycle_end: 1, // Cancel at end of current billing cycle
  });
}

// Verify Razorpay webhook signature
export function verifyWebhookSignature(body, signature) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('[Razorpay] RAZORPAY_WEBHOOK_SECRET not configured');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

// Fetch subscription details
export async function getSubscription(subscriptionId) {
  return razorpayRequest(`/subscriptions/${subscriptionId}`);
}
