import mongoose from 'mongoose';

// Global newsletter branding — set once, applied to every newsletter's footer +
// byline. A singleton (only one document, key: 'default').
const NewsletterSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'default', unique: true },

  // Founder byline (founder-led brand strategy)
  showFounder: { type: Boolean, default: false },
  founderName: { type: String, default: '' },
  founderCredential: { type: String, default: '' },   // e.g. "MBBS, MD · Founder, Curago"
  founderPhotoUrl: { type: String, default: '' },

  // Footer
  socialLinks: {
    type: [{ label: String, url: String }],
    default: [],
  },
  postalAddress: { type: String, default: '' },        // multiline; improves deliverability

  replyToDefault: { type: String, default: '' },       // fallback reply-to for all sends
}, { timestamps: true });

NewsletterSettingsSchema.statics.get = async function () {
  let doc = await this.findOne({ key: 'default' });
  if (!doc) doc = await this.create({ key: 'default' });
  return doc;
};

const NewsletterSettings =
  mongoose.models.NewsletterSettings ||
  mongoose.model('NewsletterSettings', NewsletterSettingsSchema);

export default NewsletterSettings;
