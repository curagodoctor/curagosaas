import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import NewsletterSequence from '@/models/NewsletterSequence';
import { enrollEmail } from '@/lib/newsletter/sequence';

export const runtime = 'nodejs';
export const maxDuration = 60;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST — enroll a mailing list into the sequence.
// Either multipart with an .xlsx file (columns: email, name), or JSON
// { emails: "a@x.com\nb@y.com" } / { rows: [{email,name}] }.
export async function POST(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const seq = await NewsletterSequence.findById(id);
    if (!seq) return NextResponse.json({ success: false, error: 'Sequence not found' }, { status: 404 });

    const rows = [];   // { email, name }
    const ct = request.headers.get('content-type') || '';

    if (ct.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');
      if (!file) return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
      if (file.size > 5 * 1024 * 1024) return NextResponse.json({ success: false, error: 'File exceeds 5MB' }, { status: 400 });
      const buffer = Buffer.from(await file.arrayBuffer());
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);
      const ws = wb.getWorksheet(1);
      if (!ws) return NextResponse.json({ success: false, error: 'No worksheet found' }, { status: 400 });
      // Detect which column holds the email (header row), else assume col 1 = email, col 2 = name.
      let emailCol = 1, nameCol = 2;
      const header = ws.getRow(1);
      header.eachCell((cell, col) => {
        const h = String(cell.text || '').toLowerCase();
        if (h.includes('email') || h.includes('mail')) emailCol = col;
        else if (h.includes('name')) nameCol = col;
      });
      ws.eachRow((row, i) => {
        if (i === 1) return;
        const email = String(row.getCell(emailCol).text || '').trim().toLowerCase();
        const name = String(row.getCell(nameCol).text || '').trim();
        if (email) rows.push({ email, name });
      });
    } else {
      const body = await request.json().catch(() => ({}));
      if (Array.isArray(body.rows)) {
        for (const r of body.rows) rows.push({ email: String(r.email || '').toLowerCase().trim(), name: String(r.name || '').trim() });
      } else if (typeof body.emails === 'string') {
        for (const line of body.emails.split(/[\n,;]+/)) {
          const email = line.trim().toLowerCase();
          if (email) rows.push({ email, name: '' });
        }
      }
    }

    let enrolled = 0, invalid = 0, dupes = 0;
    for (const r of rows) {
      if (!EMAIL_RE.test(r.email)) { invalid++; continue; }
      const ok = await enrollEmail(seq, r.email, r.name, 'import');
      if (ok) enrolled++; else dupes++;
    }

    return NextResponse.json({ success: true, enrolled, dupes, invalid, total: rows.length });
  } catch (error) {
    console.error('[Sequence import]', error);
    return NextResponse.json({ success: false, error: 'Import failed' }, { status: 500 });
  }
}
