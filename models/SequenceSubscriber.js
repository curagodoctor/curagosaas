import mongoose from 'mongoose';

// One person's position in a sequence. stepIndex is the NEXT step to send;
// nextSendAt is when it's due. Advanced by the daily sequence cron.
const SequenceSubscriberSchema = new mongoose.Schema({
  sequenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'NewsletterSequence', required: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  name: { type: String, default: '' },
  source: { type: String, default: 'auto' },   // 'auto' (audience) | 'import' | 'manual'

  stepIndex: { type: Number, default: 0 },
  nextSendAt: { type: Date, default: () => new Date(), index: true },
  status: { type: String, enum: ['active', 'completed', 'unsubscribed'], default: 'active', index: true },
  lastSentAt: { type: Date },
}, { timestamps: true });

// One enrollment per (sequence, email).
SequenceSubscriberSchema.index({ sequenceId: 1, email: 1 }, { unique: true });
SequenceSubscriberSchema.index({ sequenceId: 1, status: 1, nextSendAt: 1 });

const SequenceSubscriber =
  mongoose.models.SequenceSubscriber ||
  mongoose.model('SequenceSubscriber', SequenceSubscriberSchema);

export default SequenceSubscriber;
