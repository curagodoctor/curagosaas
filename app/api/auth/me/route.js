import { NextResponse } from 'next/server';
import { getCurrentDoctor } from '@/lib/doctorAuth';

export async function GET(request) {
  try {
    const doctor = await getCurrentDoctor(request);

    if (!doctor) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Return doctor data (sensitive fields already excluded by select)
    return NextResponse.json({
      success: true,
      doctor: {
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
        lastLoginAt: doctor.lastLoginAt,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
