import mongoose from 'mongoose';

/**
 * Practice OS — Access Request (§7).
 *
 * The optimization boundary in v1 is NOT a payment wall. When a doctor finishes
 * the free setup and asks to unlock the ongoing optimization work, they fill a
 * short form; this record is created, the founder is emailed + a webhook fires,
 * and the founder manually grants access (which flips
 * PracticeOsProfile.optimizationAccess). One live request per doctor at a time.
 */
const PracticeOsAccessRequestSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  name: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  specialty: { type: String, trim: true, default: '' },
  challenge: { type: String, trim: true, default: '' },  // biggest challenge right now
  goal: { type: String, trim: true, default: '' },       // what success looks like
  status: { type: String, enum: ['pending', 'granted', 'denied'], default: 'pending', index: true },
  decidedAt: { type: Date, default: null },
  decidedBy: { type: String, trim: true, default: '' },
}, { timestamps: true });

export default mongoose.models.PracticeOsAccessRequest
  || mongoose.model('PracticeOsAccessRequest', PracticeOsAccessRequestSchema);
