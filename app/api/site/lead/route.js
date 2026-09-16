import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Contact from '@/models/Contact';

export const runtime = 'nodejs';

// Public lead-form intake. A visitor on a doctor's site submits name + phone
// (+ optional email/message); we create a Contact the doctor sees in their
// dashboard. This is the lightweight alternative to the booking system.
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || '').trim().slice(0, 100);
    const phone = String(body.phone || '').replace(/[^\d+]/g, '').slice(0, 20);
    const email = String(body.email || '').trim().toLowerCase().slice(0, 160);
    const message = String(body.message || '').trim().slice(0, 1000);

    if (!name || (!phone && !email)) {
      return NextResponse.json({ success: false, error: 'Please add your name and a phone or email.' }, { status: 400 });
    }

    // Resolve the doctor by id or subdomain.
    let doctor = null;
    if (body.doctorId) doctor = await Doctor.findById(body.doctorId).select('_id').lean();
    if (!doctor && body.subdomain) doctor = await Doctor.findOne({ subdomain: String(body.subdomain).toLowerCase().trim() }).select('_id').lean();
    if (!doctor) return NextResponse.json({ success: false, error: 'Clinic not found.' }, { status: 404 });

    await Contact.create({
      doctorId: doctor._id,
      name,
      phone,
      email,
      status: 'new',
      source: 'website-lead-form',
      notes: message,
      tags: ['lead'],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[site/lead]', error.message);
    return NextResponse.json({ success: false, error: 'Could not submit. Please try again.' }, { status: 500 });
  }
}
