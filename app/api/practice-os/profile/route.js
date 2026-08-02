import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import { getOrCreateEnrollment } from '@/lib/practice-os/engine';
import { generateDoctorSummary } from '@/lib/practice-os/profile';

export const runtime = 'nodejs';

// GET /api/practice-os/profile — the saved profile as a field map + AI summary.
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const enr = await getOrCreateEnrollment(doctor._id);
    const fields = {};
    for (const f of enr.credentials?.extracted || []) fields[f.field] = f.value;
    return NextResponse.json({
      success: true,
      fields,
      summary: enr.credentials?.summary || '',
      hasCv: !!enr.credentials?.rawFileUrl,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT /api/practice-os/profile — { fields } → save + regenerate the AI summary.
export async function PUT(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { fields } = await request.json();
    const enr = await getOrCreateEnrollment(doctor._id);

    const extracted = Object.entries(fields || {})
      .filter(([, v]) => String(v ?? '').trim())
      .map(([field, value]) => ({ field, value: String(value).trim(), confidence: 1, confirmed: true }));
    enr.credentials = enr.credentials || {};
    enr.credentials.extracted = extracted;
    await enr.save();                                  // persist before the summary reads it

    const summary = await generateDoctorSummary(doctor._id);
    enr.credentials.summary = summary;
    await enr.save();

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error) {
  if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
  console.error('[Practice OS profile]', error);
  return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
}
