/**
 * Quick script to check if a subdomain exists in the database
 * Run: node scripts/check-subdomain.js rishikapatil12
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match && !match[1].startsWith('#')) {
    process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const subdomain = process.argv[2] || 'rishikapatil12';

async function checkSubdomain() {
  try {
    console.log(`\nChecking subdomain: "${subdomain}"\n`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const doctor = await mongoose.connection.db.collection('doctors').findOne({
      subdomain: subdomain.toLowerCase()
    });

    if (!doctor) {
      console.log('❌ No doctor found with this subdomain\n');

      // Search for similar subdomains
      const similar = await mongoose.connection.db.collection('doctors')
        .find({ subdomain: { $regex: subdomain.substring(0, 5), $options: 'i' } })
        .project({ subdomain: 1, name: 1 })
        .limit(5)
        .toArray();

      if (similar.length > 0) {
        console.log('Similar subdomains found:');
        similar.forEach(d => console.log(`  - ${d.subdomain} (${d.name})`));
      }
    } else {
      console.log('✅ Doctor found!\n');
      console.log('Details:');
      console.log(`  Name: ${doctor.name || doctor.displayName}`);
      console.log(`  Subdomain: ${doctor.subdomain}`);
      console.log(`  Email: ${doctor.email}`);
      console.log(`  isActive: ${doctor.isActive}`);
      console.log(`  isEmailVerified: ${doctor.isEmailVerified}`);
      console.log(`  Created: ${doctor.createdAt}`);

      const wouldShow = doctor.isActive && doctor.isEmailVerified;
      console.log(`\n${wouldShow ? '✅' : '❌'} Would show on site: ${wouldShow}`);

      if (!wouldShow) {
        if (!doctor.isActive) console.log('  → Doctor is not active');
        if (!doctor.isEmailVerified) console.log('  → Email is not verified');
      }
    }

    await mongoose.disconnect();
    console.log('\nDone.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSubdomain();
