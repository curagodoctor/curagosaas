import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';

export const runtime = 'nodejs';

// POST /api/platform/practice-os/knowledge/extract
// Accepts a PDF / DOCX / TXT / MD / CSV file and returns its extracted text, so
// the admin can turn documents into knowledge the assistant learns from.
export async function POST(request) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const form = await request.formData();
    const file = form.get('file');
    if (!file) return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    if (file.size > 15 * 1024 * 1024) return NextResponse.json({ success: false, error: 'File too large (max 15MB).' }, { status: 400 });

    const name = file.name || 'upload';
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    if (/\.pdf$/i.test(name)) {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      try {
        const res = await parser.getText();
        text = res?.text || '';
      } finally {
        await parser.destroy?.();
      }
    } else if (/\.docx$/i.test(name)) {
      const mod = await import('mammoth');
      const mammoth = mod.default || mod;
      const res = await mammoth.extractRawText({ buffer });
      text = res?.value || '';
    } else if (/\.(txt|md|csv)$/i.test(name)) {
      text = buffer.toString('utf8');
    } else {
      return NextResponse.json({ success: false, error: 'Unsupported file type. Use PDF, DOCX, TXT, MD or CSV.' }, { status: 400 });
    }

    text = text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
    if (!text) return NextResponse.json({ success: false, error: 'No readable text found in that file.' }, { status: 400 });

    return NextResponse.json({ success: true, text, sourceName: name });
  } catch (error) {
    console.error('[Practice OS knowledge extract]', error);
    return NextResponse.json({ success: false, error: 'Could not read that file. Try a different format or paste the text.' }, { status: 500 });
  }
}
