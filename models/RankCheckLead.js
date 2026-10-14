import mongoose from 'mongoose';

/**
 * A lead from the free public "Where do you rank on Google Maps?" funnel. We
 * capture the prospect's details first, then show their local ranking for 5
 * AI-chosen search terms + who's ranking above them. Pure marketing funnel —
 * separate from the DOS programme.
 */
const RankResultSchema = new mongoose.Schema({
  term: { type: String, default: '' },
  rank: { type: Number, default: null },          // their position in the local pack, or null (not found)
  found: { type: Boolean, default: false },
  competitors: { type: [{ name: String, rating: Number, reviews: Number }], default: [] },
}, { _id: false });

const RankCheckLeadSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, lowercase: true, trim: true, default: '', index: true },
  phone: { type: String, default: '' },
  specialty: { type: String, default: '' },
  city: { type: String, default: '' },
  clinicName: { type: String, default: '' },

  terms: { type: [String], default: [] },
  results: { type: [RankResultSchema], default: [] },
  // Convenience summary for the admin: how many terms they ranked in.
  rankedCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.RankCheckLead || mongoose.model('RankCheckLead', RankCheckLeadSchema);
