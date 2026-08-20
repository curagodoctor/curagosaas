// Seed / update platform-admin accounts in the DB with bcrypt-hashed passwords.
// Idempotent — re-running updates the password hash for existing emails.
//
//   node --env-file=.env.local scripts/seed-platform-admins.mjs

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('MONGODB_URI missing'); process.exit(1); }

// The accounts to provision.
const ACCOUNTS = [
  { email: 'yuvi.doc@gmail.com', password: 'Curago@2025', name: 'Yuvraj' },
  { email: 'vattikutiraghavendra3@gmail.com', password: 'Curago@2025', name: 'Raghavendra' },
];

await mongoose.connect(uri);
const admins = mongoose.connection.db.collection('platformadmins');

for (const acc of ACCOUNTS) {
  const email = acc.email.toLowerCase();
  const passwordHash = await bcrypt.hash(acc.password, 10);
  const res = await admins.updateOne(
    { email },
    {
      $set: { passwordHash, active: true, name: acc.name, updatedAt: new Date() },
      $setOnInsert: { email, createdAt: new Date() },
    },
    { upsert: true }
  );
  const action = res.upsertedCount ? 'created' : 'updated';
  console.log(`  ${action}: ${email}`);
}

// Ensure the unique index on email exists.
await admins.createIndex({ email: 1 }, { unique: true });

const total = await admins.countDocuments();
console.log(`\nDone. ${total} platform admin account(s) in DB.`);
await mongoose.disconnect();
