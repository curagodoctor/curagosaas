import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, getPracticeOsRazorpay } from '@/lib/practice-os/access';
import { createOptimizationSubscription, fetchSubscription } from '@/lib/practice-os/optimizationSubscription';
import OptimizationSubscription from '@/models/practice-os/OptimizationSubscription';

export const runtime = 'nodejs';

// Razorpay statuses that mean "already live" vs "still pending checkout".
const LIVE = new Set(['active', 'authenticated', 'charged']);
const PENDING = new Set(['created', 'pending']);

// POST — start (or resume) the Dominate Organic Search subscription. Returns the
// Razorpay subscription id + public key for the client checkout. Crucially it REUSES
// an existing subscription instead of minting a new one on every click (which left
// dozens of orphan 'created' subscriptions and made our DB point at an unpaid one
// even after the doctor had paid on an earlier subscription).
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { publicKeyId, keyId } = getPracticeOsRazorpay();
    if (!keyId) return NextResponse.json({ success: false, error: 'Payments are not configured yet.' }, { status: 503 });

    const existing = await OptimizationSubscription.findOne({ doctorId: doctor._id }).lean();
    let subscriptionId, planId, status;

    if (existing?.razorpaySubscriptionId) {
      // Trust the LIVE Razorpay status (our stored one can lag with e-mandate).
      let live = null;
      try { live = await fetchSubscription(existing.razorpaySubscriptionId); } catch { /* best-effort */ }
      const liveStatus = live?.status || existing.status;
      if (LIVE.has(liveStatus)) {
        // Already subscribed — don't create a duplicate; sync and tell the client.
        await OptimizationSubscription.updateOne(
          { doctorId: doctor._id },
          { $set: { status: liveStatus === 'charged' ? 'active' : liveStatus, ...(live?.current_end ? { currentPeriodEnd: new Date(live.current_end * 1000) } : {}) } },
        );
        return NextResponse.json({ success: true, alreadyActive: true, subscriptionId: existing.razorpaySubscriptionId, keyId: publicKeyId || keyId });
      }
      if (PENDING.has(liveStatus)) {
        // Resume the same pending subscription rather than spawning another.
        subscriptionId = existing.razorpaySubscriptionId;
        planId = existing.razorpayPlanId;
        status = liveStatus;
      }
    }

    if (!subscriptionId) {
      ({ subscriptionId, planId, status } = await createOptimizationSubscription({
        email: doctor.email, name: doctor.displayName || doctor.name,
      }));
    }
    await OptimizationSubscription.findOneAndUpdate(
      { doctorId: doctor._id },
      { $set: { razorpaySubscriptionId: subscriptionId, razorpayPlanId: planId, status: status || 'created' } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    return NextResponse.json({ success: true, subscriptionId, keyId: publicKeyId || keyId });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[optimization subscribe]', error);
    return NextResponse.json({ success: false, error: 'Could not start the subscription.' }, { status: 500 });
  }
}
