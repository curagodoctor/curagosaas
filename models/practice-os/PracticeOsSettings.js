import mongoose from 'mongoose';

/**
 * Practice OS — global settings (singleton).
 *
 * Founder-editable configuration that must not require an env change or redeploy.
 * The programme price lives here (PRD §1: ₹5,000–10,000 TBD) so a platform admin
 * can set it from the dashboard.
 */
const PracticeOsSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },
  priceInInr: { type: Number, default: 5000, min: 0 },
  // §8 — admin-overridable GBP setup guide (blocks + tasks). Empty = use the
  // built-in default from lib/practice-os/gbpGuide.
  gbpGuide: { type: mongoose.Schema.Types.Mixed, default: null },
  // Diseases & Treatments map generation — founder-tunable from the dashboard.
  // How many treatments the map should always produce (surgical: total across
  // diseases; non-surgical: standalone count). Also gates the review screen.
  treatmentCount: { type: Number, default: 20, min: 1, max: 40 },
  // Extra generation instructions appended to the disease/treatment prompts, so the
  // founder can steer the AI (e.g. "prefer minimally-invasive procedures") without a
  // code change. Blank = use the built-in prompt only.
  clusterGenInstructions: { type: String, default: '' },
}, { timestamps: true });

// Fetch (creating on first use). Seeds price from PRACTICE_OS_PRICE_INR if set,
// so an existing env value carries over the first time.
PracticeOsSettingsSchema.statics.getSettings = async function () {
  let s = await this.findOne({ key: 'global' });
  if (!s) {
    const seed = parseInt(process.env.PRACTICE_OS_PRICE_INR || '', 10);
    s = await this.create({ key: 'global', priceInInr: Number.isFinite(seed) && seed > 0 ? seed : 5000 });
  }
  return s;
};

export default mongoose.models.PracticeOsSettings
  || mongoose.model('PracticeOsSettings', PracticeOsSettingsSchema);
