import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { listDoctorTopics, dismissTopic } from '@/lib/practice-os/trendTopics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — the doctor's content topics from their search trends (queued / produced /
// covered / dismissed), with the produced draft's id + slug where available.
export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();
    const rows = await listDoctorTopics(doctor._id);
    const BlogArticle = (await import('@/models/BlogArticle')).default;
    const blogIds = rows.filter((r) => r.producedBlogId).map((r) => r.producedBlogId);
    const blogs = blogIds.length ? await BlogArticle.find({ _id: { $in: blogIds } }).select('slug status title').lean() : [];
    const byId = new Map(blogs.map((b) => [String(b._id), b]));
    const topics = rows.map((r) => ({
      id: String(r._id), title: r.title, status: r.status, coveredBy: r.coveredBy || '',
      blog: r.producedBlogId ? (() => { const b = byId.get(String(r.producedBlogId)); return b ? { id: String(b._id), slug: b.slug, status: b.status } : null; })() : null,
    }));
    return NextResponse.json({ success: true, topics });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[trend-topics GET]', error);
    return NextResponse.json({ success: false, error: 'Could not load topics.' }, { status: 500 });
  }
}

// POST { topicId, action:'dismiss' } — the doctor vetoes a topic.
export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();
    const { topicId, action } = await request.json();
    if (action === 'dismiss' && topicId) await dismissTopic(doctor._id, topicId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, error: 'Action failed.' }, { status: 500 });
  }
}
