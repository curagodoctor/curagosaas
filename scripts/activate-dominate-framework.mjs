// Activate the "Dominate Organic Search" framework so its 56 daily missions go
// live. The 56-day engine is imported UNPUBLISHED; run this when ready to let
// granted doctors start the pack and have missions unlock one per day (via the
// existing sequence-paced mission engine).
//
//   node scripts/activate-dominate-framework.mjs          # dry run (shows current state)
//   node scripts/activate-dominate-framework.mjs --go     # activate + publish
import mongoose from 'mongoose';
import { readFileSync } from 'fs';

const GO = process.argv.includes('--go');
const uri = (readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .match(/^\s*MONGODB_URI\s*=\s*(.+)\s*$/m) || [])[1].replace(/^["']|["']$/g, '').trim();

await mongoose.connect(uri);
const db = mongoose.connection.db;
const fw = await db.collection('frameworks').findOne({ slug: 'dominate-organic-search' });
if (!fw) { console.error('Framework "dominate-organic-search" not found — run import-56day-engine.mjs first.'); process.exit(1); }

const missions = await db.collection('missions').countDocuments({ frameworkId: fw._id });
console.log(`Framework: ${fw._id} "${fw.title}"`);
console.log(`  isActive=${fw.isActive}  isPublished=${fw.isPublished}  tier=${fw.tier}  mode=${fw.mode}  missions=${missions}`);

if (!GO) {
  console.log('\nDry run. Re-run with --go to set isActive=true, isPublished=true.');
} else {
  await db.collection('frameworks').updateOne(
    { _id: fw._id },
    { $set: { isActive: true, isPublished: true, tier: 'optimization', mode: 'mission', updatedAt: new Date() } },
  );
  console.log('\nActivated + published. Granted doctors can now start the pack; missions unlock one per day.');
}
await mongoose.disconnect();
