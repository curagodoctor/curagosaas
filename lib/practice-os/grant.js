import Doctor from '@/models/Doctor';
import PracticeOsPurchase from '@/models/practice-os/PracticeOsPurchase';
import { getOrCreateEnrollment } from '@/lib/practice-os/engine';
import { sendInvoiceEmail } from '@/lib/practice-os/invoice';

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
export async function grantPracticeOsAccess(doctorId, frameworkId, { paymentId, orderId = '', signature = '', amountInInr = 0, baseInInr = 0, gstInInr = 0, gstPercent = 0 } = {}) {
  if (!frameworkId) throw new Error('grantPracticeOsAccess requires a frameworkId (pack)');
  if (paymentId) {
    // Atomic upsert keyed on the unique paymentId — no duplicate-key error if
    // the callback and the webhook both fire.
    await PracticeOsPurchase.updateOne(
      { paymentId },
      { $setOnInsert: { doctorId, frameworkId, paymentId, orderId, signature, amountInInr, baseInInr, gstInInr, gstPercent, status: 'completed' } },
      { upsert: true }
    );
  }
  await Doctor.updateOne({ _id: doctorId }, { $set: { practiceOsActive: true } });
  await getOrCreateEnrollment(doctorId, frameworkId);

  // Email the tax invoice exactly once. Atomically claim invoiceSentAt so the
  // browser verify callback and the webhook (which may race) don't both send.
  if (paymentId && (amountInInr || 0) > 0) {
    const claimed = await PracticeOsPurchase.findOneAndUpdate(
      { paymentId, invoiceSentAt: { $in: [null, undefined] } },
      { $set: { invoiceSentAt: new Date() } },
      { new: true }
    ).lean();
    if (claimed) {
      let sent = false;
      try { sent = await sendInvoiceEmail(claimed); } catch (e) { console.error('[Practice OS invoice]', e.message); }
      // If it didn't actually go out, clear the flag so a later grant can retry.
      if (!sent) await PracticeOsPurchase.updateOne({ paymentId }, { $unset: { invoiceSentAt: 1 } });
    }
  }
}

/**
 * Remove a doctor's access to a pack (admin action). Non-destructive: deletes the
 * paid entitlement (purchase) for the pack so access is gated again, but LEAVES
 * their progress/scores intact so re-granting restores everything. Clears the
 * legacy practiceOsActive flag if they no longer own any pack.
 * Note: a FREE pack (priceInInr 0) is always accessible, so revoking it has no
 * effect unless the pack has a price.
 */
export async function revokePracticeOsAccess(doctorId, frameworkId) {
  if (!frameworkId) throw new Error('revokePracticeOsAccess requires a frameworkId (pack)');
  await PracticeOsPurchase.deleteMany({ doctorId, frameworkId });
  const remaining = await PracticeOsPurchase.countDocuments({ doctorId, status: 'completed' });
  if (!remaining) await Doctor.updateOne({ _id: doctorId }, { $set: { practiceOsActive: false } });
}
