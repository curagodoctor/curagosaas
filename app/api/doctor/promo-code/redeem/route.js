import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PromoCode from '@/models/PromoCode';
import Subscription from '@/models/Subscription';
import MessageQuota from '@/models/MessageQuota';
import { requireDoctorAuth } from '@/lib/doctorAuth';

export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const { code } = await request.json();

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please enter a promo code.' },
        { status: 400 }
      );
    }

    // Check if already used by this doctor
    const alreadyUsed = await PromoCode.hasBeenUsedBy(code, doctor._id);
    if (alreadyUsed) {
      return NextResponse.json(
        { success: false, error: 'You have already used this promo code.' },
        { status: 400 }
      );
    }

    // Validate the promo code
    const result = await PromoCode.validateCode(code);
    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.reason },
        { status: 400 }
      );
    }

    const promo = result.promoCode;

    // Check if doctor already has premium
    const existingSub = await Subscription.findOne({ doctorId: doctor._id });
    if (existingSub?.plan === 'premium' && existingSub?.status === 'active') {
      return NextResponse.json(
        { success: false, error: 'Your account already has premium access.' },
        { status: 400 }
      );
    }

    // Upgrade subscription to premium
    if (existingSub) {
      existingSub.plan = 'premium';
      existingSub.status = 'active';
      existingSub.promoCode = promo.code;
      existingSub.premiumUnlockedAt = new Date();
      await existingSub.save();
    } else {
      await Subscription.create({
        doctorId: doctor._id,
        plan: 'premium',
        status: 'active',
        promoCode: promo.code,
        premiumUnlockedAt: new Date(),
      });
    }

    // Add free SMS credits
    if (promo.freeSmsCredited > 0) {
      const quota = await MessageQuota.getOrCreate(doctor._id);
      quota.smsLimit = quota.smsLimit + promo.freeSmsCredited;
      await quota.save();
    }

    // Mark promo code as used
    await PromoCode.markUsed(promo._id, doctor._id);

    return NextResponse.json({
      success: true,
      message: `Premium unlocked! ${promo.freeSmsCredited} free SMS credits added.`,
      subscription: {
        plan: 'premium',
        status: 'active',
        promoCode: promo.code,
        smsCreditsAdded: promo.freeSmsCredited,
      },
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Promo Code Redeem]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to redeem promo code.' },
      { status: 500 }
    );
  }
}
