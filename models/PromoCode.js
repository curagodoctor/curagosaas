import mongoose from 'mongoose';

const PromoCodeSchema = new mongoose.Schema({
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
  },
  // What this promo code grants
  unlocksPremium: {
    type: Boolean,
    default: true,
  },
  permanentUnlock: {
    type: Boolean,
    default: true,
  },
  freeSmsCredited: {
    type: Number,
    default: 50,
  },
  // Limits
  maxUses: {
    type: Number,
    default: null, // null = unlimited
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    default: null, // null = never expires
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Usage tracking
  usedBy: [{
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    usedAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

PromoCodeSchema.index({ code: 1 });

// Validate a promo code
PromoCodeSchema.statics.validateCode = async function(code) {
  const promo = await this.findOne({ code: code.toUpperCase(), isActive: true });

  if (!promo) {
    return { valid: false, reason: 'Invalid promo code.' };
  }

  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return { valid: false, reason: 'This promo code has expired.' };
  }

  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return { valid: false, reason: 'This promo code has reached its usage limit.' };
  }

  return { valid: true, promoCode: promo };
};

// Check if a doctor already used this code
PromoCodeSchema.statics.hasBeenUsedBy = async function(code, doctorId) {
  const promo = await this.findOne({
    code: code.toUpperCase(),
    'usedBy.doctorId': doctorId,
  });
  return !!promo;
};

// Mark code as used by a doctor
PromoCodeSchema.statics.markUsed = async function(codeId, doctorId) {
  return this.findByIdAndUpdate(codeId, {
    $inc: { usedCount: 1 },
    $push: { usedBy: { doctorId, usedAt: new Date() } },
  });
};

export default mongoose.models.PromoCode || mongoose.model('PromoCode', PromoCodeSchema);
