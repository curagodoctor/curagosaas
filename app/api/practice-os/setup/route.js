import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertPackAccess } from '@/lib/practice-os/access';
import { getOrCreateEnrollment } from '@/lib/practice-os/engine';
import { getOrCreateProfile, generateDoctorSummary } from '@/lib/practice-os/profile';

/**
 * POST /api/practice-os/setup — Day-0 setup steps.
 * Setup is DOCTOR-GLOBAL (entered once, reused by every pack). The optional
 * body.packId is the pack being entered; on 'complete' its enrollment is started.
 * body.step: 'credentials' | 'intent' | 'summary' | 'complete'
 */
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const body = await request.json();
    const profile = await getOrCreateProfile(doctor._id);
    let summary;

    if (body.step === 'credentials') {
      // Merge (never wipe cvText / summary). The UI only sends confirmed fields.
      profile.credentials = profile.credentials || {};
      if (body.rawFileUrl) profile.credentials.rawFileUrl = body.rawFileUrl;
      if (Array.isArray(body.extracted)) profile.credentials.extracted = body.extracted;
      await profile.save();
    } else if (body.step === 'summary') {
      // Generate the AI summary from the confirmed profile and store it.
      summary = await generateDoctorSummary(doctor._id);
      profile.credentials = profile.credentials || {};
      profile.credentials.summary = summary;
      await profile.save();
    } else if (body.step === 'intent') {
      profile.intent = {
        whyPractice: body.whyPractice || '',
        triedBefore: body.triedBefore || '',
        sixMonths: body.sixMonths || '',
        freeTime: body.freeTime || '',
      };
      await profile.save();
    } else if (body.step === 'complete') {
      // Mark global setup done so future packs skip it.
      profile.setupComplete = true;
      await profile.save();

      // Start the pack the doctor is entering (Day 1 opens immediately).
      if (body.packId) {
        await assertPackAccess(doctor._id, body.packId);
        const enr = await getOrCreateEnrollment(doctor._id, body.packId);
        enr.setupComplete = true;
        enr.status = 'active';
        if (!enr.startedAt) enr.startedAt = new Date();
        enr.nextUnlockAt = null; // Day 1 opens immediately
        enr.currentDayNumber = 1;
        enr.lastActiveAt = new Date();
        await enr.save();
      }
    } else {
      return NextResponse.json({ success: false, error: 'Unknown step' }, { status: 400 });
    }

    return NextResponse.json({ success: true, setupComplete: profile.setupComplete, summary });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'PaymentRequired') {
      return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    }
    console.error('[Practice OS setup]', error);
    return NextResponse.json({ success: false, error: 'Failed to save setup' }, { status: 500 });
  }
}
