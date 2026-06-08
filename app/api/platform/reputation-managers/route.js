import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ReputationManager from '@/models/ReputationManager';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';

export async function GET(request) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const managers = await ReputationManager.find()
      .select('-password')
      .populate('assignedDoctors', 'name displayName subdomain')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, managers });
  } catch (error) {
    console.error('[Platform RepManagers GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { name, email, password, assignedDoctors } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Name, email, and password required' }, { status: 400 });
    }

    const existing = await ReputationManager.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 400 });
    }

    const manager = await ReputationManager.create({
      name,
      email: email.toLowerCase(),
      password,
      assignedDoctors: assignedDoctors || [],
    });

    return NextResponse.json({
      success: true,
      manager: { _id: manager._id, name: manager.name, email: manager.email },
    }, { status: 201 });
  } catch (error) {
    console.error('[Platform RepManagers POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to create' }, { status: 500 });
  }
}
