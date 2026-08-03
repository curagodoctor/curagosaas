import mongoose from 'mongoose';

/**
 * Practice OS — KpiEntry
 *
 * A single KPI datapoint recorded by a doctor for a mission (e.g. Google
 * Reviews = 12). Time-series source for auto-generated graphs. Week 3.
 */
const KpiEntrySchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  missionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    index: true,
  },
  // The pack this KPI belongs to (scopes per-pack KPI graphs & reports).
  frameworkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Framework',
    index: true,
  },
  key: { type: String, trim: true, required: true },
  label: { type: String, trim: true, default: '' },
  value: { type: Number, required: true },
  unit: { type: String, trim: true, default: '' },
  recordedAt: { type: Date, default: Date.now },
}, { timestamps: true });

KpiEntrySchema.index({ doctorId: 1, key: 1, recordedAt: 1 });

export default mongoose.models.KpiEntry || mongoose.model('KpiEntry', KpiEntrySchema);
