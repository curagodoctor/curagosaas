import mongoose from 'mongoose';

/**
 * GMB Connection Model
 * Stores OAuth connection details for a doctor's Google My Business account
 */
const GmbConnectionSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },

  // Google OAuth tokens
  accessToken: {
    type: String,
    required: true,
    select: false, // Don't include in queries by default for security
  },
  refreshToken: {
    type: String,
    required: true,
    select: false,
  },
  tokenExpiresAt: {
    type: Date,
    required: true,
  },

  // GMB Account Info
  accountId: {
    type: String,
    required: true,
  },
  accountName: {
    type: String,
    trim: true,
  },

  // GMB Location Info (a business can have multiple locations)
  locationId: {
    type: String,
    required: true,
  },
  locationName: {
    type: String,
    trim: true,
  },
  locationAddress: {
    type: String,
    trim: true,
  },

  // Business Info from GMB
  businessName: {
    type: String,
    trim: true,
  },
  businessPhone: {
    type: String,
    trim: true,
  },
  businessWebsite: {
    type: String,
    trim: true,
  },
  businessCategory: {
    type: String,
    trim: true,
  },
  // Google Place ID (for review links)
  placeId: {
    type: String,
    trim: true,
  },

  // Connection status
  status: {
    type: String,
    enum: ['active', 'expired', 'disconnected', 'error'],
    default: 'active',
  },
  lastSyncAt: {
    type: Date,
    default: null,
  },
  lastError: {
    type: String,
    default: null,
  },

  // Feature toggles
  features: {
    postAutomation: { type: Boolean, default: true },
    reviewRequest: { type: Boolean, default: true },
    reviewInterceptor: { type: Boolean, default: true },
    reviewReply: { type: Boolean, default: true },
    faqManagement: { type: Boolean, default: true },
    keywordDashboard: { type: Boolean, default: true },
    websiteAutoPopulation: { type: Boolean, default: true },
  },
}, {
  timestamps: true,
});

// Compound indexes
GmbConnectionSchema.index({ doctorId: 1, locationId: 1 }, { unique: true });
GmbConnectionSchema.index({ status: 1 });

// Method to check if token is expired
GmbConnectionSchema.methods.isTokenExpired = function() {
  return new Date() >= this.tokenExpiresAt;
};

// Method to check if token needs refresh (expires in 5 minutes)
GmbConnectionSchema.methods.needsTokenRefresh = function() {
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return fiveMinutesFromNow >= this.tokenExpiresAt;
};

// Static method to find active connection for a doctor (first one)
GmbConnectionSchema.statics.findActiveByDoctor = function(doctorId) {
  return this.findOne({ doctorId, status: 'active' });
};

// Static method to find all active connections for a doctor
GmbConnectionSchema.statics.findAllActiveByDoctor = function(doctorId) {
  return this.find({ doctorId, status: 'active' }).sort({ businessName: 1 });
};

export default mongoose.models.GmbConnection || mongoose.model('GmbConnection', GmbConnectionSchema);
