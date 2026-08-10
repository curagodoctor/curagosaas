import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie, requirePlatformAdmin } from '@/lib/platformAdminAuth';
import PracticeOsKnowledge from '@/models/practice-os/PracticeOsKnowledge';
import { reindexEntry } from '@/lib/practice-os/knowledge';

export const runtime = 'nodejs';

// GET /api/platform/practice-os/knowledge — list all KB entries (global + per-pack).
export async function GET() {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const entries = await PracticeOsKnowledge.find({})
      .sort({ frameworkId: 1, updatedAt: -1 })
      .lean();
    return NextResponse.json({ success: true, entries });
  } catch (error) {
    console.error('[Practice OS knowledge GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load knowledge base' }, { status: 500 });
  }
}

// POST /api/platform/practice-os/knowledge — create a KB entry.
// Body: { title, content, frameworkId?, sourceName? }. frameworkId absent/empty = global.
export async function POST(request) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const b = await request.json();
    const title = (b.title || '').trim();
    const content = typeof b.content === 'string' ? b.content : '';
    if (!title) return NextResponse.json({ success: false, error: 'Title is required.' }, { status: 400 });
    if (!content.trim()) return NextResponse.json({ success: false, error: 'Content is required.' }, { status: 400 });

    const entry = await PracticeOsKnowledge.create({
      title,
      content,
      frameworkId: b.frameworkId || null,
      sourceName: (b.sourceName || '').trim(),
    });
    try { await reindexEntry(entry); } catch (e) { console.error('[KB reindex on create]', e.message); }
    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    console.error('[Practice OS knowledge POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to create knowledge entry' }, { status: 500 });
  }
}
