import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import { getCurrentDoctor } from '@/lib/doctorAuth';

// GET - Get doctor settings
export async function GET(request) {
  try {
    const doctor = await getCurrentDoctor(request);

    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      doctor: {
        displayName: doctor.displayName,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        bio: doctor.bio,
        whatsappNumber: doctor.whatsappNumber,
        phone: doctor.phone,
        licenseNumber: doctor.licenseNumber,
        timezone: doctor.timezone,
        profileImage: doctor.profileImage,
        subdomain: doctor.subdomain,
        email: doctor.email,
      }
    });
  } catch (error) {
    console.error('Error fetching doctor settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT - Update doctor settings
export async function PUT(request) {
  try {
    const doctor = await getCurrentDoctor(request);

    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const data = await request.json();

    // Only allow updating specific fields
    const allowedFields = [
      'displayName',
      'specialization',
      'qualification',
      'bio',
      'whatsappNumber',
      'licenseNumber',
      'timezone',
      'profileImage',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates[field] = data[field];
      }
    }

    // Validate WhatsApp number format (10 digits)
    if (updates.whatsappNumber) {
      const cleanNumber = updates.whatsappNumber.replace(/\D/g, '');
      if (cleanNumber.length !== 10) {
        return NextResponse.json(
          { error: 'WhatsApp number must be 10 digits' },
          { status: 400 }
        );
      }
      updates.whatsappNumber = cleanNumber;
    }

    // Validate bio length
    if (updates.bio && updates.bio.length > 500) {
      return NextResponse.json(
        { error: 'Bio cannot exceed 500 characters' },
        { status: 400 }
      );
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctor._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -emailVerificationOTP -emailVerificationExpiry');

    if (!updatedDoctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Settings updated successfully',
      doctor: {
        displayName: updatedDoctor.displayName,
        specialization: updatedDoctor.specialization,
        qualification: updatedDoctor.qualification,
        bio: updatedDoctor.bio,
        whatsappNumber: updatedDoctor.whatsappNumber,
        phone: updatedDoctor.phone,
        licenseNumber: updatedDoctor.licenseNumber,
        timezone: updatedDoctor.timezone,
        profileImage: updatedDoctor.profileImage,
      }
    });
  } catch (error) {
    console.error('Error updating doctor settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
