import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import Doctor from '@/models/Doctor';
import { getCalendarAuthUrl, isCalendarOAuthConfigured } from '@/lib/googleCalendarOAuth';

export const runtime = 'nodejs';

// GET — connection status + (if requested) the Google consent URL to connect.
export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();
    const d = await Doctor.findById(doctor._id).select('googleCalendar.connected googleCalendar.email').lean();
    const connect = new URL(request.url).searchParams.get('connect');
    if (connect) {
      if (!isCalendarOAuthConfigured()) {
        return NextResponse.json({ success: false, error: 'Google Calendar is not configured on the server.' }, { status: 500 });
      }
      return NextResponse.json({ success: true, url: getCalendarAuthUrl(String(doctor._id)) });
    }
    return NextResponse.json({
      success: true,
      connected: !!d?.googleCalendar?.connected,
      email: d?.googleCalendar?.email || '',
      configured: isCalendarOAuthConfigured(),
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[google-calendar GET]', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

// DELETE — disconnect (clears the stored token; bookings fall back to the shared calendar).
export async function DELETE(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();
    await Doctor.updateOne({ _id: doctor._id }, {
      $set: { 'googleCalendar.connected': false, 'googleCalendar.email': '', 'googleCalendar.refreshToken': '', 'googleCalendar.connectedAt': null },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[google-calendar DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
