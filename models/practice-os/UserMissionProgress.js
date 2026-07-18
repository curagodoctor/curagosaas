import mongoose from 'mongoose';

/**
 * Practice OS — UserMissionProgress
 *
 * Per-doctor state for a single mission. Foundation model for Weeks 2–3
 * (mission unlock, completion, scoring). Not yet wired to routes.
 */
const UserMissionProgressSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  missionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    required: true,
    index: true,
  },
  frameworkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Framework',
    index: true,
  },
  status: {
    type: String,
    enum: ['locked', 'available', 'completed', 'skipped'],
    default: 'locked',
  },
  unlockedAt: { type: Date },
  startedAt: { type: Date },
  completedAt: { type: Date },
  // Whether the mission was completed on its unlock day.
  onTime: { type: Boolean, default: false },
  // Admin manual-unlock override flag.
  manuallyUnlocked: { type: Boolean, default: false },
  reflection: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

UserMissionProgressSchema.index({ doctorId: 1, missionId: 1 }, { unique: true });
UserMissionProgressSchema.index({ doctorId: 1, status: 1 });

export default mongoose.models.UserMissionProgress
  || mongoose.model('UserMissionProgress', UserMissionProgressSchema);
