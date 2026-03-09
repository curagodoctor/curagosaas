/**
 * Health Check Script for Analytics Implementation
 * This script tests the analytics features without starting the dev server
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Manually load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const lines = envFile.split('\n');
    lines.forEach(line => {
      const match = line.match(/^([^=#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  }
}

loadEnvFile();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

console.log('🔍 Analytics Implementation Health Check\n');
console.log('=' .repeat(50));

// Test 1: MongoDB Connection
console.log('\n✅ Test 1: MongoDB Connection');
console.log('   MONGODB_URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

async function testConnection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('   ✓ Successfully connected to MongoDB');
    return true;
  } catch (error) {
    console.error('   ✗ Failed to connect to MongoDB:', error.message);
    return false;
  }
}

// Test 2: SlotView Model
console.log('\n✅ Test 2: SlotView Model');
async function testSlotViewModel() {
  try {
    const SlotView = require('./models/SlotView').default || require('./models/SlotView');
    console.log('   ✓ SlotView model loaded successfully');
    console.log('   ✓ Model name:', SlotView.modelName);
    console.log('   ✓ Collection:', SlotView.collection.name);

    // Check schema fields
    const schemaFields = Object.keys(SlotView.schema.paths);
    console.log('   ✓ Schema fields:', schemaFields.join(', '));

    return true;
  } catch (error) {
    console.error('   ✗ Failed to load SlotView model:', error.message);
    return false;
  }
}

// Test 3: Create Test Document
console.log('\n✅ Test 3: Create Test SlotView Document');
async function testCreateDocument() {
  try {
    const SlotView = require('./models/SlotView').default || require('./models/SlotView');

    const testData = {
      name: 'Test User',
      age: 30,
      gender: 'Male',
      email: 'test@example.com',
      whatsapp: '9876543210',
      modeOfContact: 'online',
      pageName: 'Test Page',
      pageSlug: 'test-page',
      referrer: 'test-referrer',
      userAgent: 'test-agent',
    };

    const doc = await SlotView.create(testData);
    console.log('   ✓ Test document created successfully');
    console.log('   ✓ Document ID:', doc._id);
    console.log('   ✓ Created at:', doc.createdAt);

    // Clean up test document
    await SlotView.deleteOne({ _id: doc._id });
    console.log('   ✓ Test document deleted (cleanup)');

    return true;
  } catch (error) {
    console.error('   ✗ Failed to create test document:', error.message);
    return false;
  }
}

// Test 4: Query Documents
console.log('\n✅ Test 4: Query SlotView Documents');
async function testQueryDocuments() {
  try {
    const SlotView = require('./models/SlotView').default || require('./models/SlotView');

    const count = await SlotView.countDocuments();
    console.log('   ✓ Total SlotView documents in database:', count);

    if (count > 0) {
      const recent = await SlotView.find().sort({ createdAt: -1 }).limit(3);
      console.log('   ✓ Recent documents found:', recent.length);
      recent.forEach((doc, idx) => {
        console.log(`   ✓ Doc ${idx + 1}: ${doc.name} (${doc.email}) - ${doc.modeOfContact}`);
      });
    }

    return true;
  } catch (error) {
    console.error('   ✗ Failed to query documents:', error.message);
    return false;
  }
}

// Test 5: Check Indexes
console.log('\n✅ Test 5: Verify Database Indexes');
async function testIndexes() {
  try {
    const SlotView = require('./models/SlotView').default || require('./models/SlotView');

    const indexes = await SlotView.collection.getIndexes();
    console.log('   ✓ Indexes created:', Object.keys(indexes).length);
    Object.keys(indexes).forEach(indexName => {
      console.log(`   ✓ ${indexName}:`, JSON.stringify(indexes[indexName]));
    });

    return true;
  } catch (error) {
    console.error('   ✗ Failed to check indexes:', error.message);
    return false;
  }
}

// Run all tests
async function runHealthCheck() {
  let allPassed = true;

  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ Health check failed: Cannot connect to database');
    process.exit(1);
  }

  allPassed = await testSlotViewModel() && allPassed;
  allPassed = await testCreateDocument() && allPassed;
  allPassed = await testQueryDocuments() && allPassed;
  allPassed = await testIndexes() && allPassed;

  await mongoose.connection.close();
  console.log('\n' + '='.repeat(50));

  if (allPassed) {
    console.log('✅ All health checks passed!');
    console.log('\n📋 Summary:');
    console.log('   ✓ Database connection: OK');
    console.log('   ✓ SlotView model: OK');
    console.log('   ✓ CRUD operations: OK');
    console.log('   ✓ Database indexes: OK');
    console.log('\n🎉 Analytics implementation is ready to use!');
    console.log('\n📌 Next Steps:');
    console.log('   1. Start the dev server: npm run dev');
    console.log('   2. Visit a booking page and fill the form');
    console.log('   3. Click "View Slots" to track a slot view');
    console.log('   4. Login to admin: http://localhost:3000/admin');
    console.log('   5. Go to Analytics tab to see the data');
  } else {
    console.log('❌ Some health checks failed. Please review the errors above.');
    process.exit(1);
  }
}

// Execute health check
runHealthCheck().catch(error => {
  console.error('\n❌ Health check crashed:', error);
  process.exit(1);
});
