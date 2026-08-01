import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import PracticeOsEnrollment from '@/models/practice-os/PracticeOsEnrollment';
import { getOrCreateEnrollment } from '@/lib/practice-os/engine';

/**
 * POST /api/practice-os/setup — Day-0 setup steps.
 * body.step: 'credentials' | 'intent' | 'complete'
 */
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const body = await request.json();
    const enr = await getOrCreateEnrollment(doctor._id);

    if (body.step === 'credentials') {
      // Store raw file url + confirmed extracted fields (never invented; the UI
      // only sends what the doctor confirmed). CV is personal data — DPDP.
      enr.credentials = {
        rawFileUrl: body.rawFileUrl || enr.credentials?.rawFileUrl || '',
        extracted: Array.isArray(body.extracted) ? body.extracted : (enr.credentials?.extracted || []),
      };
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
    return NextResponse.json({ success: true, setupComplete: enr.setupComplete, status: enr.status });
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
