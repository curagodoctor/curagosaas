// Shared AI-credit metering for every AI action (mission chat, site generate/edit,
// blog/page generate). All AI actions draw from ONE daily pool per doctor
// (AiCreditLedger, default 30/day). Paid packs grant this pool; the free tier has
// no AI access at all (gated separately by hasAiAccess in ./access).
import AiCreditLedger from '@/models/practice-os/AiCreditLedger';

export async function getRemainingCredits(doctorId) {
  const ledger = await AiCreditLedger.getOrCreateForToday(doctorId);
  return ledger.dailyBalance;
}

// Deduct `amount` credits. Returns { ok, remaining }. ok:false when insufficient
// (nothing is deducted in that case). Charge AFTER a successful AI call so failed
// generations don't cost the doctor.
export async function chargeAiCredits(doctorId, { amount = 1, label = '', tokens = 0 } = {}) {
  const ledger = await AiCreditLedger.getOrCreateForToday(doctorId);
  if (ledger.dailyBalance < amount) return { ok: false, remaining: ledger.dailyBalance };
  ledger.dailyBalance = Math.max(0, ledger.dailyBalance - amount);
  ledger.usage.push({ prompt: label ? String(label).slice(0, 200) : undefined, totalTokens: tokens || 0 });
  if (tokens) ledger.lifetimeTokens += tokens;
  await ledger.save();
  return { ok: true, remaining: ledger.dailyBalance };
}

// Guard used at the START of an AI action: throws a typed NoCredits error when the
// pool is empty, so the route can return 402 before doing any work.
export async function assertHasCredits(doctorId) {
  const remaining = await getRemainingCredits(doctorId);
  if (remaining <= 0) {
    const err = new Error('NoCredits');
    err.code = 'NoCredits';
    throw err;
  }
  return remaining;
}
