import StorePurchase from '@/models/store/StorePurchase';
import StoreProduct from '@/models/store/Product';

/**
 * Idempotently record a store purchase (book/course) and unlock access. Safe to
 * call more than once for the same payment — used by BOTH the browser verify
 * callback and the Razorpay webhook, which may race. Mirrors grantPracticeOsAccess.
 */
export async function grantStoreAccess(doctorId, productId, { paymentId, orderId = '', signature = '', amountInInr = 0 } = {}) {
  if (!productId) throw new Error('grantStoreAccess requires a productId');
  const pid = paymentId || `free_${doctorId}_${productId}`; // synthetic id for free products
  await StorePurchase.updateOne(
    { paymentId: pid },
    { $setOnInsert: { doctorId, productId, paymentId: pid, orderId, signature, amountInInr, status: 'completed' } },
    { upsert: true },
  );
}

/** Does the doctor own this product? */
export async function hasStoreProduct(doctorId, productId) {
  if (!doctorId || !productId) return false;
  return !!(await StorePurchase.exists({ doctorId, productId, status: 'completed' }));
}

/** The product ids a doctor owns. */
export async function ownedProductIds(doctorId) {
  const rows = await StorePurchase.find({ doctorId, status: 'completed' }).select('productId').lean();
  return rows.map((r) => String(r.productId));
}

/** The doctor's purchased products (full docs, minus the heavy readerHtml). */
export async function listDoctorLibrary(doctorId) {
  const rows = await StorePurchase.find({ doctorId, status: 'completed' }).select('productId createdAt').sort({ createdAt: -1 }).lean();
  if (!rows.length) return [];
  const ids = rows.map((r) => r.productId);
  const products = await StoreProduct.find({ _id: { $in: ids } }).select('-readerHtml').lean();
  const boughtAt = new Map(rows.map((r) => [String(r.productId), r.createdAt]));
  return products
    .map((p) => ({ ...p, purchasedAt: boughtAt.get(String(p._id)) || null }))
    .sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));
}

/** Admin: remove a doctor's entitlement to a product. */
export async function revokeStoreAccess(doctorId, productId) {
  await StorePurchase.deleteMany({ doctorId, productId });
}
