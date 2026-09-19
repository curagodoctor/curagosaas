import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import AiCreditLedger from '@/models/practice-os/AiCreditLedger';

export const runtime = 'nodejs';

// GET — the doctor's current AI-credit state.
export async function GET(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const ledger = await AiCreditLedger.findOne({ doctorId: id }).lean();
    return NextResponse.json({
      success: true,
      credits: {
        unlimited: !!ledger?.unlimited,
        dailyBalance: ledger?.dailyBalance ?? 0,
        dailyLimit: ledger?.dailyLimit ?? 0,
        lifetimeTokens: ledger?.lifetimeTokens ?? 0,
      },
    });
  } catch (error) {
    console.error('[admin credits GET]', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

// PUT { unlimited?, dailyBalance? } — admin edits the doctor's AI credits:
// grant unlimited (no cap) or set an exact remaining balance.
export async function PUT(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const set = {};
    if (typeof body.unlimited === 'boolean') set.unlimited = body.unlimited;
    if (body.dailyBalance != null && Number.isFinite(Number(body.dailyBalance))) {
      set.dailyBalance = Math.max(0, Math.round(Number(body.dailyBalance)));
    }
    if (!Object.keys(set).length) return NextResponse.json({ success: false, error: 'Nothing to update.' }, { status: 400 });

    const ledger = await AiCreditLedger.findOneAndUpdate(
      { doctorId: id },
      { $set: set, $setOnInsert: { doctorId: id, lastResetDate: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    return NextResponse.json({
      success: true,
      credits: { unlimited: !!ledger.unlimited, dailyBalance: ledger.dailyBalance, dailyLimit: ledger.dailyLimit },
    });
  } catch (error) {
    console.error('[admin credits PUT]', error);
    return NextResponse.json({ success: false, error: 'Failed to update credits' }, { status: 500 });
  }
}
