import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ContactStatus from '@/models/ContactStatus';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { requireFeatureOr403, FEATURES } from '@/lib/entitlements';

export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const locked = await requireFeatureOr403(doctor._id, FEATURES.CONTACTS);
    if (locked) return locked;

    let statuses = await ContactStatus.getActiveStatuses(doctor._id);

    // Auto-seed defaults if none exist
    if (statuses.length === 0) {
      await ContactStatus.createDefaultsForDoctor(doctor._id);
      statuses = await ContactStatus.getActiveStatuses(doctor._id);
    }

    return NextResponse.json({ success: true, statuses });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[ContactStatuses GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch statuses' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const locked = await requireFeatureOr403(doctor._id, FEATURES.CONTACTS);
    if (locked) return locked;

    const { name, label, color } = await request.json();

    if (!name || !label) {
      return NextResponse.json({ success: false, error: 'Name and label are required' }, { status: 400 });
    }

    // Check duplicate
    const existing = await ContactStatus.findOne({ doctorId: doctor._id, name: name.toLowerCase() });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Status with this name already exists' }, { status: 400 });
    }

    // Get next sort order
    const maxSort = await ContactStatus.findOne({ doctorId: doctor._id }).sort({ sortOrder: -1 });
    const sortOrder = (maxSort?.sortOrder || 0) + 1;

    const status = await ContactStatus.create({
      doctorId: doctor._id,
      name: name.toLowerCase(),
      label,
      color: color || '#6B7280',
      sortOrder,
    });

    return NextResponse.json({ success: true, status }, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[ContactStatuses POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to create status' }, { status: 500 });
  }
}
