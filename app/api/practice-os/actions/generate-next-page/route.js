import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess, hasOptimizationAccess } from '@/lib/practice-os/access';
import { assertHasCredits } from '@/lib/practice-os/aiCredits';
import { generateNextPage } from '@/lib/practice-os/contentGen';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST — on-demand: generate the doctor's next education page (draft) for review.
// Doctor-triggered and credit-metered. The overnight cron uses the same lib.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    await assertAiAccess(doctor._id);
    if (!(await hasOptimizationAccess(doctor._id))) {
      return NextResponse.json({ success: false, error: 'AccessRequired', message: 'This is part of the optimization work — request access first.' }, { status: 403 });
    }
    await assertHasCredits(doctor._id);

    const r = await generateNextPage(doctor._id, { charge: true });
    if (r.created) return NextResponse.json({ success: true, id: r.id, title: r.title, cluster: r.cluster, creditsRemaining: r.creditsRemaining });
    if (r.done) return NextResponse.json({ success: true, done: true, message: "You've covered all the conditions in your profile. Add more to generate new pages." });
    if (r.reason === 'NoConditions') return NextResponse.json({ success: false, error: 'NoConditions', message: 'Add the conditions you treat in your profile so we can generate pages for them.' }, { status: 400 });
    return NextResponse.json({ success: false, error: r.error || 'Could not generate the next page.' }, { status: 502 });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used all of today's AI credits. They reset tomorrow." }, { status: 402 });
    console.error('[generate-next-page]', error);
    return NextResponse.json({ success: false, error: 'Could not generate the next page.' }, { status: 500 });
  }
}
