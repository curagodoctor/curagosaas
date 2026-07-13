import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import ContactStatus from '@/models/ContactStatus';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { requireFeatureOr403, FEATURES } from '@/lib/entitlements';

export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const locked = await requireFeatureOr403(doctor._id, FEATURES.CONTACTS);
    if (locked) return locked;

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large. Maximum 5MB.' }, { status: 400 });
    }

    // Check file type
    const fileName = file.name || '';
    if (!fileName.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Upload .xlsx or .xls file.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      return NextResponse.json({ success: false, error: 'No worksheet found in file' }, { status: 400 });
    }

    // Ensure statuses exist
    const statusCount = await ContactStatus.countDocuments({ doctorId: doctor._id });
    if (statusCount === 0) {
      await ContactStatus.createDefaultsForDoctor(doctor._id);
    }

    const contacts = [];
    const errors = [];
    let rowNum = 0;

    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // Skip header row
      rowNum++;

      const name = row.getCell(1).text?.trim();
      const phone = row.getCell(2).text?.trim();
      const email = row.getCell(3).text?.trim();
      const status = row.getCell(4).text?.trim()?.toLowerCase() || 'new';
      const notes = row.getCell(5).text?.trim();

      if (!name) {
        errors.push({ row: rowIndex, error: 'Name is required' });
        return;
      }

      contacts.push({
        doctorId: doctor._id,
        name,
        phone: phone || undefined,
        email: email?.toLowerCase() || undefined,
        status,
        notes: notes || undefined,
        source: 'import',
      });
    });

    let imported = 0;
    if (contacts.length > 0) {
      try {
        const result = await Contact.insertMany(contacts, { ordered: false });
        imported = result.length;
      } catch (error) {
        if (error.code === 11000) {
          // Some duplicates, count successful inserts
          imported = error.result?.nInserted || 0;
        } else {
          throw error;
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped: errors.length,
      total: rowNum,
      errors: errors.slice(0, 10), // Return first 10 errors
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Contacts Import]', error);
    return NextResponse.json({ success: false, error: 'Failed to import contacts' }, { status: 500 });
  }
}
