import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import PlatformAdmin from '@/models/PlatformAdmin';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';

// PATCH — update an admin: toggle active, rename, or reset password.
export async function PATCH(request, { params }) {
  try {
    const { authenticated, admin: current } = await requirePlatformAdmin();
    if (!authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const target = await PlatformAdmin.findById(id);
    if (!target) {
      return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 });
    }

    const isSelf = target.email === String(current.email).toLowerCase();
    const body = await request.json();
    const updates = {};

    if (typeof body.name === 'string') {
      updates.name = body.name.trim();
    }

    if (typeof body.active === 'boolean') {
      // Don't let an admin deactivate their own account (lock-out guard).
      if (isSelf && body.active === false) {
        return NextResponse.json({ success: false, error: 'You cannot deactivate your own account.' }, { status: 400 });
      }
      updates.active = body.active;
    }

    if (typeof body.password === 'string' && body.password.length > 0) {
      if (body.password.length < 8) {
        return NextResponse.json({ success: false, error: 'Password must be at least 8 characters.' }, { status: 400 });
      }
      updates.passwordHash = await bcrypt.hash(body.password, 10);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'Nothing to update.' }, { status: 400 });
    }

    Object.assign(target, updates);
    await target.save();

    const { passwordHash: _omit, ...safe } = target.toObject();
    return NextResponse.json({ success: true, admin: safe });
  } catch (error) {
    console.error('[Platform Team PATCH]', error);
    return NextResponse.json({ success: false, error: 'Failed to update admin' }, { status: 500 });
  }
}

// DELETE — remove an admin's portal access.
export async function DELETE(request, { params }) {
  try {
    const { authenticated, admin: current } = await requirePlatformAdmin();
    if (!authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const target = await PlatformAdmin.findById(id);
    if (!target) {
      return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 });
    }

    if (target.email === String(current.email).toLowerCase()) {
      return NextResponse.json({ success: false, error: 'You cannot remove your own account.' }, { status: 400 });
    }

    // Never leave the portal with zero active admins.
    const activeCount = await PlatformAdmin.countDocuments({ active: true });
    if (target.active && activeCount <= 1) {
      return NextResponse.json({ success: false, error: 'At least one active admin must remain.' }, { status: 400 });
    }

    await target.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Platform Team DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to remove admin' }, { status: 500 });
  }
}
