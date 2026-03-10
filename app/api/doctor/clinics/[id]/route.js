import { NextResponse } from 'next/server';
import { getCurrentDoctor } from '@/lib/doctorAuth';
import connectDB from '@/lib/mongodb';
import Clinic from '@/models/Clinic';

// GET - Get single clinic
export async function GET(request, { params }) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const clinic = await Clinic.findOne({
      _id: id,
      doctorId: doctor._id,
    });

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      clinic,
    });
  } catch (error) {
    console.error('Get clinic error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// PUT - Update clinic
export async function PUT(request, { params }) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const data = await request.json();

    // Verify ownership
    const existing = await Clinic.findOne({
      _id: id,
      doctorId: doctor._id,
    });

    if (!existing) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    // Handle setting as primary
    if (data.isPrimary === true) {
      await Clinic.updateMany(
        { doctorId: doctor._id, _id: { $ne: id } },
        { isPrimary: false }
      );
    }

    const clinic = await Clinic.findByIdAndUpdate(
      id,
      {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        timings: data.timings,
        mapUrl: data.mapUrl,
        coordinates: data.coordinates,
        images: data.images,
        consultationFee: data.consultationFee,
        services: data.services,
        isActive: data.isActive,
        isPrimary: data.isPrimary,
        sortOrder: data.sortOrder,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      clinic,
    });
  } catch (error) {
    console.error('Update clinic error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// DELETE - Delete clinic
export async function DELETE(request, { params }) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const result = await Clinic.findOneAndDelete({
      _id: id,
      doctorId: doctor._id,
    });

    if (!result) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    // If deleted clinic was primary, make the first remaining clinic primary
    if (result.isPrimary) {
      const firstClinic = await Clinic.findOne({ doctorId: doctor._id })
        .sort({ sortOrder: 1 });
      if (firstClinic) {
        firstClinic.isPrimary = true;
        await firstClinic.save();
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete clinic error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
