import mongoose from 'mongoose';

// Daily credit allowance — configurable via env, default 30.
const DAILY_LIMIT = parseInt(process.env.PRACTICE_OS_AI_DAILY_CREDITS, 10) > 0
  ? parseInt(process.env.PRACTICE_OS_AI_DAILY_CREDITS, 10) : 30;

/**
 * Practice OS — AiCreditLedger
 *
 * Per-doctor daily AI credit allowance for the mission assistant (10/day,
 * resets daily, unused credits expire). Mirrors models/AIToken.js but adds
 * daily-reset tracking. Consumed by the AI engine in Week 2.
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

// Reset the daily balance if we've crossed into a new day (server-local date).
// Also keeps dailyLimit in sync with the configured allowance.
AiCreditLedgerSchema.statics.getOrCreateForToday = async function (doctorId) {
  const today = startOfDay(new Date());
  let ledger = await this.findOne({ doctorId });
  if (!ledger) {
    return this.create({ doctorId, dailyLimit: DAILY_LIMIT, dailyBalance: DAILY_LIMIT, lastResetDate: today });
  }
  let dirty = false;
  if (!ledger.lastResetDate || ledger.lastResetDate < today) {
    ledger.dailyLimit = DAILY_LIMIT;
    ledger.dailyBalance = DAILY_LIMIT;
    ledger.lastResetDate = today;
    dirty = true;
  } else if (ledger.dailyLimit !== DAILY_LIMIT) {
    // Allowance changed mid-day — apply the difference to today's balance too.
    ledger.dailyBalance = Math.max(0, ledger.dailyBalance + (DAILY_LIMIT - ledger.dailyLimit));
    ledger.dailyLimit = DAILY_LIMIT;
    dirty = true;
  }
  if (dirty) await ledger.save();
  return ledger;
};

function startOfDay(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export default mongoose.models.AiCreditLedger
  || mongoose.model('AiCreditLedger', AiCreditLedgerSchema);
