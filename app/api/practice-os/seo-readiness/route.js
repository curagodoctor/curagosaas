import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { getSeoReadiness } from '@/lib/practice-os/seoReadiness';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — the signed-in doctor's own SEO readiness (for the control-center nudge).
export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();
    const report = await getSeoReadiness(doctor._id);
    return NextResponse.json({ success: true, ...(report || {}) });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, error: 'Could not load readiness.' }, { status: 500 });
  }
}
