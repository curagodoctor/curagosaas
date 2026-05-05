import mongoose from 'mongoose';

/**
 * GMB FAQ Model
 * Stores GMB Q&A (Questions and Answers) for management
 */
const GmbFaqSchema = new mongoose.Schema({
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

  // GMB Question ID (from Google)
  gmbQuestionId: {
    type: String,
    required: true,
  },

  // Question
  question: {
    type: String,
    required: true,
  },
  questionAuthorName: {
    type: String,
  },
  questionCreatedAt: {
    type: Date,
    required: true,
  },

  // Answer (owner's answer)
  answer: {
    type: String,
  },
  gmbAnswerId: {
    type: String,
  },
  answerCreatedAt: {
    type: Date,
  },
  answerUpdatedAt: {
    type: Date,
  },
  hasOwnerAnswer: {
    type: Boolean,
    default: false,
  },

  // Total answers count (from all users)
  totalAnswers: {
    type: Number,
    default: 0,
  },

  // Upvotes
  upvoteCount: {
    type: Number,
    default: 0,
  },

  // Status
  status: {
    type: String,
    enum: ['unanswered', 'answered', 'flagged'],
    default: 'unanswered',
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
GmbFaqSchema.index({ doctorId: 1, gmbQuestionId: 1 }, { unique: true });
GmbFaqSchema.index({ doctorId: 1, status: 1, questionCreatedAt: -1 });
GmbFaqSchema.index({ gmbConnectionId: 1, lastSyncAt: 1 });

// Static method to find unanswered questions
GmbFaqSchema.statics.findUnanswered = function(doctorId) {
  return this.find({
    doctorId,
    hasOwnerAnswer: false,
  }).sort({ upvoteCount: -1, questionCreatedAt: -1 });
};

// Static method to get FAQ stats
GmbFaqSchema.statics.getStatsForDoctor = async function(doctorId) {
  const stats = await this.aggregate([
    {
      $match: {
        doctorId: new mongoose.Types.ObjectId(doctorId),
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        answered: { $sum: { $cond: ['$hasOwnerAnswer', 1, 0] } },
        unanswered: { $sum: { $cond: ['$hasOwnerAnswer', 0, 1] } },
      },
    },
  ]);

  if (stats.length === 0) {
    return { total: 0, answered: 0, unanswered: 0, answerRate: 0 };
  }

  const s = stats[0];
  return {
    total: s.total,
    answered: s.answered,
    unanswered: s.unanswered,
    answerRate: s.total > 0 ? Math.round((s.answered / s.total) * 100) : 0,
  };
};

export default mongoose.models.GmbFaq || mongoose.model('GmbFaq', GmbFaqSchema);
