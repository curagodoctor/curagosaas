import mongoose from 'mongoose';

const MessageQuotaSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    unique: true,
  },
  smsLimit: {
    type: Number,
    default: 100,
  },
  smsUsed: {
    type: Number,
    default: 0,
  },
  emailLimit: {
    type: Number,
    default: 500,
  },
  emailUsed: {
    type: Number,
    default: 0,
  },
  periodStart: {
    type: Date,
    required: true,
  },
  periodEnd: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
MessageQuotaSchema.index({ periodEnd: 1 });

// Helper: get current month period
function getCurrentPeriod() {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { periodStart, periodEnd };
}

// Static: get or create quota for a doctor (resets monthly)
MessageQuotaSchema.statics.getOrCreate = async function(doctorId) {
  let quota = await this.findOne({ doctorId });
  const { periodStart, periodEnd } = getCurrentPeriod();

  if (!quota) {
    quota = await this.create({ doctorId, periodStart, periodEnd });
    return quota;
  }

  // Reset if period has expired
  if (quota.periodEnd <= new Date()) {
    quota.smsUsed = 0;
    quota.emailUsed = 0;
    quota.periodStart = periodStart;
    quota.periodEnd = periodEnd;
    await quota.save();
  }

  return quota;
};

// Static: check if quota allows sending
MessageQuotaSchema.statics.checkQuota = async function(doctorId, channel) {
  const quota = await this.getOrCreate(doctorId);
  const limit = channel === 'sms' ? quota.smsLimit : quota.emailLimit;
  const used = channel === 'sms' ? quota.smsUsed : quota.emailUsed;

  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    limit,
    used,
  };
};

// Static: deduct from quota (atomic)
MessageQuotaSchema.statics.deductQuota = async function(doctorId, channel, count = 1) {
  const field = channel === 'sms' ? 'smsUsed' : 'emailUsed';
  return this.findOneAndUpdate(
    { doctorId },
    { $inc: { [field]: count } },
    { new: true }
  );
};

export default mongoose.models.MessageQuota || mongoose.model('MessageQuota', MessageQuotaSchema);
