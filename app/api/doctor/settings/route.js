import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Contact from '@/models/Contact';
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
        clinicName: doctor.clinicName || "",
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        bio: doctor.bio,
        whatsappNumber: doctor.whatsappNumber,
        googleReviewLink: doctor.googleReviewLink || "",
        reviewRequestMessage: doctor.reviewRequestMessage || "",
        phone: doctor.phone,
        licenseNumber: doctor.licenseNumber,
        timezone: doctor.timezone,
        profileImage: doctor.profileImage,
        favicon: doctor.favicon || '',
        subdomain: doctor.subdomain,
        customDomain: doctor.customDomain,
        email: doctor.email,
        ga4MeasurementId: doctor.analytics?.ga4MeasurementId || '',
        metaPixelId: doctor.analytics?.metaPixelId || '',
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
      'clinicName',
      'specialization',
      'qualification',
      'bio',
      'whatsappNumber',
      'googleReviewLink',
      'reviewRequestMessage',
      'licenseNumber',
      'timezone',
      'profileImage',
      'favicon',
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

    // Website analytics IDs — stored nested under `analytics`. Empty string clears.
    if (data.ga4MeasurementId !== undefined) {
      const ga4 = String(data.ga4MeasurementId).trim();
      if (ga4 && !/^G-[A-Z0-9]{4,}$/i.test(ga4)) {
        return NextResponse.json({ error: 'GA4 Measurement ID should look like G-XXXXXXXXXX' }, { status: 400 });
      }
      updates['analytics.ga4MeasurementId'] = ga4;
    }
    if (data.metaPixelId !== undefined) {
      const pixel = String(data.metaPixelId).trim();
      if (pixel && !/^\d{6,20}$/.test(pixel)) {
        return NextResponse.json({ error: 'Meta Pixel ID should be the numeric ID (6–20 digits)' }, { status: 400 });
      }
      updates['analytics.metaPixelId'] = pixel;
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

    // The Google review link is stamped onto each contact at creation (set once).
    // When it changes here, propagate the new value to all of this doctor's
    // contacts so they stay in sync — there is no per-contact override anymore.
    if (updates.googleReviewLink !== undefined) {
      await Contact.updateMany(
        { doctorId: doctor._id },
        { $set: { googleReviewLink: updates.googleReviewLink?.trim() || undefined } }
      );
    }

    return NextResponse.json({
      message: 'Settings updated successfully',
      doctor: {
        displayName: updatedDoctor.displayName,
        clinicName: updatedDoctor.clinicName || "",
        specialization: updatedDoctor.specialization,
        qualification: updatedDoctor.qualification,
        bio: updatedDoctor.bio,
        whatsappNumber: updatedDoctor.whatsappNumber,
        googleReviewLink: updatedDoctor.googleReviewLink || "",
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
