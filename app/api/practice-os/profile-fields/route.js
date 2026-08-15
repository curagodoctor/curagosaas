import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import ProfileFieldConfig from '@/models/practice-os/ProfileFieldConfig';
import { mergeProfileSections } from '@/lib/practice-os/profile-fields-defaults';

export const runtime = 'nodejs';

// GET /api/practice-os/profile-fields
// The effective profile-field sections (defaults + admin customisations), used by
// the setup and My-Profile pages. Just the form schema — no per-doctor data. (#39)
export async function GET(request) {
  try {
    await requireDoctorAuth(request);
    await connectDB();
    const configs = await ProfileFieldConfig.find().lean();
    const sections = mergeProfileSections(configs);
    return NextResponse.json({ success: true, sections });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[Practice OS profile-fields]', error);
    return NextResponse.json({ success: false, error: 'Failed to load fields' }, { status: 500 });
  }
}
