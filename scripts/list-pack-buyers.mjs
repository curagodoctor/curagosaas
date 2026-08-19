// Read-only: which doctors have bought Practice Builder packs.
// Run: node --env-file=.env.local scripts/list-pack-buyers.mjs
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const purchases = db.collection('practiceospurchases');
const doctors = db.collection('doctors');
const frameworks = db.collection('frameworks');
const enrollments = db.collection('practiceosenrollments');

// Status breakdown first.
const byStatus = await purchases.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]).toArray();
console.log('Purchases by status:', byStatus.map((s) => `${s._id}=${s.n}`).join('  ') || '(none)');

const paid = await purchases.find({ status: 'completed' }).sort({ createdAt: -1 }).toArray();
console.log(`\n${paid.length} completed pack purchase(s):\n`);

for (const p of paid) {
  const doc = p.doctorId ? await doctors.findOne({ _id: p.doctorId }, { projection: { name: 1, displayName: 1, email: 1 } }) : null;
  const fw = p.frameworkId ? await frameworks.findOne({ _id: p.frameworkId }, { projection: { title: 1 } }) : null;
  const enr = (p.doctorId && p.frameworkId) ? await enrollments.findOne({ doctorId: p.doctorId, frameworkId: p.frameworkId }, { projection: { status: 1, daysCompleted: 1 } }) : null;
  const name = doc?.displayName || doc?.name || '(unknown doctor)';
  const email = doc?.email || '';
  const pack = fw?.title || String(p.frameworkId);
  const amount = p.amountInr ?? p.amount ?? '';
  const when = p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : '';
  const progress = enr ? `${enr.status}${enr.daysCompleted != null ? ` (${enr.daysCompleted} done)` : ''}` : 'no enrollment';
  console.log(`• ${name}  <${email}>`);
  console.log(`    pack: ${pack} | ₹${amount} | bought ${when} | enrollment: ${progress}`);
}

// Distinct buyers.
const uniqueDoctorIds = [...new Set(paid.map((p) => String(p.doctorId)))];
console.log(`\nDistinct paying doctors: ${uniqueDoctorIds.length}`);

await mongoose.disconnect();
