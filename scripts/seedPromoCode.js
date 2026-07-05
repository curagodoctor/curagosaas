import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const PromoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, trim: true },
  unlocksPremium: { type: Boolean, default: true },
  permanentUnlock: { type: Boolean, default: true },
  freeSmsCredited: { type: Number, default: 50 },
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
