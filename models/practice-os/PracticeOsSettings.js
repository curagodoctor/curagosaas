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
