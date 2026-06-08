import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SEOUser from '@/models/SEOUser';
import { requireDoctorAuth } from '@/lib/doctorAuth';

export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const users = await SEOUser.find({ doctorId: doctor._id }).select('-password').lean();
    return NextResponse.json({ success: true, users });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch SEO users' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Name, email, and password required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existing = await SEOUser.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 400 });
    }

    const user = await SEOUser.create({
      name,
      email: email.toLowerCase(),
      password,
      doctorId: doctor._id,
    });

    return NextResponse.json({
      success: true,
      user: { _id: user._id, name: user.name, email: user.email },
    }, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[SEOUsers POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to create SEO user' }, { status: 500 });
  }
}
