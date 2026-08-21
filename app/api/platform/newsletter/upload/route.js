import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';

export const runtime = 'nodejs';

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const PDF_TYPE = 'application/pdf';
const MAX_IMAGE = 5 * 1024 * 1024;   // 5MB
const MAX_PDF = 15 * 1024 * 1024;    // 15MB

// POST (multipart) file + kind ('image' | 'pdf') → public Vercel Blob URL.
export async function POST(request) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ success: false, error: 'File storage is not configured.' }, { status: 500 });
    }

    const form = await request.formData();
    const file = form.get('file');
    const kind = form.get('kind') || 'image';
    if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });

    if (kind === 'pdf') {
      if (file.type !== PDF_TYPE) return NextResponse.json({ success: false, error: 'Only PDF files are allowed.' }, { status: 400 });
      if (file.size > MAX_PDF) return NextResponse.json({ success: false, error: 'PDF exceeds 15MB.' }, { status: 400 });
    } else {
      if (!IMAGE_TYPES.includes(file.type)) return NextResponse.json({ success: false, error: 'Only JPG, PNG, WebP or GIF images are allowed.' }, { status: 400 });
      if (file.size > MAX_IMAGE) return NextResponse.json({ success: false, error: 'Image exceeds 5MB.' }, { status: 400 });
    }

    const ext = (file.name?.split('.').pop() || (kind === 'pdf' ? 'pdf' : 'png')).toLowerCase();
    const rand = Math.random().toString(36).slice(2, 8);
    const stamp = Date.now();
    const path = `newsletter/${kind}s/${stamp}-${rand}.${ext}`;

    const blob = await put(path, file, { access: 'public', addRandomSuffix: false });
    return NextResponse.json({ success: true, url: blob.url, type: file.type, size: file.size });
  } catch (error) {
    console.error('[Newsletter upload]', error);
    return NextResponse.json({ success: false, error: error.message || 'Upload failed' }, { status: 500 });
  }
}
