/**
 * Migration Script: Copy Dr. Yuvaraj's LEGACY data (without doctorId) from yuvaraj-booking to curago-saas
 *
 * The original yuvarajcurago app was single-tenant and didn't have doctorId fields.
 * This script migrates that legacy data to the new multi-tenant database.
 *
 * Usage:
 *   1. Run: node scripts/migrate-to-new-db.js
 *   2. Update .env.local with new database URL
 *
 * This script COPIES data, does NOT delete from source.
 */

import mongoose from 'mongoose';

// ============ CONFIGURATION ============
const SOURCE_DB_URI = 'mongodb+srv://team_db_user:bdMtiXdSVeH8yQg1@cluster0.fym93fu.mongodb.net/yuvaraj-booking?retryWrites=true&w=majority&appName=Cluster0';
const DEST_DB_URI = 'mongodb+srv://curagodoctor_db_user:l3ZgEtdKgkB3sNKC@cluster0.xuweomv.mongodb.net/curago-saas?retryWrites=true&w=majority&appName=Cluster0';
// =======================================

async function migrate() {
  console.log('🚀 Starting Migration of LEGACY data (without doctorId)...\n');

  // Connect to source database
  console.log('📂 Connecting to SOURCE database (yuvaraj-booking)...');
  const sourceConn = await mongoose.createConnection(SOURCE_DB_URI).asPromise();
  console.log('✅ Connected to source database\n');

  // Connect to destination database
  console.log('📂 Connecting to DESTINATION database (curago-saas)...');
  const destConn = await mongoose.createConnection(DEST_DB_URI).asPromise();
  console.log('✅ Connected to destination database\n');

  let stats = {
    consultationModes: 0,
    bookingPages: 0,
    bookings: 0,
    weeklySchedules: 0,
    dateOverrides: 0,
    timeSlots: 0,
  };

  try {
    // ============ STEP 1: Copy ConsultationModes WITHOUT doctorId ============
    console.log('📋 Copying ConsultationModes (legacy - no doctorId)...');
    const consultationModes = await sourceConn.collection('consultationmodes').find({
      $or: [
        { doctorId: { $exists: false } },
        { doctorId: null }
      ]
    }).toArray();
    console.log(`   Found ${consultationModes.length} legacy consultation modes`);

    for (const mode of consultationModes) {
      console.log(`   - ${mode.displayName || mode.name}`);
      const existing = await destConn.collection('consultationmodes').findOne({ _id: mode._id });
      if (existing) {
        await destConn.collection('consultationmodes').replaceOne({ _id: mode._id }, mode);
      } else {
        await destConn.collection('consultationmodes').insertOne(mode);
      }
      stats.consultationModes++;
    }
    console.log(`✅ Copied ${stats.consultationModes} consultation modes\n`);

    // ============ STEP 2: Copy BookingPages WITHOUT doctorId ============
    console.log('📋 Copying BookingPages (legacy - no doctorId)...');
    const bookingPages = await sourceConn.collection('bookingpages').find({
      $or: [
        { doctorId: { $exists: false } },
        { doctorId: null }
      ]
    }).toArray();
    console.log(`   Found ${bookingPages.length} legacy booking pages`);

    for (const page of bookingPages) {
      console.log(`   - ${page.slug} (${page.title})`);
      const existing = await destConn.collection('bookingpages').findOne({ _id: page._id });
      if (existing) {
        await destConn.collection('bookingpages').replaceOne({ _id: page._id }, page);
      } else {
        await destConn.collection('bookingpages').insertOne(page);
      }
      stats.bookingPages++;
    }
    console.log(`✅ Copied ${stats.bookingPages} booking pages\n`);

    // ============ STEP 3: Copy Bookings WITHOUT doctorId ============
    console.log('📋 Copying Bookings (legacy - no doctorId)...');
    const bookings = await sourceConn.collection('bookings').find({
      $or: [
        { doctorId: { $exists: false } },
        { doctorId: null }
      ]
    }).toArray();
    console.log(`   Found ${bookings.length} legacy bookings`);

    for (const booking of bookings) {
      const existing = await destConn.collection('bookings').findOne({ _id: booking._id });
      if (existing) {
        await destConn.collection('bookings').replaceOne({ _id: booking._id }, booking);
      } else {
        await destConn.collection('bookings').insertOne(booking);
      }
      stats.bookings++;
    }
    console.log(`✅ Copied ${stats.bookings} bookings\n`);

    // ============ STEP 4: Copy WeeklySchedules WITHOUT doctorId ============
    console.log('📋 Copying WeeklySchedules (legacy - no doctorId)...');
    const weeklySchedules = await sourceConn.collection('weeklyschedules').find({
      $or: [
        { doctorId: { $exists: false } },
        { doctorId: null }
      ]
    }).toArray();
    console.log(`   Found ${weeklySchedules.length} legacy weekly schedules`);

    for (const schedule of weeklySchedules) {
      const existing = await destConn.collection('weeklyschedules').findOne({ _id: schedule._id });
      if (existing) {
        await destConn.collection('weeklyschedules').replaceOne({ _id: schedule._id }, schedule);
      } else {
        await destConn.collection('weeklyschedules').insertOne(schedule);
      }
      stats.weeklySchedules++;
    }
    console.log(`✅ Copied ${stats.weeklySchedules} weekly schedules\n`);

    // ============ STEP 5: Copy DateOverrides WITHOUT doctorId ============
    console.log('📋 Copying DateOverrides (legacy - no doctorId)...');
    const dateOverrides = await sourceConn.collection('dateoverrides').find({
      $or: [
        { doctorId: { $exists: false } },
        { doctorId: null }
      ]
    }).toArray();
    console.log(`   Found ${dateOverrides.length} legacy date overrides`);

    for (const override of dateOverrides) {
      const existing = await destConn.collection('dateoverrides').findOne({ _id: override._id });
      if (existing) {
        await destConn.collection('dateoverrides').replaceOne({ _id: override._id }, override);
      } else {
        await destConn.collection('dateoverrides').insertOne(override);
      }
      stats.dateOverrides++;
    }
    console.log(`✅ Copied ${stats.dateOverrides} date overrides\n`);

    // ============ STEP 6: Copy TimeSlots WITHOUT doctorId ============
    console.log('📋 Copying TimeSlots (legacy - no doctorId)...');
    const timeSlots = await sourceConn.collection('timeslots').find({
      $or: [
        { doctorId: { $exists: false } },
        { doctorId: null }
      ]
    }).toArray();
    console.log(`   Found ${timeSlots.length} legacy time slots`);

    for (const slot of timeSlots) {
      const existing = await destConn.collection('timeslots').findOne({ _id: slot._id });
      if (existing) {
        await destConn.collection('timeslots').replaceOne({ _id: slot._id }, slot);
      } else {
        await destConn.collection('timeslots').insertOne(slot);
      }
      stats.timeSlots++;
    }
    console.log(`✅ Copied ${stats.timeSlots} time slots\n`);

    // ============ SUMMARY ============
    console.log('═══════════════════════════════════════════');
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════');
    console.log('\n📊 Summary (Legacy data without doctorId):');
    console.log(`   • Consultation Modes: ${stats.consultationModes}`);
    console.log(`   • Booking Pages: ${stats.bookingPages}`);
    console.log(`   • Bookings: ${stats.bookings}`);
    console.log(`   • Weekly Schedules: ${stats.weeklySchedules}`);
    console.log(`   • Date Overrides: ${stats.dateOverrides}`);
    console.log(`   • Time Slots: ${stats.timeSlots}`);
    console.log('\n⚠️  NEXT STEPS:');
    console.log('   1. Update .env.local with new database URL:');
    console.log('      MONGODB_URI=mongodb+srv://curagodoctor_db_user:l3ZgEtdKgkB3sNKC@cluster0.xuweomv.mongodb.net/curago-saas?retryWrites=true&w=majority&appName=Cluster0');
    console.log('   2. Restart the curago-saas application');
    console.log('   3. Verify data in the new database');
    console.log('\n📌 Note: Original data in yuvaraj-booking is PRESERVED (not deleted)');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    // Close connections
    await sourceConn.close();
    await destConn.close();
    console.log('\n🔌 Database connections closed');
  }
}

// Run migration
migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
