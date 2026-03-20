// Run this script to fix the slug index issue
// Usage: node scripts/fix-slug-index.mjs

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
          // Remove quotes if present
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

async function fixSlugIndex() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI not found in .env.local');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected!');

    const db = mongoose.connection.db;
    const collection = db.collection('bookingpages');

    // List all indexes
    console.log('\nCurrent indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}${idx.unique ? ' (unique)' : ''}`);
    });

    // Check if slug_1 index exists
    const slugIndex = indexes.find(idx => idx.name === 'slug_1');

    if (slugIndex) {
      console.log('\n⚠️  Found old slug_1 index. Dropping it...');
      await collection.dropIndex('slug_1');
      console.log('✅ Successfully dropped slug_1 index!');
    } else {
      console.log('\n✅ No slug_1 index found.');
    }

    // List indexes after fix
    console.log('\nIndexes after fix:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}${idx.unique ? ' (unique)' : ''}`);
    });

    console.log('\n✅ Done! You can now create booking pages with the same slug for different doctors.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixSlugIndex();
