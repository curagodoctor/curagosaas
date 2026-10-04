// Backfill Doctor.accessTier for existing doctors (Free / Paid / Founder model).
//
// Rule (mirrors lib/accessTier.js hasPaidSubscription — trial does NOT count as paid):
//   - active monthly or premium subscription  → 'paid'
//   - everyone else (trial, cancelled, none)   → 'free'
//   - an already-'founder' doctor is left untouched (manual comp)
//
// DRY RUN by default. Pass --apply to write.
//   node scripts/migrate-access-tier.mjs
//   node scripts/migrate-access-tier.mjs --apply
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
const tally = { free: 0, paid: 0, founder: 0, unchanged: 0, changed: 0 };
const samples = [];

for (const d of all) {
  const current = d.accessTier || 'free';
  let target;
  if (current === 'founder') {
    target = 'founder'; // preserve comp
  } else {
    const sub = await subs.findOne({ doctorId: d._id }, { projection: { plan: 1, status: 1 } });
    const paid = sub && sub.status === 'active' && (sub.plan === 'monthly' || sub.plan === 'premium');
    target = paid ? 'paid' : 'free';
  }
  tally[target]++;
  if (target !== current) {
    tally.changed++;
    if (samples.length < 20) samples.push(`${d.email || d._id}: ${current} → ${target}`);
    if (APPLY) await doctors.updateOne({ _id: d._id }, { $set: { accessTier: target } });
  } else {
    tally.unchanged++;
  }
}

console.log(`\n${APPLY ? 'APPLIED' : 'DRY RUN'} — ${all.length} doctors`);
console.log(`  target tiers: free=${tally.free} paid=${tally.paid} founder=${tally.founder}`);
console.log(`  changed=${tally.changed} unchanged=${tally.unchanged}`);
if (samples.length) { console.log('  sample changes:'); samples.forEach((s) => console.log('   ', s)); }
if (!APPLY) console.log('\n(dry run — re-run with --apply to write)');

await mongoose.disconnect();
