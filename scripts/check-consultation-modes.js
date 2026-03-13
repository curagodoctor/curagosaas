/**
 * Debug script to check consultation modes in the database
 * Run with: node --env-file=.env.local scripts/check-consultation-modes.js
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

async function checkModes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Check consultation modes
    const modesCollection = db.collection('consultationmodes');
    const allModes = await modesCollection.find({}).toArray();

    console.log('=== ALL CONSULTATION MODES ===');
    console.log(`Total modes: ${allModes.length}\n`);

    allModes.forEach((mode, idx) => {
      console.log(`Mode ${idx + 1}:`);
      console.log(`  _id: ${mode._id}`);
      console.log(`  name: ${mode.name}`);
      console.log(`  displayName: ${mode.displayName}`);
      console.log(`  doctorId: ${mode.doctorId || 'NOT SET'}`);
      console.log(`  isActive: ${mode.isActive}`);
      console.log('');
    });

    // Check doctors
    const doctorsCollection = db.collection('doctors');
    const allDoctors = await doctorsCollection.find({}).toArray();

    console.log('=== ALL DOCTORS ===');
    console.log(`Total doctors: ${allDoctors.length}\n`);

    allDoctors.forEach((doc, idx) => {
      console.log(`Doctor ${idx + 1}:`);
      console.log(`  _id: ${doc._id}`);
      console.log(`  name: ${doc.name}`);
      console.log(`  email: ${doc.email}`);
      console.log(`  subdomain: ${doc.subdomain}`);
      console.log('');
    });

    // Count modes per doctor
    console.log('=== MODES PER DOCTOR ===');
    for (const doc of allDoctors) {
      const count = await modesCollection.countDocuments({ doctorId: doc._id });
      console.log(`${doc.email}: ${count} modes`);
    }

    // Count modes without doctorId
    const orphanCount = await modesCollection.countDocuments({
      $or: [
        { doctorId: { $exists: false } },
        { doctorId: null }
      ]
    });
    console.log(`Modes without doctorId: ${orphanCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkModes();
