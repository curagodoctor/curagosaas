import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { runRankCheck } from '@/lib/rankCheck';

export const runtime = 'nodejs';
export const maxDuration = 60;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST — capture the lead's details, then return their Google Maps ranking report
// for 5 AI-chosen local search terms + the competitors ranking above them.
export async function POST(request) {
  try {
    await connectDB();
    const b = await request.json();
    const name = String(b.name || '').trim();
    const specialty = String(b.specialty || '').trim();
    const city = String(b.city || '').trim();
    const email = String(b.email || '').toLowerCase().trim();
    const clinicName = String(b.clinicName || '').trim();
    const phone = String(b.phone || '').trim();

    if (!name || !specialty || !city) return NextResponse.json({ success: false, error: 'Name, specialty and city are required.' }, { status: 400 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ success: false, error: 'A valid email is required.' }, { status: 400 });
    if (!process.env.SERPAPI_KEY) return NextResponse.json({ success: false, error: 'The ranking check is not available right now.' }, { status: 503 });

    const report = await runRankCheck({ name, email, phone, specialty, city, clinicName });
    return NextResponse.json({ success: true, ...report });
  } catch (error) {
    console.error('[rank-check]', error);
    return NextResponse.json({ success: false, error: 'Could not run the ranking check. Please try again.' }, { status: 500 });
  }
}
