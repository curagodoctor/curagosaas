import mongoose from 'mongoose';

// One row per AI request, so the admin can see exactly which doctor consumed what,
// broken down by model: requests, tokens (text) / images, and estimated cost.
// Written best-effort by lib/practice-os/aiUsage.js — never blocks the main flow.
const AiUsageLogSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  // Where the call came from: 'assistant' (doctor chat), 'auto-content' (daily run),
  // 'day-image' (manual image), 'content-page' (education page), etc.
  source: { type: String, default: '' },
  kind: { type: String, enum: ['text', 'image'], default: 'text' },
  model: { type: String, default: '' },
  promptTokens: { type: Number, default: 0 },
  completionTokens: { type: Number, default: 0 },
  totalTokens: { type: Number, default: 0 },
  imageCount: { type: Number, default: 0 },
  size: { type: String, default: '' },
  // Estimated cost of this single request, in INR (computed at write time).
  costInInr: { type: Number, default: 0 },
  label: { type: String, default: '' },
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission' },
  createdAt: { type: Date, default: Date.now },
});
AiUsageLogSchema.index({ doctorId: 1, createdAt: -1 });

export default mongoose.models.AiUsageLog || mongoose.model('AiUsageLog', AiUsageLogSchema);
