/**
 * Migration script to assign orphan consultation modes to doctor
 * Run with: node --env-file=.env.local scripts/fix-orphan-modes.js
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

async function fixOrphanModes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const modesCollection = db.collection('consultationmodes');
    const doctorsCollection = db.collection('doctors');
    const schedulesCollection = db.collection('weeklyschedules');

    // Get the doctor
    const doctor = await doctorsCollection.findOne({});
    if (!doctor) {
      console.log('No doctor found!');
      return;
    }

    console.log(`Found doctor: ${doctor.email} (${doctor._id})\n`);

    // Find orphan modes (without doctorId)
    const orphanModes = await modesCollection.find({
      $or: [
        { doctorId: { $exists: false } },
        { doctorId: null }
      ]
    }).toArray();

    console.log(`Found ${orphanModes.length} orphan modes\n`);

    if (orphanModes.length === 0) {
      console.log('No orphan modes to fix!');
      return;
    }

    // Update each orphan mode
    for (const mode of orphanModes) {
      console.log(`Fixing mode: ${mode.name} (${mode._id})`);

      // Check if doctor already has a mode with this name
      const existingMode = await modesCollection.findOne({
        doctorId: doctor._id,
        name: mode.name
      });

      if (existingMode) {
        console.log(`  -> Doctor already has a mode named "${mode.name}", deleting orphan...`);
        await modesCollection.deleteOne({ _id: mode._id });
        // Also delete any schedules for this orphan mode
        await schedulesCollection.deleteMany({ modeId: mode._id });
      } else {
        console.log(`  -> Assigning to doctor ${doctor.email}`);
        await modesCollection.updateOne(
          { _id: mode._id },
          { $set: { doctorId: doctor._id } }
        );

        // Also update weekly schedules for this mode
        const scheduleUpdateResult = await schedulesCollection.updateMany(
          { modeId: mode._id },
          { $set: { doctorId: doctor._id } }
        );
        console.log(`  -> Updated ${scheduleUpdateResult.modifiedCount} weekly schedules`);
      }
    }

    console.log('\n=== AFTER FIX ===');

    // Verify the fix
    const modesAfter = await modesCollection.find({ doctorId: doctor._id }).toArray();
    console.log(`Doctor now has ${modesAfter.length} modes:`);
    modesAfter.forEach(m => console.log(`  - ${m.name}: ${m.displayName}`));

    const orphanCount = await modesCollection.countDocuments({
      $or: [
        { doctorId: { $exists: false } },
        { doctorId: null }
      ]
    });
    console.log(`\nRemaining orphan modes: ${orphanCount}`);

    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixOrphanModes();
