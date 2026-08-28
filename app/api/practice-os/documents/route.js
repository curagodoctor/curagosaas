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
    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    const kind = url.searchParams.get('kind');   // 'note' | 'reel' — omit for notes
    const filter = { doctorId: doctor._id };
    // Default to plain notes so the workspace never shows reel scripts; the
    // Content Planner asks for kind=reel explicitly.
    filter.kind = kind === 'reel' ? 'reel' : { $ne: 'reel' };
    if (q && q.trim()) filter.title = { $regex: escapeRegex(q.trim()), $options: 'i' };
    const docs = await PracticeOsDocument.find(filter)
      .sort({ updatedAt: -1 })
      .limit(500)
      .lean();
    const documents = docs.map((d) => ({
      _id: d._id,
      title: d.title,
      kind: d.kind || 'note',
      status: d.status || 'idea',
      plannedFor: d.plannedFor || '',
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      // Notes may be rich text (HTML) — strip tags/entities for the list preview.
      preview: (d.content || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140),
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
    const kind = body.kind === 'reel' ? 'reel' : 'note';
    const document = await PracticeOsDocument.create({
      doctorId: doctor._id, title, content, kind,
      ...(kind === 'reel' ? { status: body.status || 'approved', plannedFor: body.plannedFor || '' } : {}),
    });
    return NextResponse.json({ success: true, document });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[Practice OS documents]', error);
    return NextResponse.json({ success: false, error: 'Failed to create document' }, { status: 500 });
  }
}
