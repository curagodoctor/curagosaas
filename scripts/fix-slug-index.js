// Run this script to fix the slug index issue
// Usage: node scripts/fix-slug-index.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

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
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Check if slug_1 index exists
    const slugIndex = indexes.find(idx => idx.name === 'slug_1');

    if (slugIndex) {
      console.log('\nFound old slug_1 index. Dropping it...');
      await collection.dropIndex('slug_1');
      console.log('Successfully dropped slug_1 index!');
    } else {
      console.log('\nNo slug_1 index found. Checking for other problematic indexes...');
    }

    // Verify the compound index exists
    const compoundIndex = indexes.find(idx =>
      idx.key && idx.key.doctorId === 1 && idx.key.slug === 1
    );

    if (compoundIndex) {
      console.log('\nCompound index (doctorId_1_slug_1) exists. All good!');
    } else {
      console.log('\nCompound index missing. It will be created when the app restarts.');
    }

    // List indexes after fix
    console.log('\nIndexes after fix:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\nDone! You can now create booking pages with the same slug for different doctors.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixSlugIndex();
