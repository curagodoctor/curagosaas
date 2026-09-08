import mongoose from 'mongoose';

/**
 * Practice OS — global settings (singleton).
 *
 * Founder-editable configuration that must not require an env change or redeploy.
 * The programme price lives here (PRD §1: ₹5,000–10,000 TBD) so a platform admin
 * can set it from the dashboard.
 */
// §6 — orientation video library. A global, ordered set of labeled lecture
// videos (general organic-presence knowledge) shown while GBP verification is
// pending. Each has a title + notes; the doctor can watch one or play them all.
const OrientationVideoSchema = new mongoose.Schema({
  title: { type: String, trim: true, required: true },
  description: { type: String, trim: true, default: '' }, // lecture notes
  videoUrl: { type: String, trim: true, required: true },  // YouTube or direct file
  order: { type: Number, default: 0 },
}, { _id: false });

const PracticeOsSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },
  priceInInr: { type: Number, default: 5000, min: 0 },
  orientationVideos: { type: [OrientationVideoSchema], default: [] },
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
