import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess } from '@/lib/practice-os/access';
import BookingPage from '@/models/BookingPage';

export const runtime = 'nodejs';

// GET — the doctor's home page draft + version history state (for the AI builder).
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const page = await BookingPage.findOne({ doctorId: doctor._id, slug: 'home' })
      .select('draftSections draftMeta versions aiGeneratedAt status')
      .lean();
    if (!page) return NextResponse.json({ success: true, exists: false });
    return NextResponse.json({
      success: true,
      exists: true,
      hasDraft: Array.isArray(page.draftSections) && page.draftSections.length > 0,
      draftSections: page.draftSections || null,
      draftMeta: page.draftMeta || null,
      versionCount: (page.versions || []).length,
      versions: (page.versions || []).map((v, i) => ({ index: i, savedAt: v.savedAt, source: v.source, sectionCount: (v.sections || []).length })),
      aiGeneratedAt: page.aiGeneratedAt || null,
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, error: 'Failed to load draft.' }, { status: 500 });
  }
}

// POST { action: 'approve' | 'discard' | 'restore', index? } — apply a homepage
// draft/version decision. Approving/restoring is not itself an AI call, but it IS
// a paid-tier action (the AI builder), so we gate on AI access.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    await assertAiAccess(doctor._id);
    const { action, index } = await request.json();

    const page = await BookingPage.findOne({ doctorId: doctor._id, slug: 'home' });
    if (!page) return NextResponse.json({ success: false, error: 'No home page found.' }, { status: 404 });
    const now = new Date();

    if (action === 'approve') {
      if (!Array.isArray(page.draftSections) || page.draftSections.length === 0) {
        return NextResponse.json({ success: false, error: 'There is no draft to approve.' }, { status: 400 });
      }
      // Snapshot the current live version, then promote the draft to live.
      page.versions = [{ sections: page.sections || [], savedAt: now, source: 'pre-approve' }, ...(page.versions || [])].slice(0, 10);
      page.sections = page.draftSections;
      page.draftSections = null;
      page.draftMeta = { source: '', createdAt: null };
      page.status = 'published';
      page.aiGeneratedAt = now;
      page.markModified('sections'); page.markModified('versions'); page.markModified('draftSections');
      await page.save();
      return NextResponse.json({ success: true, applied: 'approve' });
    }

    if (action === 'discard') {
      page.draftSections = null;
      page.draftMeta = { source: '', createdAt: null };
      page.markModified('draftSections');
      await page.save();
      return NextResponse.json({ success: true, applied: 'discard' });
    }

    if (action === 'restore') {
      const i = Number(index);
      const v = (page.versions || [])[i];
      if (!v) return NextResponse.json({ success: false, error: 'That version no longer exists.' }, { status: 400 });
      // Snapshot current, then restore the chosen version to live.
      page.versions = [{ sections: page.sections || [], savedAt: now, source: 'pre-restore' }, ...(page.versions || [])].slice(0, 10);
      page.sections = v.sections || [];
      page.markModified('sections'); page.markModified('versions');
      await page.save();
      return NextResponse.json({ success: true, applied: 'restore' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[site-draft]', error);
    return NextResponse.json({ success: false, error: 'Could not update the page.' }, { status: 500 });
  }
}
