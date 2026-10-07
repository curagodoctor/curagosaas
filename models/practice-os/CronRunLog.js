import mongoose from 'mongoose';

// One row per scheduled job run, so the admin can see: did it run today, did it
// succeed, what did it do, and — per doctor — was a draft/image generated and the
// email sent. Written by each cron at the end of its run (and on failure).
const CronResultSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  name: { type: String, default: '' },
  draft: { type: Boolean, default: false },   // task content generated
  image: { type: Boolean, default: false },   // featured image generated
  email: { type: Boolean, default: false },   // email sent
  ok: { type: Boolean, default: true },
  reason: { type: String, default: '' },       // e.g. 'emailed', 'no-due-task', 'image-failed'
}, { _id: false });

const CronRunLogSchema = new mongoose.Schema({
  job: { type: String, required: true, index: true },   // e.g. 'practice-os-daily-tasks'
  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date },
  durationMs: { type: Number, default: 0 },
  ok: { type: Boolean, default: true },
  // Aggregate counters the cron reports (emailed/skipped/noTask/capped/…).
  counts: { type: mongoose.Schema.Types.Mixed, default: {} },
  // Per-doctor outcome for this run.
  results: { type: [CronResultSchema], default: [] },
  error: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});
CronRunLogSchema.index({ job: 1, createdAt: -1 });

export default mongoose.models.CronRunLog || mongoose.model('CronRunLog', CronRunLogSchema);
