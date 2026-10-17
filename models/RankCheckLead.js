import mongoose from 'mongoose';

/**
 * A lead from the free public "Where do you rank on Google Maps?" funnel. We
 * capture the prospect's details first, then show their local ranking for 10
 * search terms (their keywords + AI-generated) and an overall score out of 30.
 */
const RankResultSchema = new mongoose.Schema({
  term: { type: String, default: '' },
  rank: { type: Number, default: null },          // local-pack position, or null (not found)
  found: { type: Boolean, default: false },
  points: { type: Number, default: 0 },           // rank1=3, rank2=2, rank3=1, else 0
  profileLink: { type: String, default: '' },     // their listing's map link (if matched)
  competitors: { type: [{ name: String, rating: Number, reviews: Number, link: String }], default: [] },
}, { _id: false });

const RankCheckLeadSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, lowercase: true, trim: true, default: '', index: true },
  whatsapp: { type: String, default: '' },
  specialty: { type: String, default: '' },
  city: { type: String, default: '' },
  localities: { type: String, default: '' },      // mandatory on the form
  gbpName: { type: String, default: '' },         // their exact Google Business Profile name (optional)
  keywords: { type: [String], default: [] },      // the keywords they entered (min 3)

  terms: { type: [String], default: [] },         // the 10 terms actually checked
  results: { type: [RankResultSchema], default: [] },
  score: { type: Number, default: 0 },            // total points
  scoreOutOf: { type: Number, default: 30 },
  rankedCount: { type: Number, default: 0 },      // how many terms they appeared in
}, { timestamps: true });

export default mongoose.models.RankCheckLead || mongoose.model('RankCheckLead', RankCheckLeadSchema);
