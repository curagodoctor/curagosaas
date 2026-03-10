import { NextResponse } from 'next/server';
import { getCurrentDoctor } from '@/lib/doctorAuth';
import Doctor from '@/models/Doctor';
import connectDB from '@/lib/mongodb';

// GET - Get current doctor's profile
export async function GET(request) {
  try {
    await connectDB();

    const doctor = await getCurrentDoctor(request);

    if (!doctor) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        subdomain: doctor.subdomain,
        customDomain: doctor.customDomain,
        displayName: doctor.displayName,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        profileImage: doctor.profileImage,
        bio: doctor.bio,
        isLicensedProfessional: doctor.isLicensedProfessional,
        licenseNumber: doctor.licenseNumber,
        whatsappNumber: doctor.whatsappNumber,
        timezone: doctor.timezone,
        myReferralCode: doctor.myReferralCode,
        createdAt: doctor.createdAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// PUT - Update current doctor's profile
export async function PUT(request) {
  try {
    await connectDB();

    const doctor = await getCurrentDoctor(request);

    if (!doctor) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Allowed fields to update
    const allowedFields = [
      'displayName',
      'specialization',
      'qualification',
      'profileImage',
      'bio',
      'licenseNumber',
      'whatsappNumber',
      'timezone',
    ];

    // Filter to only allowed fields
    const updateData = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Validate WhatsApp number format if provided
    if (updateData.whatsappNumber) {
      const cleanedNumber = updateData.whatsappNumber.replace(/\D/g, '');
      if (cleanedNumber && cleanedNumber.length !== 10) {
        return NextResponse.json(
          { error: 'WhatsApp number must be 10 digits' },
          { status: 400 }
        );
      }
      updateData.whatsappNumber = cleanedNumber;
    }

    // Update doctor
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctor._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        _id: updatedDoctor._id,
        displayName: updatedDoctor.displayName,
        specialization: updatedDoctor.specialization,
        qualification: updatedDoctor.qualification,
        profileImage: updatedDoctor.profileImage,
        bio: updatedDoctor.bio,
        whatsappNumber: updatedDoctor.whatsappNumber,
        timezone: updatedDoctor.timezone,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
