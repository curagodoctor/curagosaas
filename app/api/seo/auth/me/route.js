import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SEOUser from '@/models/SEOUser';
import Doctor from '@/models/Doctor';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('seo_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.SESSION_SECRET);
    if (decoded.role !== 'seo_user') {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const user = await SEOUser.findById(decoded.seoUserId);
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const doctor = await Doctor.findById(user.doctorId).select('name displayName subdomain');

    return NextResponse.json({
      success: true,
      user: { _id: user._id, name: user.name, email: user.email, doctorId: user.doctorId },
      doctor: doctor ? { name: doctor.displayName || doctor.name, subdomain: doctor.subdomain } : null,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }
}
