import { NextResponse } from 'next/server';
import { getSignedReadUrl, isGcsConfigured } from '@/lib/gcs';

export const runtime = 'nodejs';

// Public cohort onboarding videos, streamed from GCS. We 302-redirect to a fresh
// signed read URL so the <video src> stays stable (each range/seek request gets a
// valid signed URL) without exposing the bucket. n=1 → intro, n=2 → demo.
const VIDEOS = {
  1: 'cohort/intro.mp4',
  2: 'cohort/demo.mp4',
};

export async function GET(request, { params }) {
  const { n } = await params;
  const objectPath = VIDEOS[n];
  if (!objectPath) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!isGcsConfigured()) return NextResponse.json({ error: 'Video storage not configured' }, { status: 503 });
  try {
    const url = await getSignedReadUrl(objectPath, { expiresMs: 6 * 60 * 60 * 1000 });
    if (!url) return NextResponse.json({ error: 'Unavailable' }, { status: 502 });
    return NextResponse.redirect(url, 302);
  } catch (error) {
    console.error('[Cohort video]', error.message);
    return NextResponse.json({ error: 'Failed to load video' }, { status: 500 });
  }
}
