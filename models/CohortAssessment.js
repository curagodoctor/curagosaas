import mongoose from 'mongoose';

/**
 * Zero to Practice Builder — cohort fit-assessment submission.
 * One record per email; tracks the funnel (started the form, finished it, clicked
 * "Join the cohort") plus the computed result so the founder can reach out.
 */
const CohortAssessmentSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, index: true },
  phone: { type: String, trim: true, default: '' },
  specialty: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },

  answers: { type: mongoose.Schema.Types.Mixed, default: {} },
  result: { type: String, enum: ['', 'strong_fit', 'maybe', 'not_fit'], default: '' },
  reason: { type: String, default: '' },
  flags: {
    hard: { type: [String], default: [] },
    maybe: { type: [String], default: [] },
    positive: { type: [String], default: [] },
  },

  // Funnel timestamps.
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  clickedJoinCohort: { type: Boolean, default: false },
  joinedAt: { type: Date, default: null },
  // 'cohort' | 'builder_only' — which path they chose on the result screen.
  chosenPath: { type: String, default: '' },

  // Where the flow was entered from (landing hero / signup / control-center).
  source: { type: String, default: 'landing' },

  status: { type: String, enum: ['new', 'reviewing', 'onboarded', 'declined'], default: 'new' },
}, { timestamps: true });

export default mongoose.models.CohortAssessment
  || mongoose.model('CohortAssessment', CohortAssessmentSchema);
