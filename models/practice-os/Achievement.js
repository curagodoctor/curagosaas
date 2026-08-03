import mongoose from 'mongoose';

/**
 * Practice OS — Achievement
 *
 * A badge / XP award earned by a doctor (mission, weekly, monthly, framework
 * completion). Feeds celebrations. Week 3.
 */
const AchievementSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  // Achievements are per-pack (a doctor earns them within one framework).
  frameworkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Framework',
    index: true,
  },
  type: {
    type: String,
    enum: ['mission', 'weekly', 'monthly', 'framework', 'streak', 'custom'],
    required: true,
  },
  title: { type: String, trim: true, required: true },
  message: { type: String, trim: true, default: '' },
  badge: { type: String, trim: true, default: '' },
  xp: { type: Number, default: 0 },
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission' },
  awardedAt: { type: Date, default: Date.now },
}, { timestamps: true });

AchievementSchema.index({ doctorId: 1, awardedAt: -1 });

export default mongoose.models.Achievement || mongoose.model('Achievement', AchievementSchema);
