import Doctor from '@/models/Doctor';
import PracticeOsPurchase from '@/models/practice-os/PracticeOsPurchase';
import { getOrCreateEnrollment } from '@/lib/practice-os/engine';

/**
 * Idempotently record a Practice OS pack purchase, unlock access to that pack,
 * and ensure the enrollment exists. Safe to call more than once for the same
 * payment — used by BOTH the browser verify callback and the Razorpay webhook,
 * which may race.
 *
 * Access is per-pack: the entitlement is the completed PracticeOsPurchase for
 * (doctor, frameworkId). We also keep the legacy Doctor.practiceOsActive flag
 * true (= owns at least one pack) for any older checks / analytics.
 */
export async function grantPracticeOsAccess(doctorId, frameworkId, { paymentId, orderId = '', signature = '', amountInInr = 0 } = {}) {
  if (!frameworkId) throw new Error('grantPracticeOsAccess requires a frameworkId (pack)');
  if (paymentId) {
    // Atomic upsert keyed on the unique paymentId — no duplicate-key error if
    // the callback and the webhook both fire.
    await PracticeOsPurchase.updateOne(
      { paymentId },
      { $setOnInsert: { doctorId, frameworkId, paymentId, orderId, signature, amountInInr, status: 'completed' } },
      { upsert: true }
    );
  }
  await Doctor.updateOne({ _id: doctorId }, { $set: { practiceOsActive: true } });
  await getOrCreateEnrollment(doctorId, frameworkId);
}
