import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentDoctor } from '@/lib/doctorAuth';
import { linkPendingPurchases } from '@/lib/practice-os/claimPending';

export const runtime = 'nodejs';

// POST /api/auth/claim-pending — link a guest purchase to the LOGGED-IN doctor.
// Used after an existing user logs in (or a logged-in user buys) — links by the
// claim token and by their email (refresh-safe). Requires an authenticated doctor.
export async function POST(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { claimToken } = await request.json().catch(() => ({}));
    const result = await linkPendingPurchases(doctor, { claimToken });
    return NextResponse.json({ success: true, linked: result.linked });
  } catch (error) {
    console.error('[claim-pending]', error);
    return NextResponse.json({ success: false, error: 'Failed to link purchase' }, { status: 500 });
  }
}
