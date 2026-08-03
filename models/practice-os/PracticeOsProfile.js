import mongoose from 'mongoose';

/**
 * Practice OS — doctor-global profile.
 *
 * Setup (CV / knowledge base + intent answers) is entered ONCE per doctor and
 * reused by every pack they own — buying a new pack does not re-ask for it. This
 * is the single source of truth for the AI knowledge base and intent; the same
 * fields on PracticeOsEnrollment are legacy per-pack copies kept only for
 * back-compat reads.
 */
const ExtractedFieldSchema = new mongoose.Schema({
  field: { type: String, required: true },        // e.g. "qualifications"
  value: { type: String, default: '' },
  confidence: { type: Number, default: 1 },       // 0–1; below threshold => flagged, not filled
  confirmed: { type: Boolean, default: false },   // nothing is used until the doctor confirms
}, { _id: false });

const PracticeOsProfileSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    unique: true,
  },
  // Global setup completes once; new packs inherit setupComplete=true from here.
  setupComplete: { type: Boolean, default: false },

  // Intent answers (§6) — shared across packs (why practice, tried before, etc.).
  intent: {
    whyPractice: { type: String, default: '' },
    triedBefore: { type: String, default: '' },
    sixMonths: { type: String, default: '' },
    freeTime: { type: String, default: '' },       // preferred daily window
  },

  // Credential import (CV) — the AI knowledge base, shared across every pack.
  credentials: {
    rawFileUrl: { type: String, default: '' },
    extracted: { type: [ExtractedFieldSchema], default: [] },
    cvText: { type: String, default: '' },
    summary: { type: String, default: '' },        // AI-generated professional summary
  },
}, { timestamps: true });

export default mongoose.models.PracticeOsProfile
  || mongoose.model('PracticeOsProfile', PracticeOsProfileSchema);
