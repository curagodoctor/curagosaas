import mongoose from 'mongoose';

/**
 * Practice OS waitlist — email captures from the landing page.
 */
const WaitlistSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  source: { type: String, default: 'landing' },   // e.g. 'landing-hero', 'landing-final'
  name: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Waitlist || mongoose.model('Waitlist', WaitlistSchema);
