// Revoke every lingering optimizationAccess grant EXCEPT doctors with an active
// paid subscription (Dr. Vishu Jain). Changing accessTier to free does not clear
// the separate optimizationAccess grant, so these grants kept the daily DOS engine
// (mail + auto-run + control-center tasks) alive. This mirrors the admin "revoke"
// action: granted:false, permanent:false, expiresAt:null.
//   node scripts/revoke-stale-dos-grants.mjs          # dry run
//   node scripts/revoke-stale-dos-grants.mjs --apply  # write
import mongoose from 'mongoose';
const APPLY = process.argv.includes('--apply');
await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;
const profiles = db.collection('practiceosprofiles');
const subs = db.collection('optimizationsubscriptions');
const doctors = db.collection('doctors');

// Protect anyone with an active subscription (they legitimately have DOS).
const activeSubIds = (await subs.find({ status: 'active' }).project({ doctorId: 1 }).toArray()).map((s) => String(s.doctorId));
console.log(`Protected (active subscription): ${activeSubIds.length}`);

const granted = await profiles.find({ 'optimizationAccess.granted': true }).project({ doctorId: 1 }).toArray();
const toRevoke = granted.filter((p) => !activeSubIds.includes(String(p.doctorId)));
console.log(`Grants found: ${granted.length}; to revoke: ${toRevoke.length}`);
for (const p of toRevoke) {
  const d = await doctors.findOne({ _id: p.doctorId }, { projection: { name: 1, displayName: 1, email: 1 } });
  console.log(`  revoke -> ${d?.displayName || d?.name || d?.email || p.doctorId}`);
}
if (APPLY && toRevoke.length) {
  const ids = toRevoke.map((p) => p.doctorId);
  const res = await profiles.updateMany(
    { doctorId: { $in: ids } },
    { $set: { 'optimizationAccess.granted': false, 'optimizationAccess.permanent': false, 'optimizationAccess.expiresAt': null } },
  );
  console.log(`Applied. Modified ${res.modifiedCount}.`);
} else if (!APPLY) {
  console.log('\nDry run — re-run with --apply to write.');
}
await mongoose.disconnect();
