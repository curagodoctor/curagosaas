import mongoose from 'mongoose';

/**
 * Review Request Model
 * Tracks review request messages sent to patients after bookings
 */
const ReviewRequestSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  gmbConnectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GmbConnection',
    required: true,
  },

  // Patient Info
  patientName: {
    type: String,
    required: true,
    trim: true,
  },
  patientPhone: {
    type: String,
    required: true,
    trim: true,
  },
  patientEmail: {
    type: String,
    trim: true,
  },

  // Request Details
  channel: {
    type: String,
    enum: ['whatsapp', 'sms', 'email'],
    default: 'whatsapp',
  },
  messageTemplate: {
    type: String,
    required: true,
  },
  sentMessage: {
    type: String,
  },

  // Timing
  scheduledAt: {
    type: Date,
    required: true,
  },
  sentAt: {
    type: Date,
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'clicked', 'reviewed', 'intercepted'],
    default: 'pending',
  },

  // Tracking
  trackingId: {
    type: String,
    unique: true,
    sparse: true,
  },
  clickedAt: {
    type: Date,
  },
  clickCount: {
    type: Number,
    default: 0,
  },

  // Review Interceptor Result
  interceptorRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  interceptorFeedback: {
    type: String,
  },
  interceptedAt: {
    type: Date,
  },
  redirectedToGoogle: {
    type: Boolean,
    default: false,
  },

  // If they left a Google review
  googleReviewId: {
    type: String,
  },
  reviewedAt: {
    type: Date,
  },

  // Error tracking
  lastError: {
    type: String,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes
ReviewRequestSchema.index({ doctorId: 1, status: 1, scheduledAt: 1 });
ReviewRequestSchema.index({ bookingId: 1 }, { unique: true }); // One request per booking
ReviewRequestSchema.index({ status: 1, scheduledAt: 1 }); // For cron job
ReviewRequestSchema.index({ trackingId: 1 });

// Generate unique tracking ID before save
ReviewRequestSchema.pre('save', function() {
  if (!this.trackingId) {
    this.trackingId = `rr_${this._id.toString().slice(-8)}_${Date.now().toString(36)}`;
  }
});

// Static method to find requests ready to send
ReviewRequestSchema.statics.findReadyToSend = function() {
  return this.find({
    status: 'pending',
    scheduledAt: { $lte: new Date() },
    retryCount: { $lt: 3 },
  }).populate('gmbConnectionId');
};

// Static method to find by tracking ID
ReviewRequestSchema.statics.findByTrackingId = function(trackingId) {
  return this.findOne({ trackingId });
};

// Static method to get stats for a doctor
ReviewRequestSchema.statics.getStatsForDoctor = async function(doctorId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        doctorId: new mongoose.Types.ObjectId(doctorId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    total: 0,
    pending: 0,
    sent: 0,
    delivered: 0,
    clicked: 0,
    reviewed: 0,
    intercepted: 0,
    failed: 0,
  };

  stats.forEach(s => {
    result[s._id] = s.count;
    result.total += s.count;
  });

  return result;
};

export default mongoose.models.ReviewRequest || mongoose.model('ReviewRequest', ReviewRequestSchema);
