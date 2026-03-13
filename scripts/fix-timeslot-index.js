/**
 * Migration script to fix the TimeSlot index issue
 * Run with: node --env-file=.env.local scripts/fix-timeslot-index.js
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

async function fixIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const timeslotsCollection = db.collection('timeslots');
    const doctorsCollection = db.collection('doctors');

    // Get the doctor
    const doctor = await doctorsCollection.findOne({});
    if (!doctor) {
      console.log('No doctor found!');
      return;
    }
    console.log(`Found doctor: ${doctor.email} (${doctor._id})\n`);

    // List current indexes
    console.log('Current indexes:');
    const indexes = await timeslotsCollection.indexes();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Check if the problematic time_1 index exists
    const timeIndex = indexes.find(idx => idx.name === 'time_1');

    if (timeIndex) {
      console.log('\nDropping old time_1 index...');
      await timeslotsCollection.dropIndex('time_1');
      console.log('Successfully dropped time_1 index');
    } else {
      console.log('\nNo time_1 index found (already fixed or never existed)');
    }

    // Fix orphan time slots (without doctorId)
    const orphanSlots = await timeslotsCollection.countDocuments({
      $or: [
        { doctorId: { $exists: false } },
        { doctorId: null }
      ]
    });

    console.log(`\nOrphan time slots: ${orphanSlots}`);

    if (orphanSlots > 0) {
      console.log('Assigning orphan slots to doctor...');
      const updateResult = await timeslotsCollection.updateMany(
        {
          $or: [
            { doctorId: { $exists: false } },
            { doctorId: null }
          ]
        },
        { $set: { doctorId: doctor._id } }
      );
      console.log(`Updated ${updateResult.modifiedCount} time slots`);
    }

    // Show final indexes
    console.log('\nFinal indexes:');
    const finalIndexes = await timeslotsCollection.indexes();
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Count slots per doctor
    const doctorSlots = await timeslotsCollection.countDocuments({ doctorId: doctor._id });
    console.log(`\nDoctor now has ${doctorSlots} time slots`);

    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixIndex();
