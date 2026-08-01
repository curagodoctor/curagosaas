import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Waitlist from '@/models/Waitlist';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// POST /api/waitlist — { email, source? }. Accepts JSON or form-encoded.
export async function POST(request) {
  try {
    let email = '';
    let source = 'landing';
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const b = await request.json();
      email = b.email; source = b.source || source;
    } else {
      const fd = await request.formData();
      email = fd.get('email'); source = fd.get('source') || source;
    }

    email = String(email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email.' }, { status: 400 });
    }

    await connectDB();
    // Idempotent — signing up twice is fine, no duplicate-key error.
    const res = await Waitlist.updateOne(
      { email },
      { $setOnInsert: { email, source: String(source).slice(0, 40) } },
      { upsert: true }
    );
    const alreadyOn = res.upsertedCount === 0;
    return NextResponse.json({ success: true, alreadyOn });
  } catch (error) {
    console.error('[Waitlist]', error);
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 });
  }
}
