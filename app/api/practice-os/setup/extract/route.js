import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import { getOrCreateEnrollment } from '@/lib/practice-os/engine';
import { extractCvText, extractProfileFields } from '@/lib/practice-os/extract';

export const runtime = 'nodejs';
export const maxDuration = 60; // CV parsing + LLM can take a few seconds

// POST /api/practice-os/setup/extract — { rawFileUrl }
// Parses the uploaded CV, stores its text as the doctor's knowledge base, and
// returns pre-filled profile fields (extraction only, never invented).
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { rawFileUrl } = await request.json();
    if (!rawFileUrl) return NextResponse.json({ success: false, error: 'No file url' }, { status: 400 });

    // Fetch the uploaded file (Blob URL) and parse to text.
    const fileRes = await fetch(rawFileUrl);
    if (!fileRes.ok) return NextResponse.json({ success: false, error: 'Could not read the file' }, { status: 400 });
    const buffer = await fileRes.arrayBuffer();
    const contentType = fileRes.headers.get('content-type') || '';
    const text = await extractCvText(buffer, contentType, rawFileUrl);

    // Persist the CV text as the knowledge base (capped; DPDP — deletable).
    const enr = await getOrCreateEnrollment(doctor._id);
    enr.credentials = enr.credentials || {};
    enr.credentials.rawFileUrl = rawFileUrl;
    enr.credentials.cvText = (text || '').slice(0, 8000);
    await enr.save();

    if (!text) {
      return NextResponse.json({ success: true, fields: [], parsed: false, note: 'Could not read text from this file — please type your details.' });
    }

    const { fields, configured } = await extractProfileFields(text);
    return NextResponse.json({ success: true, fields, parsed: true, aiConfigured: configured !== false });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[Practice OS extract]', error);
    return NextResponse.json({ success: false, error: 'Extraction failed' }, { status: 500 });
  }
}
