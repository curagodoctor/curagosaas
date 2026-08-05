import mongoose from 'mongoose';

/**
 * Practice OS — Enrollment
 *
 * One per doctor: their state in the 30-day programme. Sequence-paced (the next
 * day unlocks 24h after the previous is completed, not on a calendar date), so
 * `daysCompleted` is monotonic and there is never a "behind" or "missed" count.
 * See CLAUDE.md §6.
 */
const ExtractedFieldSchema = new mongoose.Schema({
  field: { type: String, required: true },        // e.g. "qualifications"
  value: { type: String, default: '' },
  confidence: { type: Number, default: 1 },       // 0–1; below threshold => flagged, not filled
  confirmed: { type: Boolean, default: false },   // nothing is used until the doctor confirms
}, { _id: false });

const LeaveSchema = new mongoose.Schema({
  from: { type: Date, required: true },
  to: { type: Date, required: true },
}, { _id: false });

const PracticeOsEnrollmentSchema = new mongoose.Schema({
  // A doctor can be enrolled in MANY packs (frameworks) at once — one enrollment
  // per (doctor, pack). Uniqueness is the compound index below, not doctorId alone.
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  frameworkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Framework',
    required: true,
  },
  status: {
    type: String,
    enum: ['setup_pending', 'active', 'completed', 'renewed'],
    default: 'setup_pending',
  },
  setupComplete: { type: Boolean, default: false },
  cohort: { type: String, default: '' },          // e.g. "2026-07"

  startedAt: { type: Date },                       // when Day 1 opened
  // Sequence-paced unlock clock: the next day becomes available at this time.
  nextUnlockAt: { type: Date },
  // The doctor's own schedule for the NEXT task (same day up to 2 days out).
  scheduledFor: { type: Date },
  scheduleWindow: { type: String, default: '' },   // morning|afternoon|evening|night
  scheduleExactTime: { type: String, default: '' },// "19:30"
  currentDayNumber: { type: Number, default: 1 },  // the day currently actionable/next
  daysCompleted: { type: Number, default: 0 },     // monotonic — never decreases

  // NOTE: `intent` and `credentials` below are LEGACY per-enrollment copies.
  // The source of truth is now the doctor-global `PracticeOsProfile` (setup is
  // entered once and reused by every pack). Kept here only for back-compat reads.
  // Intent answers (§6) — reused later (coming-back screen, month review).
  intent: {
    whyPractice: { type: String, default: '' },
    triedBefore: { type: String, default: '' },
    sixMonths: { type: String, default: '' },
    freeTime: { type: String, default: '' },       // preferred daily window
  },

  // Credential import (CV) — raw file + extracted fields kept separately (DPDP).
  // `cvText` is the parsed CV text used as the doctor's AI knowledge base.
  credentials: {
    rawFileUrl: { type: String, default: '' },
    extracted: { type: [ExtractedFieldSchema], default: [] },
    cvText: { type: String, default: '' },
    // AI-generated professional summary of the doctor (shown in the UI).
    summary: { type: String, default: '' },
  },

  // Booked leave (pre-declared absence — not a missed day).
  leave: { type: [LeaveSchema], default: [] },

  lastActiveAt: { type: Date },
  // Set when the human-rescue nudge has been sent (after ~7 days dark).
  rescueNudgedAt: { type: Date },
  // Last time a programme reminder was sent — so we send at most one per day.
  lastReminderAt: { type: Date },
}, { timestamps: true });

// One enrollment per (doctor, pack).
PracticeOsEnrollmentSchema.index({ doctorId: 1, frameworkId: 1 }, { unique: true });
PracticeOsEnrollmentSchema.index({ status: 1, nextUnlockAt: 1 });

export default mongoose.models.PracticeOsEnrollment
  || mongoose.model('PracticeOsEnrollment', PracticeOsEnrollmentSchema);
