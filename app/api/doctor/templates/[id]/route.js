import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import MessageTemplate from '@/models/MessageTemplate';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { requireFeatureOr403, FEATURES } from '@/lib/entitlements';

export async function PATCH(request, { params }) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const locked = await requireFeatureOr403(doctor._id, FEATURES.TEMPLATES);
    if (locked) return locked;

    const { id } = await params;
    const body = await request.json();

    const template = await MessageTemplate.findOne({ _id: id, doctorId: doctor._id });
    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    const allowedFields = ['name', 'channel', 'subject', 'body', 'isActive'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        template[field] = body[field];
      }
    }

    await template.save();
    return NextResponse.json({ success: true, template });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Templates PATCH]', error);
    return NextResponse.json({ success: false, error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const locked = await requireFeatureOr403(doctor._id, FEATURES.TEMPLATES);
    if (locked) return locked;

    const { id } = await params;

    const result = await MessageTemplate.findOneAndDelete({ _id: id, doctorId: doctor._id });
    if (!result) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Templates DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete template' }, { status: 500 });
  }
}
