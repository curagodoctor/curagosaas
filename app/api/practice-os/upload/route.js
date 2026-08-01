import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';

export const runtime = 'nodejs';

// POST /api/practice-os/upload — store a CV or a record screenshot in Blob.
// Returns { url }. kind = 'cv' | 'record'.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ success: false, error: 'File storage is not configured.' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const kind = formData.get('kind') === 'cv' ? 'cv' : 'record';
    if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });

    const docTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    // Evidence (record) accepts images AND documents (§12); CV accepts documents only.
    const allowed = kind === 'cv' ? docTypes : [...imageTypes, ...docTypes];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ success: false, error: `Unsupported file type for ${kind}.` }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large (max 8MB).' }, { status: 400 });
    }

    const ext = (file.name?.split('.').pop() || 'bin').toLowerCase();
    const path = `practice-os/${doctor._id}/${kind}-${Date.now()}.${ext}`;
    const blob = await put(path, file, { access: 'public', addRandomSuffix: false });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[Practice OS upload]', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
