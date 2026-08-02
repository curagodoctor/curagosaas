import { NextResponse } from 'next/server';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';
import { MISSION_COLUMNS, RESOURCE_COLUMNS } from '@/lib/practice-os/import-helpers';

export const runtime = 'nodejs';

/**
 * GET /api/platform/practice-os/import/template
 * Returns a pre-formatted .xlsx template matching the current importer:
 *  - "Mission_Content_Master" sheet with the 52-column header (row 1) + one example.
 *  - "Resources" sheet with its 7-column header (row 1) + one example.
 * The importer detects the header row dynamically, so row 1 is fine here.
 */
export async function GET() {
  const admin = await getAdminFromCookie();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();

  const styleHeader = (row) => {
    row.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF096B17' } };
      cell.alignment = { horizontal: 'center' };
    });
  };

  // --- Mission_Content_Master ---
  const missions = workbook.addWorksheet('Mission_Content_Master');
  styleHeader(missions.addRow(MISSION_COLUMNS));
  missions.columns = MISSION_COLUMNS.map(() => ({ width: 22 }));
  missions.addRow([
    'GBP-D1-M1', 1, 1, 1,
    'Create your Google Business Profile and add clinic name, address and phone.',
    'Google Business Profile',
    'Get your clinic listed so nearby patients can find you.',
    'A complete profile is the single biggest driver of local search visibility.',
    'When patients search your specialty near them, your clinic should appear.',
    '35 min', 'Easy', 'MOD-GBP', 1, 'Google Business Profile',
    'A published, verified Google Business Profile.', 'A Google account',
    '1. Open Google Business Profile\n2. Enter clinic name, address, phone\n3. Submit for verification',
    'https://youtu.be/example',
    'You are helping this doctor create a complete, NMC-compliant Google Business Profile. Stay on this task only.',
    4, 'Open GBP', 'link', 'https://business.google.com',
    'Open Canva', 'link', 'https://canva.com', '', '', '',
    'https://support.google.com/business', 'https://example.com/gbp-guide',
    'Clinic details', 'Clinic name', 'compulsory', 'Clinic phone', 'compulsory',
    'Clinic address', 'not_compulsory', '', '',
    'Yes', '', 'Your clinic is now on the map.', 'Profile could not be verified.',
    'Profile not published after 7 days', 'GBP-D2-M1', '', 'live', 'Founder', '1', '', '',
  ]);

  // --- Resources ---
  const resources = workbook.addWorksheet('Resources');
  styleHeader(resources.addRow(RESOURCE_COLUMNS));
  resources.columns = RESOURCE_COLUMNS.map(() => ({ width: 22 }));
  resources.addRow([
    'GBP-D1-M1', 1, 'Video', 'Official GBP Tutorial',
    'https://example.com/video', 'Yes', 'Primary tutorial',
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="practice-os-content-template.xlsx"',
    },
  });
}
