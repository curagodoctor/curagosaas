import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import { getOrCreateProfile, generateDoctorSummary } from '@/lib/practice-os/profile';
import Doctor from '@/models/Doctor';

export const runtime = 'nodejs';

// GET /api/practice-os/profile — the doctor-global profile as a field map + AI summary.
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const profile = await getOrCreateProfile(doctor._id);
    const fields = {};
    for (const f of profile.credentials?.extracted || []) fields[f.field] = f.value;
    return NextResponse.json({
      success: true,
      fields,
      intent: profile.intent || {},
      summary: profile.credentials?.summary || '',
      hasCv: !!profile.credentials?.rawFileUrl,
      cvUrl: profile.credentials?.rawFileUrl || '',
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
    const profile = await getOrCreateProfile(doctor._id);

    const extracted = Object.entries(fields || {})
      .filter(([, v]) => String(v ?? '').trim())
      .map(([field, value]) => ({ field, value: String(value).trim(), confidence: 1, confirmed: true }));
    profile.credentials = profile.credentials || {};
    profile.credentials.extracted = extracted;
    await profile.save();                                  // persist before the summary reads it

    // Keep the shared booking fields in sync: if the doctor filled clinic name /
    // WhatsApp here, mirror them to the canonical Doctor record so the booking
    // flow + WhatsApp webhooks use the same values. (One source of truth.)
    const docUpdates = {};
    if (String(fields?.clinic_name ?? '').trim()) docUpdates.clinicName = String(fields.clinic_name).trim();
    const wa = String(fields?.whatsapp_number ?? '').replace(/\D/g, '').slice(-10);
    if (wa.length === 10) docUpdates.whatsappNumber = wa;
    if (Object.keys(docUpdates).length) {
      await Doctor.updateOne({ _id: doctor._id }, { $set: docUpdates });
    }

    const summary = await generateDoctorSummary(doctor._id);
    profile.credentials.summary = summary;
    await profile.save();

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
