// Set a doctor's platform access tier for testing Free / Paid / Founder.
//   node scripts/set-access-tier.mjs <email> <free|paid|founder>
// e.g.
//   node scripts/set-access-tier.mjs vattikutiraghavendra3@gmail.com founder
import mongoose from 'mongoose';
import { readFileSync } from 'fs';

const [, , email, tier] = process.argv;
if (!email || !['free', 'paid', 'founder'].includes(tier)) {
  console.error('Usage: node scripts/set-access-tier.mjs <email> <free|paid|founder>');
  process.exit(1);
}
const uri = (readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .match(/^\s*MONGODB_URI\s*=\s*(.+)\s*$/m) || [])[1].replace(/^["']|["']$/g, '').trim();

await mongoose.connect(uri);
const res = await mongoose.connection.db.collection('doctors')
  .updateOne({ email: email.toLowerCase() }, { $set: { accessTier: tier } });
if (!res.matchedCount) console.error(`No doctor found for ${email}`);
else console.log(`${email} → accessTier = ${tier}`);
await mongoose.disconnect();
