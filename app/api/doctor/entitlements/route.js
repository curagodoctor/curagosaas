import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { getEntitlements } from '@/lib/entitlements';

// Returns the current doctor's feature entitlements so the dashboard can
// lock/unlock modules (Contacts, Workflows, Messaging) and show upgrade prompts.
export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const entitlements = await getEntitlements(doctor._id);

    return NextResponse.json({ success: true, entitlements });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Entitlements GET]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch entitlements' },
      { status: 500 }
    );
  }
}
