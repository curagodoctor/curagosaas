import PendingStorePurchase from '@/models/store/PendingStorePurchase';
import { grantStoreAccess } from '@/lib/store/grant';

/**
 * Link any unclaimed guest store purchases to a doctor and grant the products.
 * Matches by claimToken (primary) and by the doctor's email (fallback — so a lost
 * token still resolves after a refresh / Google login). Idempotent: grantStoreAccess
 * dedupes on paymentId and each pending is marked claimed once linked. Mirrors
 * lib/practice-os/claimPending.js.
 */
export async function linkPendingStorePurchases(doctor, { claimToken } = {}) {
  const or = [];
  if (claimToken) or.push({ claimToken });
  const email = doctor?.email ? String(doctor.email).toLowerCase() : '';
  if (email) or.push({ buyerEmail: email });
  if (!or.length) return { linked: 0 };

  const pendings = await PendingStorePurchase.find({ claimed: false, $or: or });
  let linked = 0;
  for (const p of pendings) {
    try {
      await grantStoreAccess(doctor._id, p.productId, {
        paymentId: p.paymentId || `pending_${p._id}`,
        orderId: p.orderId || '',
        signature: p.signature || '',
        amountInInr: p.amountInInr || 0,
      });
      p.claimed = true;
      p.claimedByDoctorId = doctor._id;
      p.claimedAt = new Date();
      await p.save();
      linked++;
    } catch (e) {
      console.error('[store claimPending] link failed for', String(p._id), e.message);
    }
  }
  return { linked };
}
