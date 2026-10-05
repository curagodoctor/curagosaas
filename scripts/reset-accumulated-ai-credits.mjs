// One-off: credits used to accumulate (banked up to MAX_BALANCE). The ledger now
// resets to the daily allowance each day with no carry-over, so cap any existing
// over-limit balances down to their own dailyLimit immediately (don't wait for the
// next day boundary). `unlimited` ledgers are left alone.
//
//   node scripts/reset-accumulated-ai-credits.mjs           # dry run
//   node scripts/reset-accumulated-ai-credits.mjs --apply   # write
import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const uri = process.env.MONGODB_URI;
if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

await mongoose.connect(uri);
const col = mongoose.connection.collection('aicreditledgers');

// Only paid/refilling ledgers accumulate (dailyLimit > 0). Free-tier ledgers have
// dailyLimit: 0 and hold a one-time lifetime pool as their balance — never touch those.
const filter = {
  unlimited: { $ne: true },
  dailyLimit: { $gt: 0 },
  $expr: { $gt: ['$dailyBalance', '$dailyLimit'] },
};
const over = await col.find(filter).toArray();

console.log(`${over.length} ledger(s) with balance above their daily limit:`);
for (const l of over) {
  console.log(`  doctor=${l.doctorId}  ${l.dailyBalance} -> ${l.dailyLimit}`);
}

if (APPLY && over.length) {
  const res = await col.updateMany(filter, [{ $set: { dailyBalance: '$dailyLimit' } }]);
  console.log(`Applied. Modified ${res.modifiedCount}.`);
} else if (!APPLY) {
  console.log('\nDry run — re-run with --apply to write.');
}

await mongoose.disconnect();
