import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertPackAccess } from '@/lib/practice-os/access';
import UserMissionProgress from '@/models/practice-os/UserMissionProgress';
import Mission from '@/models/practice-os/Mission';
import { completeDay, completeModule, skipDay, getDay, getOrCreateEnrollment, setNextSchedule } from '@/lib/practice-os/engine';

// GET /api/practice-os/day/[id] — a single day (for the Focus session).
export async function GET(request, { params }) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { id } = await params;
    const result = await getDay(doctor._id, id);
    if (!result) return NextResponse.json({ success: false, error: 'Day not found' }, { status: 404 });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[Practice OS day GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load day' }, { status: 500 });
  }
}

// POST /api/practice-os/day/[id] — { action: 'start' | 'complete' | 'skip' | 'record' }
export async function POST(request, { params }) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    // The pack is derived from the mission; stamp frameworkId on every progress
    // write so the pack-scoped state query can see it.
    const mission = await Mission.findById(id).select('frameworkId').lean();
    if (!mission) return NextResponse.json({ success: false, error: 'Day not found' }, { status: 404 });
    const frameworkId = mission.frameworkId;
    await assertPackAccess(doctor._id, frameworkId);

    if (body.action === 'start') {
      // NEVER downgrade a finished mission. Re-opening the focus page (or hitting
      // Back into it) must not revert a completed/skipped mission to 'available'.
      const existing = await UserMissionProgress.findOne({ doctorId: doctor._id, missionId: id }).select('status');
      if (existing?.status === 'completed' || existing?.status === 'skipped') {
        return NextResponse.json({ success: true, alreadyDone: true });
      }
      await UserMissionProgress.findOneAndUpdate(
        { doctorId: doctor._id, missionId: id },
        { $set: { status: 'available', frameworkId }, $setOnInsert: { startedAt: new Date() } },
        { upsert: true, setDefaultsOnInsert: true }
      );
      return NextResponse.json({ success: true });
    }

    if (body.action === 'record') {
      // Save the logbook entries as the doctor goes (his record, not a submission).
      await UserMissionProgress.findOneAndUpdate(
        { doctorId: doctor._id, missionId: id },
        { $set: { record: body.record || {}, frameworkId }, $setOnInsert: { startedAt: new Date() } },
        { upsert: true, setDefaultsOnInsert: true }
      );
      return NextResponse.json({ success: true });
    }

    // Finish one module within the mission. When the last module is done the
    // mission finalizes (score, celebration) and result.missionComplete is true.
    if (body.action === 'complete-module') {
      const result = await completeModule(doctor._id, id, body.moduleId, {
        inputs: body.inputs,
        actualMinutes: body.actualMinutes,
        kpis: body.kpis,
        reflection: body.reflection,
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (body.action === 'complete') {
      const result = await completeDay(doctor._id, id, {
        record: body.record,
        actualMinutes: body.actualMinutes,
        nextCommitment: body.nextCommitment,
        reflection: body.reflection,
        kpis: body.kpis,
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (body.action === 'skip') {
      await skipDay(doctor._id, id);
      return NextResponse.json({ success: true });
    }

    // Set the doctor's schedule for the next task (same day up to 2 days out).
    if (body.action === 'set-schedule') {
      const r = await setNextSchedule(doctor._id, id, {
        dayOffset: body.dayOffset,
        window: body.window,
        exactTime: body.exactTime,
      });
      return NextResponse.json({ success: true, ...r });
    }

    // Work ONE mission ahead: unlock only this mission (not the whole timeline)
    // and mark the advance as used so the doctor can't keep racing forward.
    if (body.action === 'continue-now') {
      await UserMissionProgress.findOneAndUpdate(
        { doctorId: doctor._id, missionId: id },
        { $set: { manuallyUnlocked: true, frameworkId }, $setOnInsert: { unlockedAt: new Date(), startedAt: new Date() } },
        { upsert: true, setDefaultsOnInsert: true }
      );
      const enr = await getOrCreateEnrollment(doctor._id, frameworkId);
      enr.aheadUsed = true;
      await enr.save();
      return NextResponse.json({ success: true });
    }

    // Dev-only: clear the whole unlock clock (no one-day-ahead cap).
    if (body.action === 'dev-unlock') {
      const enr = await getOrCreateEnrollment(doctor._id, frameworkId);
      enr.nextUnlockAt = null;
      enr.aheadUsed = false;
      await enr.save();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[Practice OS day POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to update day' }, { status: 500 });
  }
}
