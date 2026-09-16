import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, hasOptimizationAccess } from '@/lib/practice-os/access';
import PracticeOsAccessRequest from '@/models/practice-os/PracticeOsAccessRequest';
import { sendPracticeOsReminderEmail } from '@/lib/email';
import { fireWyltoWebhook } from '@/lib/wylto';

export const runtime = 'nodejs';

const FOUNDER_EMAIL = process.env.PRACTICE_OS_NOTIFY_EMAIL || process.env.DOCTOR_EMAIL || '';

// GET — the doctor's current access state, for the gate UI.
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const granted = await hasOptimizationAccess(doctor._id);
    const latest = await PracticeOsAccessRequest.findOne({ doctorId: doctor._id }).sort({ createdAt: -1 }).lean();
    const status = granted ? 'granted' : (latest?.status === 'pending' ? 'pending' : latest?.status === 'denied' ? 'denied' : 'none');
    const prefill = {
      name: doctor.displayName || doctor.name || '',
      phone: doctor.whatsappNumber || doctor.phone || '',
      specialty: doctor.specialization || '',
    };
    // Access detail for the "granted" screen (expiry + subscription state).
    const PracticeOsProfile = (await import('@/models/practice-os/PracticeOsProfile')).default;
    const OptimizationSubscription = (await import('@/models/practice-os/OptimizationSubscription')).default;
    const profile = await PracticeOsProfile.findOne({ doctorId: doctor._id }).select('optimizationAccess').lean();
    const sub = await OptimizationSubscription.findOne({ doctorId: doctor._id, status: 'active' }).select('status').lean();
    const a = profile?.optimizationAccess || {};
    const access = {
      permanent: !!a.permanent,
      expiresAt: a.expiresAt || null,
      subscribed: !!sub,
    };
    return NextResponse.json({ success: true, granted, status, prefill, access });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[access-request GET]', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

// POST — submit the Get Access form: store it, email the founder, fire a webhook.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();

    if (await hasOptimizationAccess(doctor._id)) {
      return NextResponse.json({ success: true, status: 'granted' });
    }
    // Don't stack duplicate pending requests.
    const existing = await PracticeOsAccessRequest.findOne({ doctorId: doctor._id, status: 'pending' }).lean();
    if (existing) return NextResponse.json({ success: true, status: 'pending' });

    const body = await request.json();
    const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
    const req = await PracticeOsAccessRequest.create({
      doctorId: doctor._id,
      name: (body.name || doctor.displayName || doctor.name || '').trim(),
      phone: (body.phone || doctor.whatsappNumber || doctor.phone || '').trim(),
      email: doctor.email || '',
      // Map the questionnaire onto the summary columns the founder scans first.
      city: (answers.location || body.city || '').trim(),
      specialty: (answers.specialty || body.specialty || doctor.specialization || '').trim(),
      challenge: (answers.biggest_challenge || body.challenge || '').trim(),
      goal: (answers.why_founding || body.goal || '').trim(),
      answers,
      status: 'pending',
    });

    // Notify the founder by email (best-effort).
    if (FOUNDER_EMAIL) {
      const answerLines = Object.entries(answers)
        .filter(([, v]) => String(v ?? '').trim())
        .map(([k, v]) => `• ${k.replace(/_/g, ' ')}: ${String(v).trim()}`);
      const lines = [
        `${req.name || 'A doctor'} has applied for early access (founding case study).`,
        ``,
        `Name: ${req.name}`,
        `Phone: ${req.phone}`,
        `Email: ${req.email}`,
        ``,
        `— Questionnaire —`,
        ...(answerLines.length ? answerLines : ['(no answers captured)']),
        ``,
        `Review and grant access in the Command Center → Access Requests.`,
      ].join('\n');
      try {
        await sendPracticeOsReminderEmail({
          email: FOUNDER_EMAIL, name: 'Founder',
          subject: `Access request — ${req.name || 'doctor'}`,
          heading: 'New access request', body: lines,
          ctaLabel: 'Open Command Center', ctaUrl: 'https://curago.in/platform-admin/dashboard/practice-os',
        });
      } catch (e) { console.error('[access-request] founder email failed:', e.message); }
    }

    // Fire the webhook (no-ops if the URL isn't configured).
    try {
      await fireWyltoWebhook('getAccessRequest', { name: req.name, phoneNumber: req.phone, city: req.city, specialty: req.specialty });
    } catch (e) { console.error('[access-request] webhook failed:', e.message); }

    return NextResponse.json({ success: true, status: 'pending' });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[access-request POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to submit request' }, { status: 500 });
  }
}
