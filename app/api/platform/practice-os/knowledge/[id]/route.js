import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import PracticeOsKnowledge from '@/models/practice-os/PracticeOsKnowledge';
import { reindexEntry, removeEntryChunks } from '@/lib/practice-os/knowledge';

export const runtime = 'nodejs';

// PUT /api/platform/practice-os/knowledge/[id] — update a KB entry.
export async function PUT(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const b = await request.json();

    const update = {};
    if (typeof b.title === 'string') update.title = b.title.trim() || 'Untitled';
    if (typeof b.content === 'string') update.content = b.content;
    if (typeof b.sourceName === 'string') update.sourceName = b.sourceName.trim();
    if ('frameworkId' in b) update.frameworkId = b.frameworkId || null;
    if (typeof b.isActive === 'boolean') update.isActive = b.isActive;

    const entry = await PracticeOsKnowledge.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!entry) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    // Re-embed when the text or scope changed.
    try { await reindexEntry(entry); } catch (e) { console.error('[KB reindex on update]', e.message); }
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('[Practice OS knowledge PUT]', error);
    return NextResponse.json({ success: false, error: 'Failed to update knowledge entry' }, { status: 500 });
  }
}

// DELETE /api/platform/practice-os/knowledge/[id]
export async function DELETE(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const res = await PracticeOsKnowledge.deleteOne({ _id: id });
    if (res.deletedCount === 0) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    try { await removeEntryChunks(id); } catch (e) { console.error('[KB chunk cleanup]', e.message); }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Practice OS knowledge DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete knowledge entry' }, { status: 500 });
  }
}
