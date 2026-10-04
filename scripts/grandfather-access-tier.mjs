// One-time grandfather of EXISTING doctors before the Free/Paid/Founder gating
// goes live, so nobody loses access:
//   - active paid subscription (monthly/premium) → 'paid'  (keep their plan)
//   - everyone else                              → 'founder' (full platform access,
//                                                   minus DOS + AI refill, for now)
// New signups created AFTER this run default to 'free' (schema default).
//
// DRY RUN by default. Pass --apply to write.
//   node scripts/grandfather-access-tier.mjs
//   node scripts/grandfather-access-tier.mjs --apply
import mongoose from 'mongoose';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');
const uri = (readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .match(/^\s*MONGODB_URI\s*=\s*(.+)\s*$/m) || [])[1].replace(/^["']|["']$/g, '').trim();

await mongoose.connect(uri);
const db = mongoose.connection.db;
const doctors = db.collection('doctors');
const subs = db.collection('subscriptions');

const all = await doctors.find({}, { projection: { _id: 1, email: 1, accessTier: 1 } }).toArray();
const tally = { paid: 0, founder: 0, changed: 0, unchanged: 0 };
const sample = [];

for (const d of all) {
  const sub = await subs.findOne({ doctorId: d._id }, { projection: { plan: 1, status: 1 } });
  const paid = sub && sub.status === 'active' && (sub.plan === 'monthly' || sub.plan === 'premium');
  const target = paid ? 'paid' : 'founder';
  tally[target]++;
  if ((d.accessTier || 'free') !== target) {
    tally.changed++;
    if (sample.length < 15) sample.push(`${d.email || d._id}: ${d.accessTier || 'free'} → ${target}`);
    if (APPLY) await doctors.updateOne({ _id: d._id }, { $set: { accessTier: target } });
  } else {
    tally.unchanged++;
  }
}

console.log(`\n${APPLY ? 'APPLIED' : 'DRY RUN'} — ${all.length} existing doctors`);
console.log(`  grandfathered: paid=${tally.paid} (kept their plan) · founder=${tally.founder} (full access, no DOS/AI-refill)`);
console.log(`  changed=${tally.changed} unchanged=${tally.unchanged}`);
if (sample.length) { console.log('  sample:'); sample.forEach((s) => console.log('   ', s)); }
if (!APPLY) console.log('\n(dry run — re-run with --apply to write)');

await mongoose.disconnect();
