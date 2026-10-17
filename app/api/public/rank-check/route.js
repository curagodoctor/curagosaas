import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { runRankCheck } from '@/lib/rankCheck';

export const runtime = 'nodejs';
export const maxDuration = 120;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST — capture the lead, then return their Google Maps ranking for 10 search
// terms (their keywords + AI-generated) + an overall score out of 30.
export async function POST(request) {
  try {
    await connectDB();
    const b = await request.json();
    const name = String(b.name || '').trim();
    const specialty = String(b.specialty || '').trim();
    const city = String(b.city || '').trim();
    const localities = String(b.localities || '').trim();
    const gbpName = String(b.gbpName || '').trim();
    const email = String(b.email || '').toLowerCase().trim();
    const whatsapp = String(b.whatsapp || '').trim();
    const keywords = (Array.isArray(b.keywords) ? b.keywords : String(b.keywords || '').split(/[,\n]/))
      .map((k) => String(k).trim()).filter(Boolean);

    if (!name || !specialty || !city) return NextResponse.json({ success: false, error: 'Name, specialty and city are required.' }, { status: 400 });
    if (!localities) return NextResponse.json({ success: false, error: 'Please enter at least one locality.' }, { status: 400 });
    if (keywords.length < 3) return NextResponse.json({ success: false, error: 'Please enter at least 3 keywords.' }, { status: 400 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ success: false, error: 'A valid email is required.' }, { status: 400 });
    if (!process.env.SERPAPI_KEY) return NextResponse.json({ success: false, error: 'The ranking check is not available right now.' }, { status: 503 });

    const report = await runRankCheck({ name, email, whatsapp, specialty, city, localities, gbpName, keywords });
    return NextResponse.json({ success: true, ...report });
  } catch (error) {
    console.error('[rank-check]', error);
    return NextResponse.json({ success: false, error: 'Could not run the ranking check. Please try again.' }, { status: 500 });
  }
}
