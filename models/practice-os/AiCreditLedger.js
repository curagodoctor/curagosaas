import mongoose from 'mongoose';

// Daily credit allowance — configurable via env, default 30.
const DAILY_LIMIT = parseInt(process.env.PRACTICE_OS_AI_DAILY_CREDITS, 10) > 0
  ? parseInt(process.env.PRACTICE_OS_AI_DAILY_CREDITS, 10) : 30;
// Unused credits ACCUMULATE (a doctor who works every 3–4 days keeps the days
// they skipped), but only up to a cap so it can't grow forever — a week's worth
// by default. Configurable via PRACTICE_OS_AI_MAX_CREDITS.
const MAX_BALANCE = parseInt(process.env.PRACTICE_OS_AI_MAX_CREDITS, 10) > 0
  ? parseInt(process.env.PRACTICE_OS_AI_MAX_CREDITS, 10) : DAILY_LIMIT * 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Practice OS — AiCreditLedger
 *
 * Per-doctor AI credit balance. Each day adds `dailyLimit` credits; UNUSED
 * credits carry over (accumulate) up to MAX_BALANCE, so a doctor who logs in
 * every few days can do bulk work. Consumed by the AI engine.
 */
const UsageSchema = new mongoose.Schema({
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission' },
  prompt: { type: String, trim: true },
  promptTokens: { type: Number, default: 0 },
  completionTokens: { type: Number, default: 0 },
  totalTokens: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const AiCreditLedgerSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    unique: true,
  },
  dailyLimit: { type: Number, default: DAILY_LIMIT },
  dailyBalance: { type: Number, default: DAILY_LIMIT },
  // Date (midnight) the balance was last reset to dailyLimit.
  lastResetDate: { type: Date },
  usage: { type: [UsageSchema], default: [] },
  // Cumulative token usage across the doctor's lifetime (cost tracking).
  lifetimePromptTokens: { type: Number, default: 0 },
  lifetimeCompletionTokens: { type: Number, default: 0 },
  lifetimeTokens: { type: Number, default: 0 },
}, { timestamps: true });

// Credit the doctor for every day elapsed since we last topped them up, so unused
// days accumulate (capped at MAX_BALANCE) rather than being lost at midnight.
AiCreditLedgerSchema.statics.getOrCreateForToday = async function (doctorId) {
  const today = startOfDay(new Date());
  let ledger = await this.findOne({ doctorId });
  if (!ledger) {
    return this.create({ doctorId, dailyLimit: DAILY_LIMIT, dailyBalance: DAILY_LIMIT, lastResetDate: today });
  }
  const last = ledger.lastResetDate ? startOfDay(new Date(ledger.lastResetDate)) : null;
  // How many day-boundaries have passed since the last top-up.
  const daysElapsed = last ? Math.max(0, Math.floor((today.getTime() - last.getTime()) / DAY_MS)) : 1;
  if (daysElapsed > 0) {
    // Add one day's allowance for each elapsed day, keeping whatever is unused,
    // capped at a week's worth.
    ledger.dailyLimit = DAILY_LIMIT;
    ledger.dailyBalance = Math.min(MAX_BALANCE, (ledger.dailyBalance || 0) + daysElapsed * DAILY_LIMIT);
    ledger.lastResetDate = today;
    await ledger.save();
  }
  return ledger;
};

function startOfDay(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export default mongoose.models.AiCreditLedger
  || mongoose.model('AiCreditLedger', AiCreditLedgerSchema);
