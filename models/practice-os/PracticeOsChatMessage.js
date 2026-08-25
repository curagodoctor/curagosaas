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
  // Conversation thread. "New chat" starts a fresh sessionId; older sessions stay
  // saved but are no longer shown/used for context. Legacy messages (no sessionId)
  // are treated as the 'default' thread.
  sessionId: { type: String, default: 'default', index: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, default: '' },
  // Hidden from the doctor's chat view — used for the auto-fired module prompt
  // (the doctor sees the assistant's response, not the underlying prompt).
  hidden: { type: Boolean, default: false },
  // Token accounting (assistant turn carries the completion usage).
  promptTokens: { type: Number, default: 0 },
  completionTokens: { type: Number, default: 0 },
  totalTokens: { type: Number, default: 0 },
}, { timestamps: true });

PracticeOsChatMessageSchema.index({ doctorId: 1, missionId: 1, createdAt: 1 });
PracticeOsChatMessageSchema.index({ doctorId: 1, missionId: 1, sessionId: 1, createdAt: 1 });

export default mongoose.models.PracticeOsChatMessage
  || mongoose.model('PracticeOsChatMessage', PracticeOsChatMessageSchema);
