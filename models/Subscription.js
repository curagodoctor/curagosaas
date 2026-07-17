import mongoose from 'mongoose';
import Doctor from './Doctor.js';

const SubscriptionSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    unique: true,
  },
  plan: {
    type: String,
    enum: ['trial', 'monthly', 'premium'],
    default: 'trial',
  },
  status: {
    type: String,
    enum: ['active', 'past_due', 'cancelled', 'expired'],
    default: 'active',
  },
  // Razorpay fields
  razorpaySubscriptionId: {
    type: String,
    sparse: true,
  },
  razorpayCustomerId: {
    type: String,
  },
  // Trial dates
  trialStartDate: {
    type: Date,
  },
  trialEndDate: {
    type: Date,
  },
  // Paid subscription period
  currentPeriodStart: {
    type: Date,
  },
  currentPeriodEnd: {
    type: Date,
  },
  cancelledAt: {
    type: Date,
  },
  amount: {
    type: Number,
    default: 1000, // ₹1,000/month
  },
  // Promo code unlock
  promoCode: {
    type: String,
    default: null,
  },
  premiumUnlockedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes
SubscriptionSchema.index({ status: 1, trialEndDate: 1 });

// Static: get or create trial for a doctor
SubscriptionSchema.statics.getOrCreateTrial = async function(doctorId) {
  let sub = await this.findOne({ doctorId });

  if (!sub) {
    // Date the trial from the doctor's signup date (not "now"), so a trial
    // isn't silently restarted the first time an existing doctor loads the
    // dashboard. Falls back to now if the doctor/createdAt can't be read.
    const doctor = await Doctor.findById(doctorId).select('createdAt');
    const start = doctor?.createdAt ? new Date(doctor.createdAt) : new Date();
    const trialEnd = new Date(start);
    trialEnd.setDate(trialEnd.getDate() + 30); // 30-day trial from signup

    sub = await this.create({
      doctorId,
      plan: 'trial',
      status: 'active',
      trialStartDate: start,
      trialEndDate: trialEnd,
    });
  }

  return sub;
};

// Static: check if a doctor has an active subscription
SubscriptionSchema.statics.isActive = async function(doctorId) {
  const sub = await this.findOne({ doctorId });

  // No subscription record = new user, auto-create trial
  if (!sub) {
    await this.getOrCreateTrial(doctorId);
    return true;
  }

  const now = new Date();

  // Premium plan (promo code unlocked) - always active
  if (sub.plan === 'premium' && sub.status === 'active') {
    return true;
  }

  // Active paid subscription
  if (sub.plan === 'monthly' && sub.status === 'active') {
    return true;
  }

  // Valid trial (not cancelled/expired and within date range)
  if (sub.plan === 'trial' && sub.status === 'active' && sub.trialEndDate && sub.trialEndDate > now) {
    return true;
  }

  return false;
};

// Instance method: days remaining
SubscriptionSchema.methods.getDaysRemaining = function() {
  const now = new Date();
  const endDate = this.plan === 'trial' ? this.trialEndDate : this.currentPeriodEnd;
  if (!endDate) return 0;
  const diff = endDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export default mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
