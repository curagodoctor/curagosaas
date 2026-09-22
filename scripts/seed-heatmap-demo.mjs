// Seed demo activity so a doctor can SEE the streak heatmap working.
//
// Inserts isolated "completed" UserMissionProgress rows (a DUMMY frameworkId +
// random missionIds, tagged notes '__heatmap_demo__') across the last ~150 days,
// including a current streak ending today. These rows are ignored by the real
// pack engine (dummy frameworkId + fake missionIds) and only surface in the
// activity/streak heatmap. Re-runnable: it clears prior demo rows first.
//
//   node scripts/seed-heatmap-demo.mjs                       # default email
//   node scripts/seed-heatmap-demo.mjs someone@example.com   # a specific doctor
//   node scripts/seed-heatmap-demo.mjs --clear               # remove demo rows only
import mongoose from 'mongoose';
import { readFileSync } from 'fs';

const EMAIL = (process.argv.find((a) => a.includes('@')) || 'vattikutiraghavendra3@gmail.com').toLowerCase();
const CLEAR_ONLY = process.argv.includes('--clear');
const MARKER = '__heatmap_demo__';

const uri = (readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .match(/^\s*MONGODB_URI\s*=\s*(.+)\s*$/m) || [])[1].replace(/^["']|["']$/g, '').trim();

await mongoose.connect(uri);
const db = mongoose.connection.db;

const doctor = await db.collection('doctors').findOne({ email: EMAIL });
if (!doctor) { console.error(`No doctor with email ${EMAIL}`); process.exit(1); }
console.log(`Doctor: ${doctor.displayName || doctor.name || doctor.email} (${doctor._id})`);

const progress = db.collection('usermissionprogresses');

// Always clear previous demo rows first (idempotent + supports --clear).
const del = await progress.deleteMany({ doctorId: doctor._id, 'record.notes': MARKER });
console.log(`Cleared ${del.deletedCount} prior demo row(s).`);
if (CLEAR_ONLY) { console.log('Done (clear only).'); await mongoose.disconnect(); process.exit(0); }

const dummyFrameworkId = new mongoose.Types.ObjectId(); // isolates these from any real pack

// IST calendar-day key, matching the activity API + heatmap.
const istKey = (d) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

// Build an activity pattern over the last 150 days: a scattered history plus a
// solid current streak ending today, with 1–3 completions per active day.
const today = new Date(); today.setHours(12, 0, 0, 0);
const activeDays = new Map(); // key -> count

// Current streak: the last 6 days including today.
for (let i = 0; i < 6; i++) {
  const d = new Date(today); d.setDate(d.getDate() - i);
  activeDays.set(istKey(d), 1 + (i % 3)); // 1..3
}
// Scattered history: ~45 more days sprinkled across the prior ~150 days.
let seed = 7;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
for (let day = 8; day <= 150; day++) {
  if (rnd() < 0.32) {
    const d = new Date(today); d.setDate(d.getDate() - day);
    activeDays.set(istKey(d), 1 + Math.floor(rnd() * 3)); // 1..3
  }
}

// Materialise rows: one completed record per completion on that day.
const rows = [];
for (const [key, count] of activeDays) {
  for (let n = 0; n < count; n++) {
    // Stamp completedAt at noon IST on that calendar day (key is YYYY-MM-DD).
    const completedAt = new Date(`${key}T06:30:00.000Z`); // 12:00 IST
    rows.push({
      doctorId: doctor._id,
      missionId: new mongoose.Types.ObjectId(),
      frameworkId: dummyFrameworkId,
      status: 'completed',
      completedAt,
      unlockedAt: completedAt,
      startedAt: completedAt,
      record: { screenshots: [], links: [], notes: MARKER },
      createdAt: completedAt,
      updatedAt: completedAt,
    });
  }
}

await progress.insertMany(rows, { ordered: false });
console.log(`Inserted ${rows.length} demo completion(s) across ${activeDays.size} active day(s).`);
console.log('Open the Practice OS dashboard for this doctor to see the heatmap.');

await mongoose.disconnect();
