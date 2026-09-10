import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import { getBlogLinkRegistry } from '@/lib/practice-os/blogLinks';

export const runtime = 'nodejs';

// GET — the doctor's central blog-link registry (§10): published pages grouped by
// disease cluster + page type, plus a flat {{variable}} map for content reuse
// (GBP posts, internal linking, the overnight generator).
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { clusters, variables } = await getBlogLinkRegistry(doctor._id);
    return NextResponse.json({ success: true, clusters, variables });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[blog-links GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load blog links' }, { status: 500 });
  }
}
