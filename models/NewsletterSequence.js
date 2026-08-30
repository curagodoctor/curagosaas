import mongoose from 'mongoose';

// A drip flow: an ordered list of steps, each = a newsletter template + the gap
// (in days) before it goes out. Subscribers move through the steps over time.
const StepSchema = new mongoose.Schema({
  newsletterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Newsletter', required: true },
  delayDays: { type: Number, default: 0, min: 0 },   // days to wait before THIS step (from the previous / from enroll for step 0)
}, { _id: false });

const NewsletterSequenceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  steps: { type: [StepSchema], default: [] },
  enabled: { type: Boolean, default: false, index: true },
  // When enabled, new audience contacts (doctors + cohort + waitlist) are synced
  // in automatically by the daily cron.
  autoEnroll: { type: Boolean, default: true },
  createdBy: { type: String, default: '' },
}, { timestamps: true });

const NewsletterSequence =
  mongoose.models.NewsletterSequence ||
  mongoose.model('NewsletterSequence', NewsletterSequenceSchema);

export default NewsletterSequence;
