import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import ContactStatus from '@/models/ContactStatus';
import { requireDoctorAuth } from '@/lib/doctorAuth';

export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const isTemplate = searchParams.get('template') === 'true';

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contacts');

    // Header row
    const headers = ['Name', 'Phone', 'Email', 'Status', 'Notes'];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF096B17' } };
      cell.alignment = { horizontal: 'center' };
    });

    // Set column widths
    worksheet.columns = [
      { width: 25 }, // Name
      { width: 15 }, // Phone
      { width: 30 }, // Email
      { width: 15 }, // Status
      { width: 40 }, // Notes
    ];

    if (isTemplate) {
      // Add example row for template
      worksheet.addRow(['John Doe', '9876543210', 'john@example.com', 'new', 'Sample notes']);
    } else {
      // Fetch all contacts
      const contacts = await Contact.find({ doctorId: doctor._id }).sort({ createdAt: -1 }).lean();
      const statuses = await ContactStatus.find({ doctorId: doctor._id }).lean();
      const statusMap = {};
      statuses.forEach(s => { statusMap[s.name] = s.label; });

      for (const contact of contacts) {
        worksheet.addRow([
          contact.name,
          contact.phone || '',
          contact.email || '',
          statusMap[contact.status] || contact.status,
          contact.notes || '',
        ]);
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = isTemplate ? 'contacts-template.xlsx' : `contacts-${Date.now()}.xlsx`;

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Contacts Export]', error);
    return NextResponse.json({ success: false, error: 'Failed to export contacts' }, { status: 500 });
  }
}
