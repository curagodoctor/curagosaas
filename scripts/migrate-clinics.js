/**
 * Migration script to update existing clinic booking pages with new display fields.
 * Run with: node scripts/migrate-clinics.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read env file manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch ? mongoMatch[1].trim() : null;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

// Clinic configurations to migrate (using actual slugs from database)
const clinicConfigs = {
  'gs': {
    category: 'myclinic',
    displayName: 'Gallbladder Clinic',
    shortDescription: 'Specialized care for gallbladder conditions including gallstones, cholecystitis, and biliary disorders.',
    displayOrder: 1,
    iconType: 'gallbladder',
    colorScheme: 'green',
    showInNavbar: true,
  },
  'ibsconsult': {
    category: 'myclinic',
    displayName: 'IBS Clinic',
    shortDescription: 'Expert management of Irritable Bowel Syndrome with personalized treatment plans and dietary guidance.',
    displayOrder: 2,
    iconType: 'ibs',
    colorScheme: 'blue',
    showInNavbar: true,
  },
  'second-opinion': {
    category: 'myclinic',
    displayName: 'Second Opinion Clinic',
    shortDescription: 'Get expert second opinions on your diagnosis and treatment plans from Dr. Yuvaraj.',
    displayOrder: 3,
    iconType: 'second-opinion',
    colorScheme: 'purple',
    showInNavbar: true,
  },
  'online-consult': {
    category: 'myclinic',
    displayName: 'Online Clinic',
    shortDescription: 'Convenient video consultations from the comfort of your home. Available across India.',
    displayOrder: 4,
    iconType: 'online',
    colorScheme: 'orange',
    showInNavbar: true,
  },
};

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the BookingPage collection
    const db = mongoose.connection.db;
    const collection = db.collection('bookingpages');

    // First, list all existing pages
    const existingPages = await collection.find({}, { projection: { slug: 1, title: 1, status: 1 } }).toArray();
    console.log('\n=== Existing Booking Pages ===');
    if (existingPages.length === 0) {
      console.log('No booking pages found in database!');
    } else {
      existingPages.forEach(p => console.log(`  - ${p.slug} (${p.title}) [${p.status}]`));
    }

    const results = [];

    for (const [slug, config] of Object.entries(clinicConfigs)) {
      console.log(`\nProcessing: ${slug}`);

      const page = await collection.findOne({ slug });

      if (page) {
        // Update the page with new fields
        const updateResult = await collection.updateOne(
          { slug },
          { $set: config }
        );

        if (updateResult.modifiedCount > 0) {
          console.log(`  ✅ Updated: ${slug}`);
          results.push({ slug, status: 'updated' });
        } else {
          console.log(`  ⚠️  No changes needed for: ${slug}`);
          results.push({ slug, status: 'no_changes' });
        }
      } else {
        console.log(`  ❌ Not found: ${slug}`);
        results.push({ slug, status: 'not_found' });
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

migrate();
