import { NextResponse } from 'next/server';
import { getCurrentDoctor } from '@/lib/doctorAuth';
import { getTierContext } from '@/lib/accessTier';

export async function GET(request) {
  try {
    const doctor = await getCurrentDoctor(request);

    if (!doctor) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // The effective access tier + capability matrix drives all gating in the
    // unified Control Center (Free / Paid / Founder).
    const access = await getTierContext(doctor);

    // Return doctor data (sensitive fields already excluded by select)
    return NextResponse.json({
      success: true,
      access, // { tier, maxPages, maxBlogs, aiRefill, dos, features:{...} }
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
        favicon: doctor.favicon || '',
        bio: doctor.bio,
        isLicensedProfessional: doctor.isLicensedProfessional,
        licenseNumber: doctor.licenseNumber,
        whatsappNumber: doctor.whatsappNumber,
        timezone: doctor.timezone,
        myReferralCode: doctor.myReferralCode,
        createdAt: doctor.createdAt,
        lastLoginAt: doctor.lastLoginAt,
        // Product access flags for the shared /app shell
        authProvider: doctor.authProvider,
        practiceOsActive: doctor.practiceOsActive,
        websiteBuilderActive: doctor.websiteBuilderActive,
        accessTier: doctor.accessTier || 'free',
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
