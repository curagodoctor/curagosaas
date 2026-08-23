import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import Clinic from '@/models/Clinic';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { requireFeatureOr403, FEATURES } from '@/lib/entitlements';
import { fireWyltoWebhook, toE164 } from '@/lib/wylto';
import { getClinicName } from '@/lib/clinicName';

export const runtime = 'nodejs';

// POST /api/doctor/contacts/[id]/review-request
// One-click review request — triggers the Wylto review-request WhatsApp flow
// (which itself sends the day-0 / day-1 / day-3 messages). One-time per contact.
export async function POST(request, { params }) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const locked = await requireFeatureOr403(doctor._id, FEATURES.WORKFLOWS);
    if (locked) return locked;

    const { id } = await params;
    const contact = await Contact.findOne({ _id: id, doctorId: doctor._id });
    if (!contact) return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });

    if (contact.reviewRequestSentAt) {
      return NextResponse.json(
        { success: false, error: 'A review request has already been sent to this contact.', reviewRequestSentAt: contact.reviewRequestSentAt },
        { status: 400 }
      );
    }
    if (!contact.phone) {
      return NextResponse.json({ success: false, error: 'This contact has no phone number.' }, { status: 400 });
    }

    const doctorName = doctor.displayName || doctor.name || '';
    // Prefer the clinic the contact was seen at; fall back to the doctor's clinic name.
    const clinicName = contact.clinicName || (await getClinicName(doctor._id)) || doctorName;

    // Clinic phone: use the specific clinic's phone if the contact has one, else the doctor's.
    let clinicPhone = '';
    if (contact.clinicId) {
      const clinic = await Clinic.findOne({ _id: contact.clinicId, doctorId: doctor._id }).select('phone').lean();
      clinicPhone = toE164(clinic?.phone || doctor.whatsappNumber || doctor.phone || '');
    } else {
      clinicPhone = toE164(doctor.whatsappNumber || doctor.phone || '');
    }

    const result = await fireWyltoWebhook('reviewRequest', {
      name: contact.name,
      phoneNumber: contact.phone,
      patientName: contact.name,
      doctorName,
      clinicName,
      clinicPhone,
      // The date the doctor recorded consulting this patient.
      consultedDate: contact.consultedDate || '',
      appointmentDate: contact.consultedDate || '',
      // Doctor's one-time review link (falls back to a per-contact one if set).
      reviewLink: doctor.googleReviewLink || contact.googleReviewLink || '',
    });
    if (!result.success) {
      return NextResponse.json({ success: false, error: 'Could not trigger the review request. Please try again.' }, { status: 502 });
    }

    contact.reviewRequestSentAt = new Date();
    await contact.save();
    return NextResponse.json({ success: true, reviewRequestSentAt: contact.reviewRequestSentAt });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[Review request]', error);
    return NextResponse.json({ success: false, error: 'Failed to send review request' }, { status: 500 });
  }
}
