import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * A store product bought BEFORE the buyer has an account (guest checkout).
 * Written the moment payment is verified (or immediately for a free product), so
 * it survives a page refresh. Linked to a doctor at signup/login via `claimToken`
 * (or by matching email as a fallback), which then creates the real StorePurchase
 * and grants access. Mirrors models/practice-os/PendingPurchase.js.
 */
const PendingStorePurchaseSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreProduct', required: true, index: true },
  claimToken: { type: String, required: true, unique: true, index: true },

  buyerEmail: { type: String, lowercase: true, trim: true, default: '', index: true },
  buyerName: { type: String, default: '' },
  buyerPhone: { type: String, default: '' },

  isFree: { type: Boolean, default: false },
  amountInInr: { type: Number, default: 0 },

  paymentId: { type: String, default: '', index: true },
  orderId: { type: String, default: '' },
  signature: { type: String, default: '' },

  claimed: { type: Boolean, default: false, index: true },
  claimedByDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
  claimedAt: { type: Date },
}, { timestamps: true });

PendingStorePurchaseSchema.statics.generateToken = function () {
  return crypto.randomBytes(24).toString('base64url');
};

export default mongoose.models.PendingStorePurchase
  || mongoose.model('PendingStorePurchase', PendingStorePurchaseSchema);
