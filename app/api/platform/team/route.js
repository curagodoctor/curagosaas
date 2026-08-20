import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import PlatformAdmin from '@/models/PlatformAdmin';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET — list all admin accounts (never expose the password hash).
export async function GET() {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const admins = await PlatformAdmin.find()
      .select('-passwordHash')
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, admins });
  } catch (error) {
    console.error('[Platform Team GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch team' }, { status: 500 });
  }
}

// POST — add a new admin who can access the portal.
export async function POST(request) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const email = String(body.email || '').toLowerCase().trim();
    const name = String(body.name || '').trim();
    const password = String(body.password || '');

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const existing = await PlatformAdmin.findOne({ email }).select('_id');
    if (existing) {
      return NextResponse.json({ success: false, error: 'An admin with that email already exists.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await PlatformAdmin.create({ email, name, passwordHash, active: true });

    const { passwordHash: _omit, ...safe } = admin.toObject();
    return NextResponse.json({ success: true, admin: safe }, { status: 201 });
  } catch (error) {
    console.error('[Platform Team POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to add admin' }, { status: 500 });
  }
}
