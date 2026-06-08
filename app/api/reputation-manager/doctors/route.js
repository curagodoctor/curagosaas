import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ReputationManager from '@/models/ReputationManager';
import Doctor from '@/models/Doctor';
import Contact from '@/models/Contact';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getManager() {
  const cookieStore = await cookies();
  const token = cookieStore.get('rep_manager_token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.SESSION_SECRET);
    if (decoded.role !== 'reputation_manager') return null;
    return await ReputationManager.findById(decoded.managerId);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const manager = await getManager();
    if (!manager) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const doctors = await Doctor.find({
      _id: { $in: manager.assignedDoctors },
      isActive: true,
    }).select('name displayName email phone subdomain specialization profileImage').lean();

    // Get contact counts per doctor
    const contactCounts = await Contact.aggregate([
      { $match: { doctorId: { $in: manager.assignedDoctors } } },
      { $group: { _id: '$doctorId', total: { $sum: 1 } } },
    ]);

    const countMap = {};
    contactCounts.forEach(c => { countMap[c._id.toString()] = c.total; });

    const doctorsWithCounts = doctors.map(d => ({
      ...d,
      contactCount: countMap[d._id.toString()] || 0,
    }));

    return NextResponse.json({ success: true, doctors: doctorsWithCounts });
  } catch (error) {
    console.error('[RepManager Doctors]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch doctors' }, { status: 500 });
  }
}
