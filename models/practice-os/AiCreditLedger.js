import mongoose from 'mongoose';

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
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const AiCreditLedgerSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    unique: true,
  },
  dailyLimit: { type: Number, default: 10 },
  dailyBalance: { type: Number, default: 10 },
  // Date (midnight) the balance was last reset to dailyLimit.
  lastResetDate: { type: Date },
  usage: { type: [UsageSchema], default: [] },
}, { timestamps: true });

// Reset the daily balance if we've crossed into a new day (server-local date).
AiCreditLedgerSchema.statics.getOrCreateForToday = async function (doctorId) {
  let ledger = await this.findOne({ doctorId });
  if (!ledger) {
    ledger = await this.create({ doctorId, lastResetDate: startOfDay(new Date()) });
    return ledger;
  }
  const today = startOfDay(new Date());
  if (!ledger.lastResetDate || ledger.lastResetDate < today) {
    ledger.dailyBalance = ledger.dailyLimit;
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
