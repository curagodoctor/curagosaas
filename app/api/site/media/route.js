import { NextResponse } from 'next/server';
import { getSignedReadUrl, isGsUri, parseGsUri } from '@/lib/gcs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET ?ref=gs://… — PUBLIC: 302-redirect to a short-lived signed URL so website
// gallery videos stream same-origin (no CORS). Restricted to the public
// `site-media/` prefix so it can NEVER sign private content (books, courses,
// lecture videos). Range requests are preserved through the redirect for seeking.
export async function GET(request) {
  const ref = new URL(request.url).searchParams.get('ref') || '';
  if (!isGsUri(ref)) return NextResponse.json({ error: 'Bad reference' }, { status: 400 });
  const { objectPath } = parseGsUri(ref);
  if (!objectPath || !objectPath.startsWith('site-media/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const url = await getSignedReadUrl(ref, { expiresMs: 6 * 60 * 60 * 1000 });
  if (!url) return NextResponse.json({ error: 'Unavailable' }, { status: 502 });
  return NextResponse.redirect(url, 302);
}
