import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ReputationManager from '@/models/ReputationManager';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('rep_manager_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.SESSION_SECRET);
    if (decoded.role !== 'reputation_manager') {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const manager = await ReputationManager.findById(decoded.managerId).select('-password');
    if (!manager || !manager.isActive) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      manager: { _id: manager._id, name: manager.name, email: manager.email, assignedDoctors: manager.assignedDoctors },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }
}
