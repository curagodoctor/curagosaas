import mongoose from 'mongoose';

/**
 * Practice OS — Purchase
 *
 * One record per successful Practice OS payment. Unlocking access is driven by
 * the `Doctor.practiceOsActive` flag; this collection is the audit/analytics
 * trail behind that flag (who paid, when, how much, which Razorpay order).
 */
const PracticeOsPurchaseSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  // Which pack (framework) this payment unlocked. Access is granted per-pack.
  frameworkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Framework',
    index: true,
  },
  // Razorpay identifiers — paymentId is the idempotency key.
  paymentId: { type: String, required: true, unique: true },
  orderId: { type: String, default: '' },
  signature: { type: String, default: '' },

  amountInInr: { type: Number, required: true },   // total charged, incl. GST (rupees)
  baseInInr: { type: Number, default: 0 },         // pack price before GST
  gstInInr: { type: Number, default: 0 },          // GST amount
  gstPercent: { type: Number, default: 0 },        // GST rate applied
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['completed', 'refunded'], default: 'completed' },
  // Set once the invoice email has been sent (dedupes verify + webhook).
  invoiceSentAt: { type: Date },
}, { timestamps: true });

export default mongoose.models.PracticeOsPurchase
  || mongoose.model('PracticeOsPurchase', PracticeOsPurchaseSchema);
