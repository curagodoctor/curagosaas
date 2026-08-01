// One-time migration: make subdomain/phone uniqueness sparse so accounts can be
// created without them (Google / Practice-OS-only sign-ups). Drops the old
// non-sparse unique indexes and recreates them as sparse unique.
//
//   node scripts/migrate-optional-doctor-fields.mjs
//
import mongoose from 'mongoose';
import { readFileSync } from 'fs';

const uri = (readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .match(/^\s*MONGODB_URI\s*=\s*(.+)\s*$/m) || [])[1].replace(/^["']|["']$/g, '').trim();

await mongoose.connect(uri);
const col = mongoose.connection.db.collection('doctors');

const existing = await col.indexes();
const names = existing.map((i) => i.name);
console.log('existing indexes:', names.join(', '));

async function dropIfExists(name) {
  if (names.includes(name)) {
    await col.dropIndex(name);
    console.log('dropped', name);
  }
}

// Drop old non-sparse unique indexes
await dropIfExists('subdomain_1');
await dropIfExists('phone_1');

// Recreate as sparse unique
await col.createIndex({ subdomain: 1 }, { unique: true, sparse: true });
await col.createIndex({ phone: 1 }, { unique: true, sparse: true });
await col.createIndex({ googleId: 1 }, { unique: true, sparse: true });
console.log('created sparse unique indexes for subdomain, phone, googleId');

console.log('\nfinal indexes:', (await col.indexes()).map((i) => `${i.name}${i.sparse ? ' (sparse)' : ''}`).join(', '));
await mongoose.disconnect();
