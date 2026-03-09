import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  // Store booking data temporarily until OTP is verified
  bookingData: {
    name: String,
    age: Number,
    gender: String,
    email: String,
    whatsapp: String,
    modeOfContact: String,
    modeId: String,
    date: String,
    time: String,
    pageSlug: String,
    pageName: String,
  },
}, {
  timestamps: true,
});

// Index for auto-cleanup of expired OTPs
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to generate OTP
OTPSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to create or update OTP for a phone
OTPSchema.statics.createOTP = async function(phone, bookingData) {
  const otp = this.generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Upsert - create new or update existing
  const result = await this.findOneAndUpdate(
    { phone, verified: false },
    {
      phone,
      otp,
      expiresAt,
      attempts: 0,
      verified: false,
      bookingData,
    },
    { upsert: true, new: true }
  );

  return { otp, expiresAt, id: result._id };
};

// Static method to verify OTP
OTPSchema.statics.verifyOTP = async function(phone, inputOTP) {
  const otpRecord = await this.findOne({
    phone,
    verified: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    return { success: false, error: 'OTP expired or not found' };
  }

  if (otpRecord.attempts >= 3) {
    return { success: false, error: 'Too many attempts. Please request a new OTP.' };
  }

  if (otpRecord.otp !== inputOTP) {
    await this.updateOne(
      { _id: otpRecord._id },
      { $inc: { attempts: 1 } }
    );
    return { success: false, error: 'Invalid OTP' };
  }

  // Mark as verified
  await this.updateOne(
    { _id: otpRecord._id },
    { verified: true }
  );

  return { success: true, bookingData: otpRecord.bookingData };
};

const OTP = mongoose.models.OTP || mongoose.model('OTP', OTPSchema);

export default OTP;
