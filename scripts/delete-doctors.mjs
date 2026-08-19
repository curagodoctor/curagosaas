// Preview (default) or delete two doctor accounts completely, matched by EXACT email.
// Preview:  node --env-file=.env.local scripts/delete-doctors.mjs
// Delete:   node --env-file=.env.local scripts/delete-doctors.mjs --apply
import mongoose from 'mongoose';

const EMAILS = ['raghavendra@goodenergies.in', 'raghavendra@doctorite.ai'];
const APPLY = process.argv.includes('--apply');

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const doctors = db.collection('doctors');

const found = await doctors.find({ email: { $in: EMAILS } }).toArray();
console.log(`Matched ${found.length} doctor(s) by exact email:\n`);
for (const d of found) {
  console.log(`• ${d.displayName || d.name || '(no name)'}  <${d.email}>  id=${d._id}  subdomain=${d.subdomain || '-'}  verified=${!!d.isEmailVerified}`);
}
if (!found.length) { console.log('Nothing to do.'); await mongoose.disconnect(); process.exit(0); }

const ids = found.map((d) => d._id);
const idStrs = ids.map(String);

// Count every collection that references these doctors (by doctorId or doctor), plus email-keyed ones.
const collections = (await db.listCollections().toArray()).map((c) => c.name).filter((n) => n !== 'doctors');
console.log('\nAssociated records that will be removed:');
const plan = [];
for (const name of collections) {
  const col = db.collection(name);
  const byDoctorId = await col.countDocuments({ doctorId: { $in: ids } });
  const byDoctor = await col.countDocuments({ doctor: { $in: ids } });
  const byEmail = await col.countDocuments({ email: { $in: EMAILS } });
  const total = byDoctorId + byDoctor + byEmail;
  if (total > 0) { plan.push({ name, byDoctorId, byDoctor, byEmail }); console.log(`  ${name}: ${total}`); }
}

if (!APPLY) {
  console.log('\n(DRY RUN — nothing deleted. Re-run with --apply to delete.)');
  await mongoose.disconnect();
  process.exit(0);
}

console.log('\nDeleting…');
for (const p of plan) {
  const col = db.collection(p.name);
  if (p.byDoctorId) await col.deleteMany({ doctorId: { $in: ids } });
  if (p.byDoctor) await col.deleteMany({ doctor: { $in: ids } });
  if (p.byEmail) await col.deleteMany({ email: { $in: EMAILS } });
  console.log(`  ${p.name}: removed`);
}
const res = await doctors.deleteMany({ _id: { $in: ids } });
console.log(`\nDeleted ${res.deletedCount} doctor record(s). Done.`);
await mongoose.disconnect();
