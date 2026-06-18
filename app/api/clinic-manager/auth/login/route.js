import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ClinicManager from '@/models/ClinicManager';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    await connectDB();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 });
    }

    const manager = await ClinicManager.findOne({ email: email.toLowerCase(), isActive: true }).select('+password');
    if (!manager) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await manager.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    manager.lastLoginAt = new Date();
    await manager.save();

    const token = jwt.sign(
      { clinicManagerId: manager._id, email: manager.email, doctorId: manager.doctorId, role: 'clinic_manager' },
      process.env.JWT_SECRET || process.env.SESSION_SECRET,
      { expiresIn: '7d' }
    );

    const cookieStore = await cookies();
    cookieStore.set('clinic_manager_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      manager: { _id: manager._id, name: manager.name, email: manager.email },
    });
  } catch (error) {
    console.error('[ClinicManager Login]', error);
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}
