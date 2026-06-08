import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SEOUser from '@/models/SEOUser';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    await connectDB();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 });
    }

    const user = await SEOUser.findOne({ email: email.toLowerCase(), isActive: true }).select('+password');
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { seoUserId: user._id, email: user.email, doctorId: user.doctorId, role: 'seo_user' },
      process.env.JWT_SECRET || process.env.SESSION_SECRET,
      { expiresIn: '7d' }
    );

    const cookieStore = await cookies();
    cookieStore.set('seo_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: { _id: user._id, name: user.name, email: user.email, doctorId: user.doctorId },
    });
  } catch (error) {
    console.error('[SEO Login]', error);
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}
