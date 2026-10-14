import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import connectDB from '@/lib/mongodb';
import { seedServiceTopics } from '@/lib/practice-os/servicePages';

export const runtime = 'nodejs';

// POST — queue service-page drafts from the doctor's approved treatments. The
// content engine writes them as DRAFTS for clinician review before publishing.
export async function POST(request, { params }) {
  const { authenticated } = await requirePlatformAdmin();
  if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await connectDB();
  try {
    const result = await seedServiceTopics(id);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[service-pages]', error);
    return NextResponse.json({ success: false, error: 'Could not queue service pages.' }, { status: 500 });
  }
}
