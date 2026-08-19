// Backfill: stamp each doctor's Google review link onto their existing contacts.
// Option A — the review link is copied per-contact; this fills in contacts that
// were created before that behaviour existed. Safe to re-run (idempotent).
//
//   node --env-file=.env.local scripts/backfill-contact-review-links.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('MONGODB_URI missing'); process.exit(1); }

await mongoose.connect(uri);
const db = mongoose.connection.db;
const doctors = db.collection('doctors');
const contacts = db.collection('contacts');

const cursor = doctors.find(
  { googleReviewLink: { $exists: true, $nin: [null, ''] } },
  { projection: { _id: 1, googleReviewLink: 1, displayName: 1 } }
);

let doctorsTouched = 0, contactsUpdated = 0;
for await (const doc of cursor) {
  const link = String(doc.googleReviewLink).trim();
  if (!link) continue;
  // Only fill contacts that don't already carry this exact link.
  const res = await contacts.updateMany(
    { doctorId: doc._id, googleReviewLink: { $ne: link } },
    { $set: { googleReviewLink: link } }
  );
  if (res.modifiedCount > 0) {
    doctorsTouched++;
    contactsUpdated += res.modifiedCount;
    console.log(`  ${doc.displayName || doc._id}: ${res.modifiedCount} contacts → ${link}`);
  }
}

console.log(`\nDone. ${contactsUpdated} contacts updated across ${doctorsTouched} doctors.`);
await mongoose.disconnect();
