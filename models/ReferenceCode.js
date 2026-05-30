import mongoose from 'mongoose';

const ReferenceCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  maxUses: {
    type: Number,
    default: null, // null = unlimited
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  usedBy: [{
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  expiresAt: {
    type: Date,
    default: null, // null = no expiry
  },
  createdBy: {
    type: String,
    default: 'platform',
  },
}, {
  timestamps: true,
});

// Indexes
ReferenceCodeSchema.index({ code: 1 }, { unique: true });
ReferenceCodeSchema.index({ isActive: 1, expiresAt: 1 });

// Static method to validate a reference code
ReferenceCodeSchema.statics.validateCode = async function(code) {
  if (!code) return { valid: false, reason: 'Reference code is required' };

  const refCode = await this.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });

  if (!refCode) {
    return { valid: false, reason: 'Invalid reference code' };
  }

  if (refCode.expiresAt && refCode.expiresAt < new Date()) {
    return { valid: false, reason: 'Reference code has expired' };
  }

  if (refCode.maxUses && refCode.usedCount >= refCode.maxUses) {
    return { valid: false, reason: 'Reference code has reached its usage limit' };
  }

  return { valid: true, refCode };
};

export default mongoose.models.ReferenceCode || mongoose.model('ReferenceCode', ReferenceCodeSchema);
