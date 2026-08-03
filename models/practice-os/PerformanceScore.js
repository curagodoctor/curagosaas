import mongoose from 'mongoose';

/**
 * Practice OS — PerformanceScore
 *
 * Per-doctor execution scoring + streaks. One record per doctor. Populated by
 * the progress engine in Week 3.
 */
const PerformanceScoreSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  // Performance/streak is per-pack: each framework has its own execution & streak.
  frameworkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Framework',
    required: true,
  },
  executionScore: { type: Number, default: 0 },
  consistencyScore: { type: Number, default: 0 },
  learningScore: { type: Number, default: 0 },
  overallScore: { type: Number, default: 0 },

  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  missedDays: { type: Number, default: 0 },
  delayedDays: { type: Number, default: 0 },

  lastActivityDate: { type: Date },
  // Once-a-day scoring guards (daily login +2, AI-used +2).
  lastLoginScoredDate: { type: Date },
  lastAiScoredDate: { type: Date },
}, { timestamps: true });

// One Performance Score per (doctor, pack).
PerformanceScoreSchema.index({ doctorId: 1, frameworkId: 1 }, { unique: true });

export default mongoose.models.PerformanceScore
  || mongoose.model('PerformanceScore', PerformanceScoreSchema);
