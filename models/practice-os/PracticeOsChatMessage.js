import mongoose from 'mongoose';

/**
 * Practice OS — Chat message.
 *
 * Persists every mission-assistant turn (user prompt + assistant reply) so the
 * full conversation history is saved per doctor + mission, with token counts.
 */
const PracticeOsChatMessageSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  missionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    index: true,
  },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, default: '' },
  // Token accounting (assistant turn carries the completion usage).
  promptTokens: { type: Number, default: 0 },
  completionTokens: { type: Number, default: 0 },
  totalTokens: { type: Number, default: 0 },
}, { timestamps: true });

PracticeOsChatMessageSchema.index({ doctorId: 1, missionId: 1, createdAt: 1 });

export default mongoose.models.PracticeOsChatMessage
  || mongoose.model('PracticeOsChatMessage', PracticeOsChatMessageSchema);
