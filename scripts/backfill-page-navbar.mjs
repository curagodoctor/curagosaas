// Backfill: make existing PUBLISHED booking pages appear in the site navbar.
// They were created before showInNavbar defaulted to true, so they're stuck off.
// Usage:
//   node scripts/backfill-page-navbar.mjs         # dry run (lists what would change)
//   node scripts/backfill-page-navbar.mjs --apply # actually update
import { readFileSync } from 'fs';
import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const uri = (env.match(/^MONGODB_URI=(.+)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, '');
if (!uri) { console.error('No MONGODB_URI in .env.local'); process.exit(1); }

await mongoose.connect(uri);
const db = mongoose.connection.db;
const col = db.collection('bookingpages');

const cursor = col.find({ status: 'published', showInNavbar: { $ne: true } });
const toFix = await cursor.toArray();

console.log(`${toFix.length} published page(s) currently hidden from the navbar:`);
for (const p of toFix) {
  const doc = await db.collection('doctors').findOne({ _id: p.doctorId }, { projection: { subdomain: 1 } });
  console.log(`  ${doc?.subdomain || p.doctorId}  /${p.slug}  "${(p.title || '').slice(0, 40)}"`);
}

if (!APPLY) {
  console.log('\nDRY RUN — nothing changed. Re-run with --apply to turn these on.');
} else {
  const res = await col.updateMany(
    { status: 'published', showInNavbar: { $ne: true } },
    { $set: { showInNavbar: true } },
  );
  console.log(`\nAPPLIED — set showInNavbar=true on ${res.modifiedCount} page(s).`);
}

await mongoose.disconnect();
