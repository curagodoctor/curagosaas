import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Doctor from '@/models/Doctor';
import { fireWyltoWebhook } from '@/lib/wylto';
import { getClinicNames } from '@/lib/clinicName';

export const runtime = 'nodejs';

// A single WhatsApp appointment reminder (via Wylto) each morning for TODAY's
// confirmed bookings, sent to BOTH the patient and the doctor. Tracked so it never
// double-sends. Runs once/day at ~9:00 IST — Vercel Hobby only allows daily crons,
// so this is the one reminder per booking.
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();

    const now = new Date();
    const istNow = new Date(now.getTime() + 5.5 * 3600 * 1000); // shift to IST wall clock
    const todayIST = istNow.toISOString().slice(0, 10);         // YYYY-MM-DD (IST "today")
    const morningGate = new Date(`${todayIST}T09:00:00+05:30`); // 9:00 IST today

    const bookings = await Booking.find({ status: 'confirmed', date: todayIST });
    const doctorIds = [...new Set(bookings.map((b) => String(b.doctorId)).filter(Boolean))];
    const doctors = doctorIds.length
      ? await Doctor.find({ _id: { $in: doctorIds } }).select('displayName name whatsappNumber phone').lean()
      : [];
    const docById = new Map(doctors.map((d) => [String(d._id), d]));
    const clinicByDoctor = await getClinicNames(doctorIds);

    const sendBoth = async (b, docPhone, docName) => {
      const ctx = {
        date: b.date,
        time: b.time,
        appointmentDate: b.date,
        appointmentTime: b.time,
        doctorName: docName,
        clinicName: clinicByDoctor.get(String(b.doctorId)) || docName,
        patientName: b.name,
      };
      await Promise.all([
        fireWyltoWebhook('appointmentReminder', { name: b.name, phoneNumber: b.whatsapp, ...ctx }),
        docPhone ? fireWyltoWebhook('appointmentReminder', { name: docName, phoneNumber: docPhone, ...ctx, patientPhone: b.whatsapp }) : Promise.resolve(),
      ]);
    };

    let morningSent = 0;

    for (const b of bookings) {
      if (!b.time) continue;
      const apptAt = new Date(`${b.date}T${b.time}:00+05:30`);
      if (Number.isNaN(apptAt.getTime())) continue;
      const doc = docById.get(String(b.doctorId));
      const docPhone = doc?.whatsappNumber || doc?.phone || '';
      const docName = doc?.displayName || doc?.name || '';

      // One reminder per booking — from 9:00 IST onward, while the appointment is ahead.
      if (!b.reminderMorningSentAt && now >= morningGate && now < apptAt) {
        await sendBoth(b, docPhone, docName);
        b.reminderMorningSentAt = now;
        await b.save();
        morningSent++;
      }
    }

    return NextResponse.json({ success: true, date: todayIST, total: bookings.length, morningSent });
  } catch (error) {
    console.error('[Appointment reminders]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) { return GET(request); }
