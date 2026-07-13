import mongoose from 'mongoose';
import { readFileSync } from 'fs';

// Load MONGODB_URI from .env.local without requiring the dotenv package.
if (!process.env.MONGODB_URI) {
  try {
    const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
    for (const line of env.split('\n')) {
      const m = line.match(/^\s*MONGODB_URI\s*=\s*(.+)\s*$/);
      if (m) {
        process.env.MONGODB_URI = m[1].replace(/^["']|["']$/g, '').trim();
        break;
      }
    }
  } catch {
    // fall through; connect() will fail with a clear message if URI is missing
  }
}

const PromoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, trim: true },
  unlocksPremium: { type: Boolean, default: true },
  permanentUnlock: { type: Boolean, default: true },
  freeSmsCredited: { type: Number, default: 50 },
  priceInINR: { type: Number, default: null },
  maxUses: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  usedBy: [{ doctorId: { type: mongoose.Schema.Types.ObjectId }, usedAt: { type: Date } }],
}, { timestamps: true });

const PromoCode = mongoose.models.PromoCode || mongoose.model('PromoCode', PromoCodeSchema);

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const codes = [
    {
      code: 'CURAGO50',
      description: 'Master promo code — unlocks all premium features forever + 50 free SMS',
      unlocksPremium: true,
      permanentUnlock: true,
      freeSmsCredited: 50,
      maxUses: null, // unlimited
      isActive: true,
    },
    {
      code: 'ZEROTOPRACTICE',
      description: 'Zero-to-Practice starter — ₹500 one-time, unlocks Contacts & Workflows + 50 free SMS',
      unlocksPremium: true,
      permanentUnlock: true,
      freeSmsCredited: 50,
      priceInINR: 500,
      maxUses: null, // unlimited (sold offline)
      isActive: true,
    },
  ];

  for (const codeData of codes) {
    const existing = await PromoCode.findOne({ code: codeData.code });
    if (existing) {
      console.log(`Promo code ${codeData.code} already exists, skipping.`);
    } else {
      await PromoCode.create(codeData);
      console.log(`Created promo code: ${codeData.code}`);
    }
  }

  console.log('Done!');
  await mongoose.disconnect();
}

seed().catch(console.error);
