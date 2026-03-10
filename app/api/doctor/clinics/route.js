import { NextResponse } from 'next/server';
import { getCurrentDoctor } from '@/lib/doctorAuth';
import connectDB from '@/lib/mongodb';
import Clinic from '@/models/Clinic';

// GET - Get all clinics for the doctor
export async function GET(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const clinics = await Clinic.find({ doctorId: doctor._id })
      .sort({ sortOrder: 1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      clinics,
    });
  } catch (error) {
    console.error('Get clinics error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// POST - Create new clinic
export async function POST(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const data = await request.json();

    if (!data.name) {
      return NextResponse.json(
        { error: 'Clinic name is required' },
        { status: 400 }
      );
    }

    // Get next sort order
    const maxSort = await Clinic.findOne({ doctorId: doctor._id })
      .sort({ sortOrder: -1 })
      .select('sortOrder');
    const sortOrder = (maxSort?.sortOrder || 0) + 1;

    // Check if this is the first clinic
    const clinicCount = await Clinic.countDocuments({ doctorId: doctor._id });
    const isPrimary = clinicCount === 0;

    const clinic = await Clinic.create({
      doctorId: doctor._id,
      name: data.name,
      address: data.address || {},
      phone: data.phone || '',
      email: data.email || '',
      timings: data.timings || '',
      mapUrl: data.mapUrl || '',
      coordinates: data.coordinates || {},
      images: data.images || [],
      consultationFee: data.consultationFee || 0,
      services: data.services || [],
      isActive: true,
      isPrimary,
      sortOrder,
    });

    return NextResponse.json({
      success: true,
      clinic,
    });
  } catch (error) {
    console.error('Create clinic error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
