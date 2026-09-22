import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, hasAiAccess } from '@/lib/practice-os/access';
import { getRemainingCredits, UNLIMITED_CREDITS } from '@/lib/practice-os/aiCredits';
import AiCreditLedger from '@/models/practice-os/AiCreditLedger';

export const runtime = 'nodejs';

// GET /api/practice-os/credits — the doctor's AI-credit state for the control
// center (remaining today, the daily limit, and whether they're unlimited).
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const paid = await hasAiAccess(doctor._id);
    const ledger = await AiCreditLedger.getOrCreateForToday(doctor._id, paid);
    const remaining = await getRemainingCredits(doctor._id);
    return NextResponse.json({
      success: true,
      unlimited: !!ledger.unlimited || remaining >= UNLIMITED_CREDITS,
      remaining,
      dailyLimit: ledger.dailyLimit || 0,
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
