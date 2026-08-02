import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import { getOrCreateEnrollment } from '@/lib/practice-os/engine';
import { generateDoctorSummary } from '@/lib/practice-os/profile';

/**
 * POST /api/practice-os/setup — Day-0 setup steps.
 * body.step: 'credentials' | 'intent' | 'summary' | 'complete'
 */
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const body = await request.json();
    const enr = await getOrCreateEnrollment(doctor._id);
    let summary;

    if (body.step === 'credentials') {
      // Merge (never wipe cvText / summary). The UI only sends confirmed fields.
      enr.credentials = enr.credentials || {};
      if (body.rawFileUrl) enr.credentials.rawFileUrl = body.rawFileUrl;
      if (Array.isArray(body.extracted)) enr.credentials.extracted = body.extracted;
    } else if (body.step === 'summary') {
      // Generate the AI summary from the confirmed profile and store it.
      summary = await generateDoctorSummary(doctor._id);
      enr.credentials = enr.credentials || {};
      enr.credentials.summary = summary;
    } else if (body.step === 'intent') {
      enr.intent = {
        whyPractice: body.whyPractice || '',
        triedBefore: body.triedBefore || '',
        sixMonths: body.sixMonths || '',
        freeTime: body.freeTime || '',
      };
    } else if (body.step === 'complete') {
      enr.setupComplete = true;
      enr.status = 'active';
      if (!enr.startedAt) enr.startedAt = new Date();
      enr.nextUnlockAt = null; // Day 1 opens immediately
      enr.currentDayNumber = 1;
      enr.lastActiveAt = new Date();
    } else {
      return NextResponse.json({ success: false, error: 'Unknown step' }, { status: 400 });
    }

    await enr.save();
    return NextResponse.json({ success: true, setupComplete: enr.setupComplete, status: enr.status, summary });
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
