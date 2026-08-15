import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CohortAssessment from '@/models/CohortAssessment';
import { evaluateFit } from '@/lib/cohortQuestions';

export const runtime = 'nodejs';

// POST /api/cohort/assessment — public. Actions:
//   start  { email, name?, source? }        → upsert a record (funnel: started)
//   submit { email, answers, source? }      → compute + store result, return it
//   join   { email, chosenPath }            → mark they clicked "Join the cohort"
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const action = body.action;
    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'A valid email is required.' }, { status: 400 });
    }

    if (action === 'start') {
      await CohortAssessment.findOneAndUpdate(
        { email },
        { $setOnInsert: { email, startedAt: new Date() }, $set: { ...(body.name ? { name: body.name } : {}), ...(body.source ? { source: body.source } : {}) } },
        { upsert: true, setDefaultsOnInsert: true }
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'submit') {
      const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
      const evalResult = evaluateFit(answers);   // authoritative — computed server-side
      const doc = await CohortAssessment.findOneAndUpdate(
        { email },
        {
          $set: {
            name: answers.name || body.name || '',
            phone: answers.phone || '',
            specialty: answers.specialty || '',
            city: answers.city || '',
            answers,
            result: evalResult.result,
            reason: evalResult.reason,
            flags: evalResult.flags,
            completedAt: new Date(),
            ...(body.source ? { source: body.source } : {}),
          },
          $setOnInsert: { startedAt: new Date() },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return NextResponse.json({ success: true, result: doc.result, reason: doc.reason, flags: doc.flags });
    }

    if (action === 'join') {
      await CohortAssessment.findOneAndUpdate(
        { email },
        { $set: { clickedJoinCohort: true, joinedAt: new Date(), chosenPath: body.chosenPath || 'cohort' } },
        { upsert: true, setDefaultsOnInsert: true }
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Cohort assessment]', error.message);
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 });
  }
}
