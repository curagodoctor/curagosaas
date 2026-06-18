import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ClinicManager from '@/models/ClinicManager';
import Doctor from '@/models/Doctor';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('clinic_manager_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.SESSION_SECRET);
    if (decoded.role !== 'clinic_manager') {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const manager = await ClinicManager.findById(decoded.clinicManagerId);
    if (!manager || !manager.isActive) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const doctor = await Doctor.findById(manager.doctorId).select('name displayName subdomain');

    return NextResponse.json({
      success: true,
      user: { _id: manager._id, name: manager.name, email: manager.email, doctorId: manager.doctorId },
      doctor: doctor ? { name: doctor.displayName || doctor.name, subdomain: doctor.subdomain } : null,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }
}
