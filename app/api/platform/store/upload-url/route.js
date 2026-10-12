import { NextResponse } from 'next/server';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';
import { isGcsConfigured, getSignedUploadUrl } from '@/lib/gcs';

export const runtime = 'nodejs';

const MAX = { video: 2 * 1024 * 1024 * 1024, book: 100 * 1024 * 1024, cover: 15 * 1024 * 1024 }; // advisory

// Allowed MIME types per asset kind.
const ALLOWED = {
  book: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'],
  video: null, // any video/*
  cover: null, // any image/*
};

// POST /api/platform/store/upload-url — v4 signed URL so the admin browser PUTs a
// book file / course video / cover image straight to GCS. Returns the gs:// URI.
export async function POST(request) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!isGcsConfigured()) {
      return NextResponse.json({ success: false, error: 'Storage is not configured (GCS_BUCKET + service-account creds).' }, { status: 500 });
    }

    const { filename, contentType, size, kind } = await request.json();
    const k = ['book', 'video', 'cover'].includes(kind) ? kind : 'book';
    if (!contentType) return NextResponse.json({ success: false, error: 'Missing content type.' }, { status: 400 });

    const ok = k === 'video' ? contentType.startsWith('video/')
      : k === 'cover' ? contentType.startsWith('image/')
      : ALLOWED.book.includes(contentType);
    if (!ok) return NextResponse.json({ success: false, error: `This file type isn't allowed for a ${k}.` }, { status: 400 });
    if (size && size > MAX[k]) return NextResponse.json({ success: false, error: 'File is too large.' }, { status: 400 });

    const ext = (filename?.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin';
    const rand = Math.random().toString(36).slice(2, 10);
    const objectPath = `store/${k === 'video' ? 'courses' : k === 'cover' ? 'covers' : 'books'}/${Date.now()}-${rand}.${ext}`;

    const signed = await getSignedUploadUrl({ objectPath, contentType });
    return NextResponse.json({ success: true, ...signed, fileType: ext });
  } catch (error) {
    console.error('[store upload-url]', error);
    return NextResponse.json({ success: false, error: 'Could not prepare upload.' }, { status: 500 });
  }
}
