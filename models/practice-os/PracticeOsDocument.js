import mongoose from 'mongoose';

/**
 * Practice OS — Workspace document.
 *
 * A per-doctor, private text note: a filename (title) + free-form content,
 * saved with timestamps so the doctor can retrieve it later by name and date.
 */
const PracticeOsDocumentSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  title: { type: String, required: true, trim: true }, // the "file name"
  content: { type: String, default: '' },
  // kind: a plain workspace 'note', or a 'reel' item that lives in the Content
  // Planner (a workspace variant with a status + planned date).
  kind: { type: String, enum: ['note', 'reel'], default: 'note', index: true },
  // Content Planner pipeline: an idea → refined into a script → scheduled → posted.
  // ('approved' kept for backward compatibility with older items.)
  status: { type: String, enum: ['idea', 'script', 'approved', 'scheduled', 'posted'], default: 'idea' },
  plannedFor: { type: String, default: '' },   // YYYY-MM-DD — the day it's planned/scheduled for
  remindAt: { type: Date, default: null },      // optional self-reminder
  reminderSent: { type: Boolean, default: false },
}, { timestamps: true });

PracticeOsDocumentSchema.index({ doctorId: 1, kind: 1, updatedAt: -1 });

export default mongoose.models.PracticeOsDocument
  || mongoose.model('PracticeOsDocument', PracticeOsDocumentSchema);
