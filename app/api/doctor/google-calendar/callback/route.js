import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import Doctor from '@/models/Doctor';
import { exchangeCalendarCode, createAppCalendar } from '@/lib/googleCalendarOAuth';

export const runtime = 'nodejs';

const SETTINGS = () => `${process.env.NEXT_PUBLIC_APP_URL || 'https://curago.in'}/admin/dashboard/settings`;
const back = (q) => NextResponse.redirect(`${SETTINGS()}?gcal=${q}`);

// Google redirects here after the doctor approves (or denies) calendar access.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (searchParams.get('error') || !code) return back('denied');

    // The doctor must still be logged in (same browser) — and match the state.
    let doctor;
    try { doctor = await requireDoctorAuth(request); } catch { return back('session'); }
    if (state && String(state) !== String(doctor._id)) return back('mismatch');

    const { refreshToken, accessToken, email } = await exchangeCalendarCode(code);
    if (!refreshToken) return back('noToken'); // Google only returns it with prompt=consent

    // Create the dedicated "CuraGo Appointments" calendar in the doctor's account
    // (calendar.app.created can only write to app-created calendars, not primary).
    let calendarId = '';
    try { calendarId = await createAppCalendar(accessToken); } catch (e) { console.error('[gcal] create calendar:', e.message); }
    if (!calendarId) return back('error');

    await connectDB();
    await Doctor.updateOne({ _id: doctor._id }, {
      $set: {
        'googleCalendar.connected': true,
        'googleCalendar.email': email || '',
        'googleCalendar.refreshToken': refreshToken,
        'googleCalendar.calendarId': calendarId,
        'googleCalendar.connectedAt': new Date(),
      },
    });
    return back('connected');
  } catch (error) {
    console.error('[google-calendar callback]', error);
    return back('error');
  }
}
