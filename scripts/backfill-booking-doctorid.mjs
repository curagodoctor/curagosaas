// One-time backfill: link bookings that have no doctorId to their doctor by
// looking up the consultation mode (modeId -> ConsultationMode.doctorId).
// Bookings created before doctorId capture was fixed had no doctorId, so they
// didn't show under the doctor and couldn't be cancelled.
//
//   node scripts/backfill-booking-doctorid.mjs
//
import mongoose from 'mongoose';
import { readFileSync } from 'fs';

const uri = (readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .match(/^\s*MONGODB_URI\s*=\s*(.+)\s*$/m) || [])[1].replace(/^["']|["']$/g, '').trim();

await mongoose.connect(uri);
const db = mongoose.connection.db;
const Bookings = db.collection('bookings');
const Modes = db.collection('consultationmodes');

const orphans = await Bookings.find({ $or: [{ doctorId: { $exists: false } }, { doctorId: null }] }).toArray();
console.log('bookings without doctorId:', orphans.length);

let fixed = 0, unresolved = 0;
for (const b of orphans) {
  if (!b.modeId) { unresolved++; continue; }
  const mode = await Modes.findOne({ _id: b.modeId });
  if (!mode?.doctorId) { unresolved++; continue; }
  await Bookings.updateOne({ _id: b._id }, { $set: { doctorId: mode.doctorId } });
  fixed++;
}

console.log('linked to doctor:', fixed, '| could not resolve (no modeId/mode):', unresolved);
await mongoose.disconnect();
