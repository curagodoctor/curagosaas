/**
 * Check all doctor subdomains in the database
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

async function checkAllSubdomains() {
  try {
    console.log('\nFetching all doctors from database...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const doctors = await mongoose.connection.db.collection('doctors')
      .find({})
      .project({
        subdomain: 1,
        name: 1,
        displayName: 1,
        isActive: 1,
        isEmailVerified: 1,
        createdAt: 1
      })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`Found ${doctors.length} doctors:\n`);
    console.log('Status | Subdomain | Name | Active | Verified');
    console.log('-------|-----------|------|--------|----------');

    for (const doc of doctors) {
      const wouldShow = doc.isActive && doc.isEmailVerified;
      const status = wouldShow ? '✅' : '❌';
      const name = doc.displayName || doc.name || 'N/A';
      const subdomain = doc.subdomain || 'NO-SUBDOMAIN';

      console.log(`${status} | ${subdomain.padEnd(20)} | ${name.substring(0, 20).padEnd(20)} | ${doc.isActive ? 'Yes' : 'No'.padEnd(3)} | ${doc.isEmailVerified ? 'Yes' : 'No'}`);
    }

    // List all subdomains that should work
    const workingSubdomains = doctors.filter(d => d.isActive && d.isEmailVerified && d.subdomain);
    console.log(`\n\nSubdomains that SHOULD work (${workingSubdomains.length}):`);
    workingSubdomains.forEach(d => {
      console.log(`  https://${d.subdomain}.curago.in/`);
    });

    await mongoose.disconnect();
    console.log('\nDone.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAllSubdomains();
