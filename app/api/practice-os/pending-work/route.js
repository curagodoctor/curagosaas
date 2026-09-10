import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import BlogArticle from '@/models/BlogArticle';
import BookingPage from '@/models/BookingPage';

export const runtime = 'nodejs';

// GET — the doctor's work awaiting review (§8). Drives the control-center prompt:
//  State A (new work ready)  — there are drafts, freshly created
//  State B (backlog)         — drafts have been waiting a few days
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();

    const [blogDrafts, pageDrafts] = await Promise.all([
      BlogArticle.find({ doctorId: doctor._id, status: 'draft' }).select('title updatedAt createdAt').sort({ createdAt: 1 }).lean(),
      // A page with AI draft sections waiting for approval.
      BookingPage.countDocuments({ doctorId: doctor._id, 'draftSections.0': { $exists: true } }).catch(() => 0),
    ]);

    const items = blogDrafts.map((b) => ({ type: 'article', title: b.title, id: String(b._id) }));
    const count = items.length + (pageDrafts || 0);

    let oldestDays = 0;
    if (blogDrafts.length) {
      const oldest = new Date(blogDrafts[0].createdAt || blogDrafts[0].updatedAt || Date.now());
      oldestDays = Math.floor((Date.now() - oldest.getTime()) / (24 * 60 * 60 * 1000));
    }
    const state = count === 0 ? 'clear' : (oldestDays >= 2 ? 'backlog' : 'ready');

    return NextResponse.json({ success: true, count, state, oldestDays, articles: items.slice(0, 5), pageDrafts: pageDrafts || 0 });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[pending-work]', error);
    return NextResponse.json({ success: false, error: 'Failed to load pending work' }, { status: 500 });
  }
}
