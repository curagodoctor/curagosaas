import mongoose from 'mongoose';

/**
 * GMB Review Model
 * Stores fetched Google reviews for management and reply
 */
const GmbReviewSchema = new mongoose.Schema({
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

  // GMB Review ID (from Google)
  gmbReviewId: {
    type: String,
    required: true,
  },

  // Reviewer Info
  reviewerName: {
    type: String,
    trim: true,
  },
  reviewerPhotoUrl: {
    type: String,
  },
  reviewerIsAnonymous: {
    type: Boolean,
    default: false,
  },

  // Review Content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
  },
  reviewCreatedAt: {
    type: Date,
    required: true,
  },
  reviewUpdatedAt: {
    type: Date,
  },

  // Reply
  replyText: {
    type: String,
  },
  replyCreatedAt: {
    type: Date,
  },
  replyUpdatedAt: {
    type: Date,
  },
  hasReply: {
    type: Boolean,
    default: false,
  },

  // AI Suggested Reply
  aiSuggestedReply: {
    type: String,
  },
  aiSuggestedAt: {
    type: Date,
  },

  // Status
  status: {
    type: String,
    enum: ['new', 'seen', 'replied', 'flagged'],
    default: 'new',
  },

  // Internal notes
  internalNotes: {
    type: String,
  },

  // Linked to review request (if we sent one to this patient)
  reviewRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReviewRequest',
  },

  // Last synced from GMB
  lastSyncAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
GmbReviewSchema.index({ doctorId: 1, gmbReviewId: 1 }, { unique: true });
GmbReviewSchema.index({ doctorId: 1, status: 1, reviewCreatedAt: -1 });
GmbReviewSchema.index({ doctorId: 1, rating: 1 });
GmbReviewSchema.index({ gmbConnectionId: 1, lastSyncAt: 1 });

// Static method to find reviews needing reply
GmbReviewSchema.statics.findNeedingReply = function(doctorId) {
  return this.find({
    doctorId,
    hasReply: false,
    status: { $in: ['new', 'seen'] },
  }).sort({ reviewCreatedAt: -1 });
};

// Static method to get review stats for a doctor
GmbReviewSchema.statics.getStatsForDoctor = async function(doctorId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        doctorId: new mongoose.Types.ObjectId(doctorId),
        reviewCreatedAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        replied: { $sum: { $cond: ['$hasReply', 1, 0] } },
        fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      total: 0,
      averageRating: 0,
      replied: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const s = stats[0];
  return {
    total: s.total,
    averageRating: Math.round(s.averageRating * 10) / 10,
    replied: s.replied,
    replyRate: s.total > 0 ? Math.round((s.replied / s.total) * 100) : 0,
    distribution: {
      5: s.fiveStars,
      4: s.fourStars,
      3: s.threeStars,
      2: s.twoStars,
      1: s.oneStar,
    },
  };
};

export default mongoose.models.GmbReview || mongoose.model('GmbReview', GmbReviewSchema);
