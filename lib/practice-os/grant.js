import Doctor from '@/models/Doctor';
import PracticeOsPurchase from '@/models/practice-os/PracticeOsPurchase';
import { getOrCreateEnrollment } from '@/lib/practice-os/engine';

/**
 * Idempotently record a Practice OS purchase, unlock access, and ensure the
 * enrollment exists. Safe to call more than once for the same payment — used by
 * BOTH the browser verify callback and the Razorpay webhook, which may race.
 */
export async function grantPracticeOsAccess(doctorId, { paymentId, orderId = '', signature = '', amountInInr = 0 } = {}) {
  if (paymentId) {
    // Atomic upsert keyed on the unique paymentId — no duplicate-key error if
    // the callback and the webhook both fire.
    await PracticeOsPurchase.updateOne(
      { paymentId },
      { $setOnInsert: { doctorId, paymentId, orderId, signature, amountInInr, status: 'completed' } },
      { upsert: true }
    );
  }
  await Doctor.updateOne({ _id: doctorId }, { $set: { practiceOsActive: true } });
  await getOrCreateEnrollment(doctorId);
}
