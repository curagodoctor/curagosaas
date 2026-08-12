import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';
import Framework from '@/models/practice-os/Framework';
import Module from '@/models/practice-os/Module';
import Mission from '@/models/practice-os/Mission';
import PracticeOsEnrollment from '@/models/practice-os/PracticeOsEnrollment';

export const runtime = 'nodejs';

// GET /api/platform/practice-os/frameworks/export
// Downloads an .xlsx overview of every pack (title, price, content counts,
// enrolment + completion stats) so the founder can work with the catalogue in
// Excel. (#25)
export async function GET() {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const frameworks = await Framework.find().sort({ order: 1, createdAt: 1 }).lean();

    const rows = await Promise.all(frameworks.map(async (fw) => {
      const [modules, missions, enrolled, completed] = await Promise.all([
        Module.countDocuments({ frameworkId: fw._id }),
        Mission.countDocuments({ frameworkId: fw._id }),
        PracticeOsEnrollment.countDocuments({ frameworkId: fw._id }),
        PracticeOsEnrollment.countDocuments({ frameworkId: fw._id, status: 'completed' }),
      ]);
      const status = fw.deletedAt ? 'Deleted' : fw.isPublished ? 'Published' : 'Draft';
      return {
        Title: fw.title || '',
        Slug: fw.slug || '',
        Category: fw.category || '',
        'Price (INR)': fw.priceInInr || 0,
        Status: status,
        Missions: missions,
        Modules: modules,
        'Enrolled doctors': enrolled,
        'Completed': completed,
        Created: fw.createdAt ? new Date(fw.createdAt).toISOString().slice(0, 10) : '',
      };
    }));

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Packs');
    const columns = ['Title', 'Slug', 'Category', 'Price (INR)', 'Status', 'Missions', 'Modules', 'Enrolled doctors', 'Completed', 'Created'];
    sheet.columns = columns.map((c) => ({ header: c, key: c, width: c === 'Title' ? 34 : 16 }));
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF096B17' } };
      cell.alignment = { horizontal: 'center' };
    });
    rows.forEach((r) => sheet.addRow(r));

    const buffer = await workbook.xlsx.writeBuffer();
    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="zero-to-practice-builder-packs-${stamp}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('[Practice OS packs export]', error);
    return NextResponse.json({ success: false, error: 'Failed to export packs' }, { status: 500 });
  }
}
