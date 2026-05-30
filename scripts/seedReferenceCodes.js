/**
 * Seed Reference Codes
 *
 * Run this script to create initial reference codes in the database.
 * Usage: node scripts/seedReferenceCodes.js
 *
 * Make sure MONGODB_URI is set in your environment or .env.local file.
 */

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env vars from .env.local manually (no dotenv dependency)
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch (e) {
  // .env.local may not exist, rely on existing env vars
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not found. Set it in .env.local');
  process.exit(1);
}

// Define schema inline to avoid module resolution issues
const ReferenceCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, trim: true, default: '' },
  isActive: { type: Boolean, default: true },
  maxUses: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  usedBy: [{ doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }, usedAt: { type: Date, default: Date.now } }],
  expiresAt: { type: Date, default: null },
  createdBy: { type: String, default: 'platform' },
}, { timestamps: true });

const ReferenceCode = mongoose.models.ReferenceCode || mongoose.model('ReferenceCode', ReferenceCodeSchema);

const CODES = [
  { code: 'CURAGO2024', description: 'General platform access code', maxUses: 100 },
  { code: 'LAUNCH50', description: 'Launch promo - first 50 doctors', maxUses: 50 },
  { code: 'PARTNER01', description: 'Partner referral code', maxUses: null },
  { code: 'DEMO', description: 'Demo/testing code', maxUses: 10 },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const codeData of CODES) {
      const existing = await ReferenceCode.findOne({ code: codeData.code.toUpperCase() });
      if (existing) {
        console.log(`  SKIP: ${codeData.code} (already exists, used ${existing.usedCount} times)`);
      } else {
        await ReferenceCode.create(codeData);
        console.log(`  CREATED: ${codeData.code} - ${codeData.description}`);
      }
    }

    console.log('\nDone! Reference codes seeded.');
  } catch (error) {
    console.error('Error seeding reference codes:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
