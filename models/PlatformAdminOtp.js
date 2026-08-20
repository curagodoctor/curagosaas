import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Second-factor OTP for the platform-admin portal. The OTP itself is never
// stored in plaintext — only a bcrypt hash — and rows auto-expire via TTL.
const PlatformAdminOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otpHash: {
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
}, {
  timestamps: true,
});

// Mongo TTL cleanup — the doc disappears once expiresAt passes.
PlatformAdminOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

PlatformAdminOtpSchema.statics.generateCode = function () {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create (or replace) the active OTP for an email. Returns the plaintext code
// so the caller can email it — it is never persisted in the clear.
PlatformAdminOtpSchema.statics.issue = async function (email) {
  const code = this.generateCode();
  const otpHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await this.findOneAndUpdate(
    { email: email.toLowerCase() },
    { email: email.toLowerCase(), otpHash, expiresAt, attempts: 0 },
    { upsert: true, new: true }
  );

  return { code, expiresAt };
};

// Verify a submitted code. Consumes (deletes) the OTP on success. Enforces
// expiry and a max attempt count.
PlatformAdminOtpSchema.statics.verify = async function (email, code) {
  const record = await this.findOne({
    email: email.toLowerCase(),
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    return { success: false, error: 'Your code has expired. Please sign in again to get a new one.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await this.deleteOne({ _id: record._id });
    return { success: false, error: 'Too many attempts. Please sign in again to get a new code.' };
  }

  const match = await bcrypt.compare(String(code || ''), record.otpHash);
  if (!match) {
    await this.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    return { success: false, error: 'Incorrect code. Please try again.' };
  }

  await this.deleteOne({ _id: record._id });
  return { success: true };
};

const PlatformAdminOtp =
  mongoose.models.PlatformAdminOtp ||
  mongoose.model('PlatformAdminOtp', PlatformAdminOtpSchema);

export default PlatformAdminOtp;
