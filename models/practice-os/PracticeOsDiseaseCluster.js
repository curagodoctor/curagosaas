import mongoose from 'mongoose';

/**
 * Practice OS — Disease Cluster (§ disease-cluster review).
 *
 * After a doctor's GBP is approved they review the diseases they treat and the
 * treatments for each, drafted from their practice map. Approved clusters become
 * the source of truth for content generation: blog/GBP pages, GBP posts and GBP
 * services all draw from the approved disease + treatment list.
 */
const PracticeOsDiseaseClusterSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  // 'disease' = surgical path (a condition with 1–3 treatments beneath it).
  // 'treatment' = non-surgical path (a standalone treatment/procedure; name IS the
  // treatment, with itself as its single treatment). Drives which review UI shows.
  kind: { type: String, enum: ['disease', 'treatment'], default: 'disease' },
  // The disease / condition (e.g. "Gallstones") — or the treatment name in
  // treatment-mode.
  name: { type: String, required: true, trim: true },
  // Stable slug used for the diseaseCluster key on pages (e.g. "gallstones").
  slug: { type: String, trim: true, lowercase: true, default: '' },
  // Practice-value tier: 'common' = high-demand / high-practice-value driver;
  // 'authority' = complex, lower-volume condition that establishes specialist
  // authority. Drives ordering + how the doctor reviews the map.
  tier: { type: String, enum: ['common', 'authority'], default: 'common' },
  // One-line reason this condition was included (shown in the review UI).
  reason: { type: String, trim: true, default: '' },
  // Treatments for this disease. source: 'profile' (from the doctor's procedures),
  // 'ai' (suggested), or 'manual' (added by the doctor).
  treatments: {
    type: [new mongoose.Schema({
      name: { type: String, trim: true, required: true },
      source: { type: String, enum: ['profile', 'ai', 'manual'], default: 'manual' },
    }, { _id: false })],
    default: [],
  },
  // The doctor has reviewed + approved this disease and its treatments.
  approved: { type: Boolean, default: false },
  approvedAt: { type: Date, default: null },
  order: { type: Number, default: 0 },
}, { timestamps: true });

PracticeOsDiseaseClusterSchema.index({ doctorId: 1, slug: 1 }, { unique: true, sparse: true });
PracticeOsDiseaseClusterSchema.index({ doctorId: 1, order: 1 });

export default mongoose.models.PracticeOsDiseaseCluster
  || mongoose.model('PracticeOsDiseaseCluster', PracticeOsDiseaseClusterSchema);
