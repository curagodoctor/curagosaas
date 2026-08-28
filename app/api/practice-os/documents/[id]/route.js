import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import PracticeOsDocument from '@/models/practice-os/PracticeOsDocument';

export const runtime = 'nodejs';

function handleError(error) {
  if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
  console.error('[Practice OS document]', error);
  return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
}

// GET /api/practice-os/documents/[id] — the full document, scoped to this doctor.
export async function GET(request, { params }) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { id } = await params;
    const document = await PracticeOsDocument.findOne({ _id: id, doctorId: doctor._id }).lean();
    if (!document) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, document });
  } catch (error) {
    return handleError(error);
  }
}

// PUT /api/practice-os/documents/[id] — update title/content (owned docs only).
export async function PUT(request, { params }) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const update = {};
    if (typeof body.title === 'string') update.title = body.title.trim() || 'Untitled';
    if (typeof body.content === 'string') update.content = body.content;
    // Content Planner fields (reel scripts).
    if (['idea', 'approved', 'scheduled', 'posted'].includes(body.status)) update.status = body.status;
    if (typeof body.plannedFor === 'string') update.plannedFor = body.plannedFor;
    const document = await PracticeOsDocument.findOneAndUpdate(
      { _id: id, doctorId: doctor._id },
      { $set: update },
      { new: true },
    ).lean();
    if (!document) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, document });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/practice-os/documents/[id] — delete (owned docs only).
export async function DELETE(request, { params }) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { id } = await params;
    const res = await PracticeOsDocument.deleteOne({ _id: id, doctorId: doctor._id });
    if (res.deletedCount === 0) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
