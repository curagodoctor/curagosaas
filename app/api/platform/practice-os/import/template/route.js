import { NextResponse } from 'next/server';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';
import { IMPORT_COLUMNS } from '@/lib/practice-os/import-helpers';

export const runtime = 'nodejs';

/**
 * GET /api/platform/practice-os/import/template
 * Returns a pre-formatted .xlsx template (headers + one example row) for the
 * bulk mission importer.
 */
export async function GET() {
  const admin = await getAdminFromCookie();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Missions');

  const headerRow = worksheet.addRow(IMPORT_COLUMNS);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    cell.alignment = { horizontal: 'center' };
  });
  worksheet.columns = IMPORT_COLUMNS.map(() => ({ width: 22 }));

  // One example row to show the expected shape.
  worksheet.addRow([
    'Google Business Profile', 'GBP Basics', 1, 1, 1,
    'Google Business Profile', 'Why a complete GBP wins local patients',
    'Create your Google Business Profile and add your clinic name, address and phone.',
    'https://youtu.be/example', 'https://example.com/guide.pdf', 'https://business.google.com',
    'You are helping this doctor create a complete, NMC-compliant Google Business Profile. Stay on this task only.',
    'Open GBP', 'https://business.google.com', 'Open Canva', 'https://canva.com',
    'image', 10, 'Great start! Your clinic is now on the map.',
    'Google Business Profile Views, Google Reviews',
    'Screenshot of published profile', 1,
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="practice-os-missions-template.xlsx"',
    },
  });
}
