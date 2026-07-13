import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { requireFeatureOr403, FEATURES } from '@/lib/entitlements';

export async function PATCH(request, { params }) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const locked = await requireFeatureOr403(doctor._id, FEATURES.CONTACTS);
    if (locked) return locked;

    const { id } = await params;
    const body = await request.json();

    const contact = await Contact.findOne({ _id: id, doctorId: doctor._id });
    if (!contact) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    const allowedFields = ['name', 'phone', 'email', 'status', 'tags', 'notes', 'googleReviewLink'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        contact[field] = body[field];
      }
    }

    await contact.save();
    return NextResponse.json({ success: true, contact });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Contacts PATCH]', error);
    return NextResponse.json({ success: false, error: 'Failed to update contact' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const locked = await requireFeatureOr403(doctor._id, FEATURES.CONTACTS);
    if (locked) return locked;

    const { id } = await params;

    const result = await Contact.findOneAndDelete({ _id: id, doctorId: doctor._id });
    if (!result) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Contacts DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete contact' }, { status: 500 });
  }
}
