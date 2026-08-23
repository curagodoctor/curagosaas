// Migrate consultation modes to be clinic-scoped.
// For every doctor that has consultation modes:
//   1. Ensure the doctor has a primary Clinic (create one from clinicName /
//      displayName if none exists).
//   2. Assign all of that doctor's modes that have no clinicId to the primary clinic.
// Also drops the old unique index { doctorId, name } so the same mode name can
// exist across a doctor's clinics.
//
//   node --env-file=.env.local scripts/migrate-modes-to-clinics.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('MONGODB_URI missing'); process.exit(1); }

await mongoose.connect(uri);
const db = mongoose.connection.db;
const doctors = db.collection('doctors');
const clinics = db.collection('clinics');
const modes = db.collection('consultationmodes');

// 1. Drop the stale unique index on { doctorId, name } if present.
try {
  const idx = await modes.indexes();
  for (const ix of idx) {
    if (ix.unique && ix.key && ix.key.doctorId === 1 && ix.key.name === 1 && !('clinicId' in ix.key)) {
      await modes.dropIndex(ix.name);
      console.log(`Dropped stale unique index ${ix.name}`);
    }
  }
} catch (e) { console.log('Index check:', e.message); }

// 2. Which doctors have modes needing a clinic?
const doctorIds = (await modes.distinct('doctorId', { doctorId: { $ne: null } })).filter(Boolean);
console.log(`Doctors with modes: ${doctorIds.length}`);

let clinicsCreated = 0, modesAssigned = 0;
for (const doctorId of doctorIds) {
  // Find (or create) a primary clinic.
  let clinic = await clinics.findOne({ doctorId }, { sort: { isPrimary: -1, sortOrder: 1, createdAt: 1 } });
  if (!clinic) {
    const doc = await doctors.findOne({ _id: doctorId }, { projection: { clinicName: 1, displayName: 1, name: 1, whatsappNumber: 1, phone: 1 } });
    const name = (doc?.clinicName && doc.clinicName.trim()) || doc?.displayName || doc?.name || 'My Clinic';
    const res = await clinics.insertOne({
      doctorId,
      name,
      phone: doc?.whatsappNumber || doc?.phone || '',
      address: {},
      isActive: true,
      isPrimary: true,
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    clinic = { _id: res.insertedId, name };
    clinicsCreated++;
    console.log(`  + created clinic "${name}" for doctor ${doctorId}`);
  }

  // Assign modes with no clinic to this primary clinic.
  const r = await modes.updateMany(
    { doctorId, $or: [{ clinicId: null }, { clinicId: { $exists: false } }] },
    { $set: { clinicId: clinic._id } }
  );
  if (r.modifiedCount) { modesAssigned += r.modifiedCount; console.log(`    → ${r.modifiedCount} modes → "${clinic.name}"`); }
}

console.log(`\nDone. Clinics created: ${clinicsCreated}, modes assigned: ${modesAssigned}.`);
await mongoose.disconnect();
