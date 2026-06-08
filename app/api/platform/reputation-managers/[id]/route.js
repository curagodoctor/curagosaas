import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ReputationManager from '@/models/ReputationManager';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';

export async function PATCH(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const manager = await ReputationManager.findById(id);
    if (!manager) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    if (body.name !== undefined) manager.name = body.name;
    if (body.assignedDoctors !== undefined) manager.assignedDoctors = body.assignedDoctors;
    if (body.isActive !== undefined) manager.isActive = body.isActive;
    if (body.password) manager.password = body.password; // Will be hashed by pre-save hook

    await manager.save();
    return NextResponse.json({ success: true, manager: { _id: manager._id, name: manager.name, email: manager.email } });
  } catch (error) {
    console.error('[Platform RepManagers PATCH]', error);
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const result = await ReputationManager.findByIdAndDelete(id);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Platform RepManagers DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
  }
}
