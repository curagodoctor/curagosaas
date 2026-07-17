// One-time backfill: date every trial from the doctor's SIGNUP date instead of
// first-dashboard-load. Fixes existing trial subscription records and creates
// records (dated from signup) for active doctors that don't have one yet.
// Paid (monthly) and promo-unlocked (premium) subscriptions are left untouched.
//
//   node scripts/backfill-trial-dates.mjs
//
import mongoose from 'mongoose';
import { readFileSync } from 'fs';

const uri = (readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .match(/^\s*MONGODB_URI\s*=\s*(.+)\s*$/m) || [])[1].replace(/^["']|["']$/g, '').trim();

await mongoose.connect(uri);
const db = mongoose.connection.db;
const Subs = db.collection('subscriptions');
const Doctors = db.collection('doctors');

const addDays = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };
const now = new Date();

const doctors = await Doctors.find({ isActive: true }).project({ _id: 1, createdAt: 1, name: 1, displayName: 1 }).toArray();
const doctorById = new Map(doctors.map(d => [String(d._id), d]));

let fixed = 0, created = 0, skipped = 0, active = 0, locked = 0;

// 1) Fix existing trial records
const subs = await Subs.find({}).toArray();
const haveSub = new Set(subs.map(s => String(s.doctorId)));
for (const s of subs) {
  if (s.plan !== 'trial') { skipped++; continue; } // don't touch monthly/premium
  const doc = doctorById.get(String(s.doctorId));
  if (!doc?.createdAt) { skipped++; continue; }
  const start = new Date(doc.createdAt);
  const end = addDays(start, 30);
  await Subs.updateOne({ _id: s._id }, { $set: { trialStartDate: start, trialEndDate: end } });
  fixed++;
  end > now ? active++ : locked++;
}

// 2) Create trial records (signup-dated) for active doctors missing one
for (const doc of doctors) {
  if (haveSub.has(String(doc._id))) continue;
  const start = new Date(doc.createdAt || now);
  const end = addDays(start, 30);
  await Subs.insertOne({
    doctorId: doc._id,
    plan: 'trial',
    status: 'active',
    trialStartDate: start,
    trialEndDate: end,
    amount: 1000,
    promoCode: null,
    premiumUnlockedAt: null,
    createdAt: now,
    updatedAt: now,
  });
  created++;
  end > now ? active++ : locked++;
}

console.log('Backfill complete:');
console.log('  existing trial records fixed :', fixed);
console.log('  new trial records created    :', created);
console.log('  skipped (paid/promo/no-date) :', skipped);
console.log('  => now WITHIN trial (unlocked):', active);
console.log('  => now EXPIRED (locked)       :', locked);

await mongoose.disconnect();
