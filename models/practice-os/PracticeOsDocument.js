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
}, { timestamps: true });

PracticeOsDocumentSchema.index({ doctorId: 1, updatedAt: -1 });

export default mongoose.models.PracticeOsDocument
  || mongoose.model('PracticeOsDocument', PracticeOsDocumentSchema);
