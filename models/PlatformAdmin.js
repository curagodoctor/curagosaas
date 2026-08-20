import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Platform-admin accounts, stored in the DB. Passwords are never kept in
// plaintext — only a bcrypt hash.
const PlatformAdminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    trim: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Validate an email + password pair. Returns the admin doc on success, else null.
PlatformAdminSchema.statics.validateCredentials = async function (email, password) {
  const admin = await this.findOne({ email: String(email || '').toLowerCase(), active: true });
  if (!admin) return null;
  const ok = await bcrypt.compare(String(password || ''), admin.passwordHash);
  return ok ? admin : null;
};

// Is this a known, active admin email?
PlatformAdminSchema.statics.isAdminEmail = async function (email) {
  const admin = await this.findOne({ email: String(email || '').toLowerCase(), active: true }).select('_id');
  return !!admin;
};

// Create or update an admin's password (upsert). Hashes before storing.
PlatformAdminSchema.statics.upsertAdmin = async function (email, password, extra = {}) {
  const passwordHash = await bcrypt.hash(String(password), 10);
  return this.findOneAndUpdate(
    { email: String(email).toLowerCase() },
    { $set: { passwordHash, active: true, ...extra }, $setOnInsert: { email: String(email).toLowerCase() } },
    { upsert: true, new: true }
  );
};

const PlatformAdmin =
  mongoose.models.PlatformAdmin ||
  mongoose.model('PlatformAdmin', PlatformAdminSchema);

export default PlatformAdmin;
