import mongoose from 'mongoose';

/**
 * A completed store purchase — the real entitlement. One per successful payment,
 * created idempotently at grant time (upsert on the unique paymentId, shared by
 * the browser verify callback + the Razorpay webhook). Owning a product ==
 * having a completed StorePurchase for (doctorId, productId).
 */
const StorePurchaseSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreProduct', required: true, index: true },

  paymentId: { type: String, required: true, unique: true }, // idempotency key (Razorpay id or synthetic for free)
  orderId: { type: String, default: '' },
  signature: { type: String, default: '' },
  amountInInr: { type: Number, default: 0 },

  status: { type: String, enum: ['completed', 'refunded'], default: 'completed', index: true },
  invoiceSentAt: { type: Date },
}, { timestamps: true });

StorePurchaseSchema.index({ doctorId: 1, productId: 1 });

export default mongoose.models.StorePurchase || mongoose.model('StorePurchase', StorePurchaseSchema);
