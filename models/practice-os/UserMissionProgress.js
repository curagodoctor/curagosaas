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
  // Which modules (by their _id) within this mission the doctor has finished.
  // The mission completes when every module is in here. Per-module evidence
  // inputs are stored in `moduleInputs` keyed by module id.
  completedModuleIds: { type: [String], default: [] },
  moduleInputs: { type: mongoose.Schema.Types.Mixed, default: {} },
  // Actual minutes spent (Focus session timer; may exceed estimate — never penalised).
  actualMinutes: { type: Number, default: 0 },
  // "Your record" — the doctor's logbook for this day (his, not a submission).
  record: {
    screenshots: { type: [String], default: [] }, // Blob URLs
    links: { type: [String], default: [] },
    notes: { type: String, default: '' },
  },
  // Optional reflection captured at completion (§5).
  reflection: {
    confidence: { type: Number, default: 0 },   // 1–5
    learning: { type: String, default: '' },
    challenge: { type: String, default: '' },
  },
  // "When tomorrow?" commitment captured at completion.
  nextCommitment: {
    window: { type: String, enum: ['morning', 'afternoon', 'evening', 'night', ''], default: '' },
    exactTime: { type: String, default: '' }, // "19:30"
  },
  // Admin manual-unlock override flag.
  manuallyUnlocked: { type: Boolean, default: false },
}, { timestamps: true });

UserMissionProgressSchema.index({ doctorId: 1, missionId: 1 }, { unique: true });
UserMissionProgressSchema.index({ doctorId: 1, status: 1 });

export default mongoose.models.UserMissionProgress
  || mongoose.model('UserMissionProgress', UserMissionProgressSchema);
