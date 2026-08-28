import PendingPurchase from '@/models/practice-os/PendingPurchase';
import { grantPracticeOsAccess } from '@/lib/practice-os/grant';

// Link any unclaimed guest purchases to a doctor and grant the packs. Matches by
// claimToken (primary) and by the doctor's email (fallback — refresh-safe, so a
// lost token still resolves). Idempotent: grantPracticeOsAccess dedupes on
// paymentId, and each pending is marked claimed once linked.
export async function linkPendingPurchases(doctor, { claimToken } = {}) {
  const or = [];
  if (claimToken) or.push({ claimToken });
  const email = doctor?.email ? String(doctor.email).toLowerCase() : '';
  if (email) or.push({ buyerEmail: email });
  if (!or.length) return { linked: 0 };

  const pendings = await PendingPurchase.find({ claimed: false, $or: or });
  let linked = 0;
  for (const p of pendings) {
    try {
      await grantPracticeOsAccess(doctor._id, p.frameworkId, {
        paymentId: p.paymentId || `pending_${p._id}`,
        orderId: p.orderId || '',
        signature: p.signature || '',
        amountInInr: p.amountInInr || 0,
        baseInInr: p.baseInInr || 0,
        gstInInr: p.gstInInr || 0,
        gstPercent: p.gstPercent || 0,
      });
      p.claimed = true;
      p.claimedByDoctorId = doctor._id;
      p.claimedAt = new Date();
      await p.save();
      linked++;
    } catch (e) {
      console.error('[claimPending] link failed for', String(p._id), e.message);
    }
  }
  return { linked };
}
