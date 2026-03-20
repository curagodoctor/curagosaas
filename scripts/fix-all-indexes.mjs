// Run this script to fix all duplicate key index issues
// Usage: node scripts/fix-all-indexes.mjs

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read .env.local manually
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length) {
          let value = valueParts.join('=');
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[key.trim()] = value;
        }
      }
    }
  } catch (err) {
    console.error('Could not read .env.local:', err.message);
  }
}

loadEnv();

// Collections and their problematic indexes to drop
const indexesToFix = [
  { collection: 'bookingpages', indexName: 'slug_1' },
  { collection: 'consultationmodes', indexName: 'name_1' },
  { collection: 'timeslots', indexName: 'time_1' },
  { collection: 'availabilities', indexName: 'date_1' },
];

async function fixIndexes() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI not found in .env.local');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected!\n');

    const db = mongoose.connection.db;

    for (const { collection, indexName } of indexesToFix) {
      console.log(`\n=== Checking ${collection} ===`);

      try {
        const col = db.collection(collection);
        const indexes = await col.indexes();

        // Find the problematic index
        const targetIndex = indexes.find(idx => idx.name === indexName);

        if (targetIndex) {
          console.log(`  Found ${indexName}: ${JSON.stringify(targetIndex.key)}${targetIndex.unique ? ' (unique)' : ''}`);

          // Check if it's a simple (non-compound) unique index
          const keyCount = Object.keys(targetIndex.key).length;
          if (keyCount === 1 && targetIndex.unique) {
            console.log(`  ⚠️  This is a simple unique index - dropping it...`);
            await col.dropIndex(indexName);
            console.log(`  ✅ Dropped ${indexName}`);
          } else {
            console.log(`  ℹ️  Index is not a simple unique index, skipping`);
          }
        } else {
          console.log(`  ✅ No ${indexName} index found (already fixed or doesn't exist)`);
        }

        // List remaining indexes
        const newIndexes = await col.indexes();
        console.log(`  Current indexes:`);
        newIndexes.forEach(idx => {
          console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}${idx.unique ? ' (unique)' : ''}`);
        });

      } catch (err) {
        if (err.codeName === 'NamespaceNotFound') {
          console.log(`  ℹ️  Collection doesn't exist yet`);
        } else {
          console.log(`  ❌ Error: ${err.message}`);
        }
      }
    }

    console.log('\n✅ Done! All index issues should be fixed.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixIndexes();
