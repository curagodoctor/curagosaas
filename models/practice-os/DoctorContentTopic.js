import mongoose from 'mongoose';

/**
 * An actionable content topic for ONE doctor, derived from their weekly patient
 * search trends (SerpAPI) and deduped against what they already have. Persisted
 * so the demand signal is never lost; auto-queued into the content engine and
 * vetoable by the doctor.
 *
 * status: queued    — fresh, waiting for the engine to write it
 *         produced  — a draft blog was generated (see producedBlogId)
 *         dismissed — the doctor vetoed it
 *         covered   — skipped at dedup time: already covered by existing content
 */
const DoctorContentTopicSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  title: { type: String, required: true },
  normalizedKey: { type: String, required: true },   // dedup key

  source: { type: String, default: 'search-trends' },
  status: { type: String, enum: ['queued', 'produced', 'dismissed', 'covered'], default: 'queued', index: true },

  specialty: { type: String, default: '' },
  city: { type: String, default: '' },
  weekStart: { type: Date, default: null },          // the trends week it came from

  producedBlogId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogArticle', default: null },
  coveredBy: { type: String, default: '' },           // what existing content covered it (for 'covered')
}, { timestamps: true });

// One row per (doctor, topic) — refreshing never creates duplicates.
DoctorContentTopicSchema.index({ doctorId: 1, normalizedKey: 1 }, { unique: true });

export default mongoose.models.DoctorContentTopic
  || mongoose.model('DoctorContentTopic', DoctorContentTopicSchema);
