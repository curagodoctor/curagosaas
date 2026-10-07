// Switch the Dominate Organic Search framework to CALENDAR pacing so one task
// unlocks per calendar day and incomplete tasks accumulate (stack day-wise),
// instead of sequence pacing (which blocks the next task until the current is done).
//   node scripts/set-optimization-calendar-pacing.mjs --apply
import mongoose from 'mongoose';
const APPLY = process.argv.includes('--apply');
await mongoose.connect(process.env.MONGODB_URI);
const col = mongoose.connection.collection('frameworks');
const fws = await col.find({ tier: 'optimization' }).project({ title:1, pacing:1 }).toArray();
for (const f of fws) console.log(`  ${f.title}: pacing ${f.pacing || '(unset)'} -> calendar`);
if (APPLY) { const r = await col.updateMany({ tier: 'optimization' }, { $set: { pacing: 'calendar' } }); console.log(`Applied. Modified ${r.modifiedCount}.`); }
else console.log('\nDry run — re-run with --apply.');
await mongoose.disconnect();
