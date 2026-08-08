import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import PracticeOsDocument from '@/models/practice-os/PracticeOsDocument';

export const runtime = 'nodejs';

// Escape a user-supplied string for safe use inside a RegExp.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/practice-os/documents — list the doctor's documents (newest first).
// Optional ?q= filters by title (case-insensitive).
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const q = new URL(request.url).searchParams.get('q');
    const filter = { doctorId: doctor._id };
    if (q && q.trim()) filter.title = { $regex: escapeRegex(q.trim()), $options: 'i' };
    const docs = await PracticeOsDocument.find(filter)
      .sort({ updatedAt: -1 })
      .limit(500)
      .lean();
    const documents = docs.map((d) => ({
      _id: d._id,
      title: d.title,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      preview: (d.content || '').slice(0, 140),
    }));
    return NextResponse.json({ success: true, documents });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[Practice OS documents]', error);
    return NextResponse.json({ success: false, error: 'Failed to load documents' }, { status: 500 });
  }
}

// POST /api/practice-os/documents — create a document.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const title = (body.title || '').trim() || 'Untitled';
    const content = typeof body.content === 'string' ? body.content : '';
    const document = await PracticeOsDocument.create({ doctorId: doctor._id, title, content });
    return NextResponse.json({ success: true, document });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[Practice OS documents]', error);
    return NextResponse.json({ success: false, error: 'Failed to create document' }, { status: 500 });
  }
}
