import mongoose from 'mongoose';

/**
 * Practice OS — Evidence
 *
 * A completion artifact a doctor attaches to a mission (image/pdf/document via
 * Vercel Blob, or a URL/text value). Foundation model for Week 2.
 */
const EvidenceSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['image', 'pdf', 'document', 'url', 'text'],
    required: true,
  },
  // Blob URL (image/pdf/document) or external URL.
  url: { type: String, trim: true, default: '' },
  // Text value or note.
  text: { type: String, trim: true, default: '' },
  fileName: { type: String, trim: true, default: '' },
}, { timestamps: true });

EvidenceSchema.index({ doctorId: 1, missionId: 1, createdAt: -1 });

export default mongoose.models.Evidence || mongoose.model('Evidence', EvidenceSchema);
