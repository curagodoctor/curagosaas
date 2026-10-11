import mongoose from 'mongoose';

/**
 * Weekly "what are patients searching for" report — the SerpAPI feature.
 *
 * Keyed by (specialty, city, week), NOT by doctor: two doctors in the same
 * specialty + city share the SAME search trends, so one SerpAPI fetch + AI
 * summary serves all of them. This is the cost control — we never pay per
 * doctor, only per distinct specialty+city per week.
 */
const QuerySchema = new mongoose.Schema({
  query: { type: String, required: true },
  // Where we saw it: autocomplete suggestion, People-Also-Ask question,
  // a related search, or a rising/top Google Trends query.
  kind: { type: String, enum: ['autocomplete', 'question', 'related', 'rising', 'top'], default: 'related' },
}, { _id: false });

const SearchTrendReportSchema = new mongoose.Schema({
  // Normalized (lowercased, trimmed) keys used for the unique lookup.
  specialtyKey: { type: String, required: true, index: true },
  cityKey: { type: String, default: '', index: true },
  // Display values, as the doctor entered them.
  specialty: { type: String, default: '' },
  city: { type: String, default: '' },
  // Monday 00:00 UTC of the report's ISO week.
  weekStart: { type: Date, required: true, index: true },

  queries: { type: [QuerySchema], default: [] },
  summary: { type: String, default: '' },           // AI digest for the doctor
  suggestedTopics: { type: [String], default: [] },  // what to write about next
  source: { type: String, default: 'serpapi' },
  fetchedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// One report per specialty+city per week (the shared cache key).
SearchTrendReportSchema.index({ specialtyKey: 1, cityKey: 1, weekStart: 1 }, { unique: true });

export default mongoose.models.SearchTrendReport
  || mongoose.model('SearchTrendReport', SearchTrendReportSchema);
