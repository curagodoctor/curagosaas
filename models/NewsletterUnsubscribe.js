import mongoose from 'mongoose';

// Global suppression list. Any email here is excluded from every newsletter send.
// Populated by the public one-click unsubscribe link in each email footer.
const NewsletterUnsubscribeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  reason: { type: String, default: 'unsubscribe' },   // 'unsubscribe' | 'bounce' | 'complaint' | 'manual'
  unsubscribedAt: { type: Date, default: () => new Date() },
}, { timestamps: true });

const NewsletterUnsubscribe =
  mongoose.models.NewsletterUnsubscribe ||
  mongoose.model('NewsletterUnsubscribe', NewsletterUnsubscribeSchema);

export default NewsletterUnsubscribe;
