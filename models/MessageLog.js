import mongoose from 'mongoose';

const MessageLogSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    index: true,
  },
  channel: {
    type: String,
    enum: ['sms', 'email'],
    required: true,
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageTemplate',
  },
  to: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
  },
  body: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending',
  },
  sentAt: {
    type: Date,
  },
  externalId: {
    type: String, // Twilio SID or Resend email ID
  },
  error: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes
MessageLogSchema.index({ doctorId: 1, status: 1, createdAt: -1 });
MessageLogSchema.index({ doctorId: 1, contactId: 1 });
MessageLogSchema.index({ externalId: 1 }, { sparse: true });

export default mongoose.models.MessageLog || mongoose.model('MessageLog', MessageLogSchema);
