import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { listDoctorLibrary } from '@/lib/store/grant';
import { toCard } from '@/lib/store/products';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — the books/courses the signed-in doctor owns (as cards + purchase date).
export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();
    const owned = await listDoctorLibrary(doctor._id);
    const items = await Promise.all(owned.map(async (p) => ({ ...(await toCard(p)), purchasedAt: p.purchasedAt })));
    return NextResponse.json({ success: true, items });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[store library]', error);
    return NextResponse.json({ success: false, error: 'Could not load your library.' }, { status: 500 });
  }
}
