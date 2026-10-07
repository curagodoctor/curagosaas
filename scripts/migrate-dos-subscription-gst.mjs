// Migrate active Dominate Organic Search subscriptions that are still on the old
// ₹5,000 (no-GST) plan onto the ₹5,900 (GST-inclusive) plan. The plan change is
// scheduled at CYCLE END, so there's no mid-cycle charge — the next renewal bills
// ₹5,900 — and Razorpay notifies the customer (customer_notify: 1).
//
//   node scripts/migrate-dos-subscription-gst.mjs           # dry run
//   node scripts/migrate-dos-subscription-gst.mjs --apply   # execute
import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const RAZORPAY_API = 'https://api.razorpay.com/v1';
const BASE_INR = parseInt(process.env.PRACTICE_OS_OPTIMIZATION_PRICE_INR, 10) > 0 ? parseInt(process.env.PRACTICE_OS_OPTIMIZATION_PRICE_INR, 10) : 5000;
const GST_PERCENT = parseInt(process.env.PRACTICE_OS_GST_PERCENT, 10) >= 0 ? parseInt(process.env.PRACTICE_OS_GST_PERCENT, 10) : 18;
const TOTAL_INR = Math.round(BASE_INR * (1 + GST_PERCENT / 100)); // 5900
const AMOUNT_PAISE = TOTAL_INR * 100;

const keyId = process.env.PRACTICE_OS_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.PRACTICE_OS_RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
if (!keyId || !keySecret) { console.error('Razorpay credentials missing'); process.exit(1); }
const AUTH = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

async function rzp(endpoint, method = 'GET', body = null) {
  const res = await fetch(`${RAZORPAY_API}${endpoint}`, {
    method, headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.description || `Razorpay ${res.status}`);
  return data;
}

async function getOrCreatePlan() {
  const plans = await rzp('/plans?count=50');
  const existing = plans.items?.find((p) => p.item?.amount === AMOUNT_PAISE && p.period === 'monthly' && p.interval === 1);
  if (existing) { console.log(`Found ₹${TOTAL_INR} plan: ${existing.id}`); return existing.id; }
  if (!APPLY) { console.log(`(dry-run) would CREATE a ₹${TOTAL_INR} monthly plan`); return '<new-plan-to-be-created>'; }
  const plan = await rzp('/plans', 'POST', {
    period: 'monthly', interval: 1,
    item: { name: `CuraGo — Dominate Organic Search (Monthly, incl. ${GST_PERCENT}% GST)`, amount: AMOUNT_PAISE, currency: 'INR', description: `₹${BASE_INR} + ${GST_PERCENT}% GST = ₹${TOTAL_INR} / month` },
  });
  console.log(`Created ₹${TOTAL_INR} plan: ${plan.id}`);
  return plan.id;
}

await mongoose.connect(process.env.MONGODB_URI);
const col = mongoose.connection.collection('optimizationsubscriptions');
const doctors = mongoose.connection.collection('doctors');

const newPlanId = await getOrCreatePlan();

// Active subscriptions NOT already on the ₹5,900 plan.
const subs = await col.find({ status: 'active' }).toArray();
const toMigrate = subs.filter((s) => s.razorpayPlanId !== newPlanId);
console.log(`\nActive subscriptions: ${subs.length}; to migrate: ${toMigrate.length}`);

for (const s of toMigrate) {
  const d = await doctors.findOne({ _id: s.doctorId }, { projection: { displayName: 1, name: 1, email: 1 } });
  const who = d?.displayName || d?.name || d?.email || s.doctorId;
  let live = null;
  try { live = await rzp(`/subscriptions/${s.razorpaySubscriptionId}`); } catch (e) { console.log(`  ! ${who}: fetch failed — ${e.message}`); continue; }
  const nextCharge = live.charge_at ? new Date(live.charge_at * 1000).toISOString().slice(0, 10) : '?';
  console.log(`  ${who}: sub ${s.razorpaySubscriptionId}`);
  console.log(`      current plan ${live.plan_id} (₹${s.amountInInr}) -> ${newPlanId} (₹${TOTAL_INR}) at CYCLE END (next charge ~${nextCharge})`);
  if (live.has_scheduled_changes) console.log('      note: subscription already has scheduled changes');
  if (APPLY) {
    await rzp(`/subscriptions/${s.razorpaySubscriptionId}`, 'PATCH', { plan_id: newPlanId, schedule_change_at: 'cycle_end', customer_notify: 1 });
    await col.updateOne({ _id: s._id }, { $set: { razorpayPlanId: newPlanId, amountInInr: TOTAL_INR, planMigratedAt: new Date() } });
    console.log('      ✓ scheduled at cycle end + local record updated');
  }
}

if (!APPLY) console.log('\nDry run — re-run with --apply to execute.');
await mongoose.disconnect();
