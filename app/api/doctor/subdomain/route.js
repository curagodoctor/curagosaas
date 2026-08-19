import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import BookingPage from '@/models/BookingPage';
import { requireDoctorAuth, isValidSubdomain, checkSubdomainAvailability } from '@/lib/doctorAuth';
import { initializeDefaultModes } from '@/lib/slotManagerDB';
import { buildDefaultSections } from '@/lib/defaultTemplate';

// Claim a website subdomain after signup. Needed mainly for Google sign-up,
// which creates the account without a subdomain (the email signup form collects
// it up front). Mirrors what verify-email does: set the subdomain, then seed the
// default website + consultation modes.
async function createDefaultWebsite(doctor) {
  const existing = await BookingPage.findOne({ doctorId: doctor._id });
  if (existing) return existing;

  const website = new BookingPage({
    doctorId: doctor._id,
    slug: 'home',
    title: doctor.displayName || doctor.name,
    metaDescription: `${doctor.displayName || doctor.name}'s Clinic`,
    status: 'published',
    publishedAt: new Date(),
    sections: buildDefaultSections(doctor),
    paymentMode: 'no_payment',
    consultationFee: 0,
    bookingFee: 0,
    createdBy: 'system',
  });
  await website.save();
  return website;
}

// PUT — CHANGE an existing subdomain to a new one. The site is served on the
// *.curago.in wildcard by the subdomain field, so updating it re-points the site
// immediately (the old subdomain stops resolving). Booking pages are keyed by
// doctorId, so they keep working.
export async function PUT(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const { subdomain: raw } = await request.json();
    const subdomain = (raw || '').trim().toLowerCase();
    if (!subdomain) {
      return NextResponse.json({ success: false, error: 'Subdomain is required' }, { status: 400 });
    }
    if (subdomain === doctor.subdomain) {
      return NextResponse.json({ success: true, subdomain, unchanged: true });
    }
    if (!isValidSubdomain(subdomain)) {
      return NextResponse.json(
        { success: false, error: 'Invalid subdomain. Use only lowercase letters, numbers, and hyphens (3–30 characters).' },
        { status: 400 }
      );
    }
    const check = await checkSubdomainAvailability(subdomain);
    if (!check.available) {
      return NextResponse.json({ success: false, error: check.reason || 'This subdomain is not available' }, { status: 409 });
    }

    const fresh = await Doctor.findById(doctor._id);
    if (!fresh) return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    const previous = fresh.subdomain;
    fresh.subdomain = subdomain;
    if (!fresh.websiteBuilderActive) fresh.websiteBuilderActive = true;
    try {
      await fresh.save();
    } catch (saveErr) {
      if (saveErr?.code === 11000) {
        return NextResponse.json({ success: false, error: 'This subdomain was just taken. Please choose another.' }, { status: 409 });
      }
      throw saveErr;
    }
    // Seed a website if this doctor never had one (e.g. changing before claiming).
    if (!previous) {
      try { await createDefaultWebsite(fresh); await initializeDefaultModes(fresh._id); } catch (e) { console.error('[subdomain change] seed failed:', e); }
    }
    return NextResponse.json({ success: true, subdomain, previous });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[subdomain change]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to change subdomain' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    // Already has a subdomain — idempotent, never overwrite an existing one.
    if (doctor.subdomain) {
      return NextResponse.json({ success: true, subdomain: doctor.subdomain, alreadySet: true });
    }

    const { subdomain: raw } = await request.json();
    const subdomain = (raw || '').trim().toLowerCase();

    if (!subdomain) {
      return NextResponse.json({ success: false, error: 'Subdomain is required' }, { status: 400 });
    }
    if (!isValidSubdomain(subdomain)) {
      return NextResponse.json(
        { success: false, error: 'Invalid subdomain. Use only lowercase letters, numbers, and hyphens (3–30 characters).' },
        { status: 400 }
      );
    }

    const check = await checkSubdomainAvailability(subdomain);
    if (!check.available) {
      return NextResponse.json({ success: false, error: check.reason || 'This subdomain is not available' }, { status: 409 });
    }

    // Persist the subdomain + activate Website Builder, then seed the site.
    const fresh = await Doctor.findById(doctor._id);
    if (!fresh) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }
    fresh.subdomain = subdomain;
    fresh.websiteBuilderActive = true;
    try {
      await fresh.save();
    } catch (saveErr) {
      // A concurrent claim (unique index) — surface as taken rather than 500.
      if (saveErr?.code === 11000) {
        return NextResponse.json({ success: false, error: 'This subdomain was just taken. Please choose another.' }, { status: 409 });
      }
      throw saveErr;
    }

    try {
      await createDefaultWebsite(fresh);
      await initializeDefaultModes(fresh._id);
    } catch (err) {
      // Don't fail the claim if seeding the site/modes hiccups — the subdomain
      // is saved and the builder can create the page later.
      console.error('[subdomain claim] website/mode init failed:', err);
    }

    return NextResponse.json({ success: true, subdomain });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[subdomain claim]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to set subdomain' }, { status: 500 });
  }
}
