import { NextResponse } from 'next/server';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';
import { isGcsConfigured, getSignedUploadUrl } from '@/lib/gcs';

export const runtime = 'nodejs';

const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500MB ceiling (advisory; enforced client-side)

// POST /api/platform/practice-os/upload-url
// Returns a v4 signed URL for the admin browser to PUT a lecture video straight
// to GCS, plus the public URL to store on the mission.
export async function POST(request) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    if (!isGcsConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Video storage is not configured. Set GCS_BUCKET and the Google service-account credentials.' },
        { status: 500 }
      );
    }

    const { filename, contentType, size } = await request.json();
    if (!contentType || !contentType.startsWith('video/')) {
      return NextResponse.json({ success: false, error: 'Only video files are allowed.' }, { status: 400 });
    }
    if (size && size > MAX_VIDEO_BYTES) {
      return NextResponse.json({ success: false, error: 'Video is too large (max 500MB).' }, { status: 400 });
    }

    const ext = (filename?.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
    const rand = Math.random().toString(36).slice(2, 10);
    const objectPath = `practice-os/videos/${Date.now()}-${rand}.${ext}`;

    const signed = await getSignedUploadUrl({ objectPath, contentType });
    return NextResponse.json({ success: true, ...signed });
  } catch (error) {
    console.error('[Practice OS upload-url]', error);
    return NextResponse.json({ success: false, error: 'Could not prepare upload.' }, { status: 500 });
  }
}
