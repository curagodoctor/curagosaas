import mongoose from 'mongoose';

/**
 * Practice OS — Optimization subscription (₹5,000/mo).
 *
 * After the founder's 30-day grant lapses, a doctor keeps optimization access by
 * subscribing. This mirrors the Razorpay subscription: `status` and
 * `currentPeriodEnd` are updated by the subscription webhook, and
 * hasActiveOptimizationSubscription() reads them to gate access.
 */
const OptimizationSubscriptionSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  razorpaySubscriptionId: { type: String, trim: true, index: true },
  razorpayPlanId: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired'], default: 'created', index: true },
  currentPeriodEnd: { type: Date, default: null },
  amountInInr: { type: Number, default: 5000 },
}, { timestamps: true });

export default mongoose.models.OptimizationSubscription
  || mongoose.model('OptimizationSubscription', OptimizationSubscriptionSchema);
