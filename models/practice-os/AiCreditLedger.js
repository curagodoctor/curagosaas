import mongoose from 'mongoose';

// Daily credit allowance — configurable via env, default 10 (cadence: ~10 AI
// actions/day = the prompt + image credits one task needs).
const DAILY_LIMIT = parseInt(process.env.PRACTICE_OS_AI_DAILY_CREDITS, 10) > 0
  ? parseInt(process.env.PRACTICE_OS_AI_DAILY_CREDITS, 10) : 10;
// Unused credits ACCUMULATE fully across the subscription — a doctor who signs up
// on day 1 and returns on day 28 has ~280 credits waiting. Capped only so it can't
// grow without bound; ~90 days by default. Configurable via PRACTICE_OS_AI_MAX_CREDITS.
const MAX_BALANCE = parseInt(process.env.PRACTICE_OS_AI_MAX_CREDITS, 10) > 0
  ? parseInt(process.env.PRACTICE_OS_AI_MAX_CREDITS, 10) : DAILY_LIMIT * 90;
const DAY_MS = 24 * 60 * 60 * 1000;
// §4 — the FREE tier gets a one-time starter pool of 10 credits, counted from the
// moment their website is created (lazily seeded on first AI use). Every AI
// generation — blog, GBP, images — deducts from this pool until they subscribe
// (paid tiers then use the accumulating daily pool). The first website build and
// the diseases & treatments mapping are exempt (not charged).
const FREE_LIFETIME = parseInt(process.env.PRACTICE_OS_AI_FREE_LIFETIME, 10) >= 0
  ? parseInt(process.env.PRACTICE_OS_AI_FREE_LIFETIME, 10) : 10;

/**
 * Practice OS — AiCreditLedger
 *
 * Per-doctor AI credit balance. Each day the balance RESETS to `dailyLimit` —
 * credits do NOT carry over or accumulate; unused credits are lost at the day
 * boundary. (Free tier gets a one-time FREE_LIFETIME pool that only drains.)
 * Consumed by the AI engine.
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
  // Admin override — when true, AI usage is unmetered (no daily cap).
  unlimited: { type: Boolean, default: false },
  // Date (midnight) the balance was last reset to dailyLimit.
  lastResetDate: { type: Date },
  usage: { type: [UsageSchema], default: [] },
  // Cumulative token usage across the doctor's lifetime (cost tracking).
  lifetimePromptTokens: { type: Number, default: 0 },
  lifetimeCompletionTokens: { type: Number, default: 0 },
  lifetimeTokens: { type: Number, default: 0 },
  // True once the free lifetime pool was seeded (so it's granted exactly once and
  // never refills, even if the doctor stays on the free tier).
  freeInitialized: { type: Boolean, default: false },
}, { timestamps: true });

// Get (or create) the doctor's ledger for today.
//  - paid tier: credits RESET to that day's allowance each day — they do NOT
//    accumulate/carry over. Each day you get the daily allowance, and unused
//    credits are lost at the day boundary.
//  - free tier: seed a one-time FREE_LIFETIME pool and NEVER top up.
AiCreditLedgerSchema.statics.getOrCreateForToday = async function (doctorId, paid = true) {
  const today = startOfDay(new Date());
  let ledger = await this.findOne({ doctorId });
  if (!ledger) {
    return this.create({
      doctorId,
      dailyLimit: paid ? DAILY_LIMIT : 0,
      dailyBalance: paid ? DAILY_LIMIT : FREE_LIFETIME,
      lastResetDate: today,
      freeInitialized: !paid,
    });
  }
  // Free tier: no daily reset — the one-time lifetime pool just drains.
  if (!paid) return ledger;

  const last = ledger.lastResetDate ? startOfDay(new Date(ledger.lastResetDate)) : null;
  const daysElapsed = last ? Math.max(0, Math.floor((today.getTime() - last.getTime()) / DAY_MS)) : 1;
  if (daysElapsed > 0) {
    // A new day — RESET to the day's allowance (no carry-over, no accumulation).
    ledger.dailyBalance = ledger.dailyLimit || DAILY_LIMIT;
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
