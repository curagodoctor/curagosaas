import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ReputationManager from '@/models/ReputationManager';
import Contact from '@/models/Contact';
import ContactStatus from '@/models/ContactStatus';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getManagerAndVerifyDoctor(doctorId) {
  const cookieStore = await cookies();
  const token = cookieStore.get('rep_manager_token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.SESSION_SECRET);
    if (decoded.role !== 'reputation_manager') return null;
    const manager = await ReputationManager.findById(decoded.managerId);
    if (!manager || !manager.isActive) return null;
    if (!manager.assignedDoctors.some(d => d.toString() === doctorId)) return null;
    return manager;
  } catch {
    return null;
  }
}

export async function POST(request, { params }) {
  try {
    const { id: doctorId } = await params;
    const manager = await getManagerAndVerifyDoctor(doctorId);
    if (!manager) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || file.size > 5 * 1024 * 1024 || !file.name?.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json({ success: false, error: 'Upload a valid .xlsx file (max 5MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      return NextResponse.json({ success: false, error: 'No worksheet found' }, { status: 400 });
    }

    const statusCount = await ContactStatus.countDocuments({ doctorId });
    if (statusCount === 0) await ContactStatus.createDefaultsForDoctor(doctorId);

    const contacts = [];
    const errors = [];

    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return;
      const name = row.getCell(1).text?.trim();
      if (!name) { errors.push({ row: rowIndex, error: 'Name required' }); return; }

      contacts.push({
        doctorId,
        name,
        phone: row.getCell(2).text?.trim() || undefined,
        email: row.getCell(3).text?.trim()?.toLowerCase() || undefined,
        status: row.getCell(4).text?.trim()?.toLowerCase() || 'new',
        notes: row.getCell(5).text?.trim() || undefined,
        source: 'import',
      });
    });

    let imported = 0;
    if (contacts.length > 0) {
      try {
        const result = await Contact.insertMany(contacts, { ordered: false });
        imported = result.length;
      } catch (error) {
        imported = error.result?.nInserted || 0;
      }
    }

    return NextResponse.json({ success: true, imported, skipped: errors.length, total: contacts.length + errors.length });
  } catch (error) {
    console.error('[RepManager Import]', error);
    return NextResponse.json({ success: false, error: 'Import failed' }, { status: 500 });
  }
}
