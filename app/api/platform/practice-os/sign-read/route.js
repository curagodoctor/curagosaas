import { NextResponse } from 'next/server';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';
import { getSignedReadUrl, isGcsConfigured } from '@/lib/gcs';

export const runtime = 'nodejs';

// GET /api/platform/practice-os/sign-read?ref=gs://... — a short-lived signed read
// URL for admin preview of a private GCS-hosted video.
export async function GET(request) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isGcsConfigured()) {
      return NextResponse.json({ success: false, error: 'Storage not configured' }, { status: 500 });
    }
    const ref = new URL(request.url).searchParams.get('ref');
    if (!ref) return NextResponse.json({ success: false, error: 'Missing ref' }, { status: 400 });

    const url = await getSignedReadUrl(ref, { expiresMs: 60 * 60 * 1000 });
    if (!url) return NextResponse.json({ success: false, error: 'Could not sign' }, { status: 400 });
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('[Practice OS sign-read]', error.message);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
