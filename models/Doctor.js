import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const DoctorSchema = new mongoose.Schema({
  // Identity
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include in queries by default
  },

  // Subdomain
  subdomain: {
    type: String,
    required: [true, 'Subdomain is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'],
    maxlength: [30, 'Subdomain cannot exceed 30 characters']
  },
  customDomain: {
    type: String,
    trim: true,
    default: null
  },

  // Profile
  displayName: {
    type: String,
    trim: true,
    maxlength: [100, 'Display name cannot exceed 100 characters']
  },
  specialization: {
    type: String,
    trim: true
  },
  qualification: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },

  // Verification
  isLicensedProfessional: {
    type: Boolean,
    required: [true, 'Please confirm if you are a licensed medical professional'],
    default: false
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOTP: {
    type: String,
    select: false
  },
  emailVerificationExpiry: {
    type: Date,
    select: false
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Settings
  whatsappNumber: {
    type: String,
    trim: true
  },
  wyltoWebhookId: {
    type: String,
    trim: true
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },

  // Referral
  referralCode: {
    type: String,
    trim: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },
  myReferralCode: {
    type: String,
    unique: true,
    sparse: true
  },

  // Timestamps
  lastLoginAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index (unique fields already have indexes via unique: true)
DoctorSchema.index({ isEmailVerified: 1, isActive: 1 });

// Hash password before saving
DoctorSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Generate referral code before saving (if not set)
DoctorSchema.pre('save', function() {
  if (!this.myReferralCode) {
    // Generate a unique referral code based on subdomain + random chars
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.myReferralCode = `${this.subdomain.toUpperCase().slice(0, 4)}${randomChars}`;
  }
});

// Compare password method
DoctorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification OTP
DoctorSchema.methods.generateEmailOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailVerificationOTP = otp;
  this.emailVerificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

// Verify email OTP
DoctorSchema.methods.verifyEmailOTP = function(otp) {
  if (!this.emailVerificationOTP || !this.emailVerificationExpiry) {
    return false;
  }
  if (new Date() > this.emailVerificationExpiry) {
    return false;
  }
  return this.emailVerificationOTP === otp;
};

// Static method to find by subdomain
DoctorSchema.statics.findBySubdomain = function(subdomain) {
  return this.findOne({ subdomain: subdomain.toLowerCase(), isActive: true });
};

// Static method to check if subdomain is available
DoctorSchema.statics.isSubdomainAvailable = async function(subdomain) {
  const reserved = ['www', 'admin', 'api', 'app', 'dashboard', 'login', 'signup', 'register', 'support', 'help', 'blog', 'docs'];
  if (reserved.includes(subdomain.toLowerCase())) {
    return false;
  }
  const existing = await this.findOne({ subdomain: subdomain.toLowerCase() });
  return !existing;
};

export default mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
