// One-time migration for the multi-pack (Builder Pack) refactor.
//
// Before: one enrollment / score / performance per doctor (doctorId unique).
// After:  one per (doctor, pack) — keyed by (doctorId, frameworkId).
//
// This script:
//   1. Backfills frameworkId on existing VisibilityScore / PerformanceScore docs
//      from the doctor's existing enrollment (the single legacy pack).
//   2. Migrates legacy enrollment.credentials / enrollment.intent into the new
//      doctor-global PracticeOsProfile.
//   3. Drops the old doctorId_1 unique indexes and lets Mongoose recreate the
//      new compound {doctorId, frameworkId} unique indexes on next boot.
//   4. Publishes the single existing framework so it shows in the new catalog.
//
//   node scripts/migrate-practice-os-packs.mjs
//
import mongoose from 'mongoose';
import { readFileSync } from 'fs';

const uri = (readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .match(/^\s*MONGODB_URI\s*=\s*(.+)\s*$/m) || [])[1].replace(/^["']|["']$/g, '').trim();

await mongoose.connect(uri);
const db = mongoose.connection.db;

async function dropIndexIfExists(colName, indexName) {
  const col = db.collection(colName);
  const names = (await col.indexes()).map((i) => i.name);
  if (names.includes(indexName)) {
    await col.dropIndex(indexName);
    console.log(`dropped ${colName}.${indexName}`);
  } else {
    console.log(`(skip) ${colName}.${indexName} not present`);
  }
}

// --- 1. Backfill frameworkId on score/performance from the doctor's enrollment ---
const enrollments = await db.collection('practiceosenrollments')
  .find({}, { projection: { doctorId: 1, frameworkId: 1, credentials: 1, intent: 1, setupComplete: 1 } })
  .toArray();

const fwByDoctor = new Map();
for (const e of enrollments) {
  if (e.frameworkId) fwByDoctor.set(String(e.doctorId), e.frameworkId);
}
console.log(`\n${enrollments.length} enrollments; ${fwByDoctor.size} have a frameworkId`);

for (const colName of ['visibilityscores', 'performancescores']) {
  const col = db.collection(colName);
  let updated = 0, skipped = 0;
  for (const doc of await col.find({ frameworkId: { $exists: false } }).toArray()) {
    const fw = fwByDoctor.get(String(doc.doctorId));
    if (fw) { await col.updateOne({ _id: doc._id }, { $set: { frameworkId: fw } }); updated++; }
    else skipped++;
  }
  console.log(`${colName}: backfilled ${updated}, skipped ${skipped} (no enrollment framework)`);
}

// --- 2. Migrate legacy enrollment credentials/intent into PracticeOsProfile ---
const profiles = db.collection('practiceosprofiles');
let profilesWritten = 0;
for (const e of enrollments) {
  const hasData = (e.credentials && (e.credentials.cvText || (e.credentials.extracted || []).length))
    || (e.intent && Object.values(e.intent).some(Boolean));
  if (!hasData) continue;
  await profiles.updateOne(
    { doctorId: e.doctorId },
    { $setOnInsert: {
        doctorId: e.doctorId,
        setupComplete: !!e.setupComplete,
        intent: e.intent || {},
        credentials: e.credentials || {},
      } },
    { upsert: true }
  );
  profilesWritten++;
}
console.log(`\nprofiles upserted from legacy enrollment data: ${profilesWritten}`);

// --- 3. Drop old unique indexes (Mongoose recreates the compound ones on boot) ---
console.log('');
await dropIndexIfExists('practiceosenrollments', 'doctorId_1');
await dropIndexIfExists('visibilityscores', 'doctorId_1');
await dropIndexIfExists('performancescores', 'doctorId_1');

// --- 4. Carry the old global price onto existing packs, then publish them ---
// Before packs, price lived in the singleton PracticeOsSettings (or the
// PRACTICE_OS_PRICE_INR env). Apply it to any framework that has no price yet so
// the existing pack keeps charging instead of silently becoming free.
const frameworks = db.collection('frameworks');
const settings = await db.collection('practiceossettings').findOne({ key: 'global' });
const envPrice = parseInt(process.env.PRACTICE_OS_PRICE_INR || '', 10);
const legacyPrice = (settings && settings.priceInInr > 0)
  ? settings.priceInInr
  : (Number.isFinite(envPrice) && envPrice > 0 ? envPrice : 0);

if (legacyPrice > 0) {
  const priceRes = await frameworks.updateMany(
    { $or: [{ priceInInr: { $exists: false } }, { priceInInr: 0 }, { priceInInr: null }] },
    { $set: { priceInInr: legacyPrice } }
  );
  console.log(`\napplied legacy price ₹${legacyPrice} to ${priceRes.modifiedCount} framework(s)`);
} else {
  console.log('\nno legacy price found — existing packs remain free until priced in the admin');
}

const pubRes = await frameworks.updateMany(
  { isActive: true, isPublished: { $ne: true } },
  { $set: { isPublished: true } }
);
console.log(`published ${pubRes.modifiedCount} existing framework(s) for the catalog`);

console.log('\nMigration complete. Restart the app so Mongoose rebuilds the compound indexes.');
await mongoose.disconnect();
