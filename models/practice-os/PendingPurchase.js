import mongoose from 'mongoose';
import crypto from 'crypto';

// A pack bought BEFORE the buyer has an account (guest checkout). Written the
// moment payment is verified (or immediately for a free pack), so the purchase
// is durable and survives a page refresh. It's linked to a doctor at signup/login
// via `claimToken` (or by matching email as a fallback), which then creates the
// real PracticeOsPurchase and grants access.
const PendingPurchaseSchema = new mongoose.Schema({
  frameworkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Framework', required: true, index: true },
  claimToken: { type: String, required: true, unique: true, index: true },

  buyerEmail: { type: String, lowercase: true, trim: true, default: '', index: true },
  buyerName: { type: String, default: '' },
  buyerPhone: { type: String, default: '' },

  isFree: { type: Boolean, default: false },
  amountInInr: { type: Number, default: 0 },   // total incl. GST
  baseInInr: { type: Number, default: 0 },
  gstInInr: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 0 },

  // Razorpay identifiers (absent for free packs). paymentId is the idempotency key.
  paymentId: { type: String, default: '', index: true },
  orderId: { type: String, default: '' },
  signature: { type: String, default: '' },

  claimed: { type: Boolean, default: false, index: true },
  claimedByDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
  claimedAt: { type: Date },
}, { timestamps: true });

PendingPurchaseSchema.statics.generateToken = function () {
  return crypto.randomBytes(24).toString('base64url');
};

const PendingPurchase =
  mongoose.models.PendingPurchase ||
  mongoose.model('PendingPurchase', PendingPurchaseSchema);

export default PendingPurchase;
