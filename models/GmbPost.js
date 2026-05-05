import mongoose from 'mongoose';

/**
 * GMB Post Model
 * Stores scheduled and published GMB posts
 */
const GmbPostSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  gmbConnectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GmbConnection',
    required: true,
  },

  // Post Content
  content: {
    type: String,
    required: true,
    maxlength: 1500, // GMB limit
  },

  // Media
  mediaType: {
    type: String,
    enum: ['none', 'photo', 'video'],
    default: 'none',
  },
  mediaUrl: {
    type: String,
    trim: true,
  },

  // Post Type (GMB post types)
  postType: {
    type: String,
    enum: ['STANDARD', 'EVENT', 'OFFER'],
    default: 'STANDARD',
  },

  // Event details (for EVENT type)
  eventTitle: {
    type: String,
    trim: true,
    maxlength: 58,
  },
  eventStartDate: {
    type: Date,
  },
  eventEndDate: {
    type: Date,
  },

  // Offer details (for OFFER type)
  offerTitle: {
    type: String,
    trim: true,
    maxlength: 58,
  },
  offerTerms: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  couponCode: {
    type: String,
    trim: true,
  },
  redeemUrl: {
    type: String,
    trim: true,
  },
  offerStartDate: {
    type: Date,
  },
  offerEndDate: {
    type: Date,
  },

  // Call To Action
  ctaType: {
    type: String,
    enum: ['NONE', 'BOOK', 'ORDER', 'SHOP', 'LEARN_MORE', 'SIGN_UP', 'CALL'],
    default: 'NONE',
  },
  ctaUrl: {
    type: String,
    trim: true,
  },

  // Scheduling
  scheduledAt: {
    type: Date,
    required: true,
  },
  publishedAt: {
    type: Date,
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'publishing', 'published', 'failed', 'deleted'],
    default: 'draft',
  },

  // GMB Response
  gmbPostId: {
    type: String,
    default: null,
  },
  gmbPostUrl: {
    type: String,
    default: null,
  },

  // Error tracking
  lastError: {
    type: String,
    default: null,
  },
  retryCount: {
    type: Number,
    default: 0,
  },

  // Analytics
  views: {
    type: Number,
    default: 0,
  },
  clicks: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes
GmbPostSchema.index({ doctorId: 1, status: 1, scheduledAt: 1 });
GmbPostSchema.index({ status: 1, scheduledAt: 1 }); // For cron job
GmbPostSchema.index({ gmbConnectionId: 1, status: 1 });

// Static method to find posts ready to publish
GmbPostSchema.statics.findReadyToPublish = function() {
  return this.find({
    status: 'scheduled',
    scheduledAt: { $lte: new Date() },
    retryCount: { $lt: 3 },
  }).populate('gmbConnectionId');
};

// Static method to find posts for a doctor
GmbPostSchema.statics.findByDoctor = function(doctorId, status = null) {
  const query = { doctorId };
  if (status) query.status = status;
  return this.find(query).sort({ scheduledAt: -1 });
};

export default mongoose.models.GmbPost || mongoose.model('GmbPost', GmbPostSchema);
