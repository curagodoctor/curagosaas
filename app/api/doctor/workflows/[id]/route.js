import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Workflow from '@/models/Workflow';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { requireFeatureOr403, FEATURES } from '@/lib/entitlements';

export async function PATCH(request, { params }) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const locked = await requireFeatureOr403(doctor._id, FEATURES.WORKFLOWS);
    if (locked) return locked;

    const { id } = await params;
    const body = await request.json();

    const workflow = await Workflow.findOne({ _id: id, doctorId: doctor._id });
    if (!workflow) {
      return NextResponse.json({ success: false, error: 'Workflow not found' }, { status: 404 });
    }

    const allowedFields = ['name', 'description', 'steps', 'isActive'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        workflow[field] = body[field];
      }
    }

    await workflow.save();
    return NextResponse.json({ success: true, workflow });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Workflows PATCH]', error);
    return NextResponse.json({ success: false, error: 'Failed to update workflow' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const locked = await requireFeatureOr403(doctor._id, FEATURES.WORKFLOWS);
    if (locked) return locked;

    const { id } = await params;

    const result = await Workflow.findOneAndDelete({ _id: id, doctorId: doctor._id, isDefault: false });
    if (!result) {
      return NextResponse.json({ success: false, error: 'Workflow not found or cannot delete default workflow' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Workflows DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete workflow' }, { status: 500 });
  }
}
