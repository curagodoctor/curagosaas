import mongoose from 'mongoose';

/**
 * Practice OS — Visibility Score (0–100). Replaces XP entirely (CLAUDE.md §5).
 *
 * How findable and credible the practice is. Component weights encode a strategy
 * (local search matters most, social least). The score NEVER decreases — falling
 * behind leaves it flat while others climb.
 */
export const SCORE_WEIGHTS = { gbp: 25, reviews: 20, website: 20, systems: 20, social: 15 };
export const SCORE_LABELS = {
  gbp: 'Google Business Profile',
  reviews: 'Reviews',
  website: 'Website',
  systems: 'Systems',
  social: 'Social presence',
};

const VisibilityScoreSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  // Score is per-pack: each framework the doctor owns has its own Visibility Score.
  frameworkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Framework',
    required: true,
  },
  // Points earned per component (each capped at its weight).
  components: {
    gbp: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    website: { type: Number, default: 0 },
    systems: { type: Number, default: 0 },
    social: { type: Number, default: 0 },
  },
  total: { type: Number, default: 0 },
  // Snapshots for the trend / never-decreases guarantee.
  history: {
    type: [{ date: { type: Date, default: Date.now }, total: Number }],
    default: [],
  },
}, { timestamps: true });

// Recompute total (clamped per component), enforce monotonic non-decrease.
VisibilityScoreSchema.methods.recompute = function () {
  let total = 0;
  for (const key of Object.keys(SCORE_WEIGHTS)) {
    const capped = Math.min(this.components[key] || 0, SCORE_WEIGHTS[key]);
    this.components[key] = capped;
    total += capped;
  }
  // Never decreases.
  this.total = Math.max(this.total || 0, total);
  return this.total;
};

// One Visibility Score per (doctor, pack).
VisibilityScoreSchema.index({ doctorId: 1, frameworkId: 1 }, { unique: true });

export default mongoose.models.VisibilityScore
  || mongoose.model('VisibilityScore', VisibilityScoreSchema);
