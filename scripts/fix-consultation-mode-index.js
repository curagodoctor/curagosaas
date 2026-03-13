/**
 * Migration script to fix the ConsultationMode index issue
 *
 * Problem: Old index on `name_1` (unique on name only) conflicts with
 * multi-tenant where we need unique on { doctorId, name }
 *
 * Run with: node --env-file=.env.local scripts/fix-consultation-mode-index.js
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

async function fixIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('consultationmodes');

    // List current indexes
    console.log('\nCurrent indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Check if the problematic name_1 index exists
    const nameIndex = indexes.find(idx => idx.name === 'name_1');

    if (nameIndex) {
      console.log('\nDropping old name_1 index...');
      await collection.dropIndex('name_1');
      console.log('Successfully dropped name_1 index');
    } else {
      console.log('\nNo name_1 index found (already fixed or never existed)');
    }

    // Verify the correct compound index exists
    const compoundIndex = indexes.find(idx =>
      idx.key && idx.key.doctorId === 1 && idx.key.name === 1
    );

    if (compoundIndex) {
      console.log('\nCorrect compound index already exists:', compoundIndex.name);
    } else {
      console.log('\nCreating compound index { doctorId: 1, name: 1 }...');
      await collection.createIndex(
        { doctorId: 1, name: 1 },
        { unique: true, sparse: true }
      );
      console.log('Successfully created compound index');
    }

    // Show final indexes
    console.log('\nFinal indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixIndex();
