import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import { getOrCreateProfile } from '@/lib/practice-os/profile';

export const runtime = 'nodejs';

// The doctor's public/profile links (Google Maps, GBP, Instagram, Facebook,
// LinkedIn, website, …). Stored on PracticeOsProfile.variables.relevantLinks as
// [{label,url}] — the same place onboarding captures them, so this is just a
// dedicated editor over that single source. Available on every tier (free too).

function errorResponse(e) {
  if (e.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (e.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
  console.error('[practice-os links]', e);
  return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
}

export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const profile = await getOrCreateProfile(doctor._id);
    const links = Array.isArray(profile.variables?.relevantLinks) ? profile.variables.relevantLinks : [];
    return NextResponse.json({ success: true, links });
  } catch (e) { return errorResponse(e); }
}

export async function PUT(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const raw = Array.isArray(body.links) ? body.links : [];
    const links = raw
      .map((l) => ({ label: String(l?.label || '').trim().slice(0, 60), url: String(l?.url || '').trim().slice(0, 500) }))
      .filter((l) => l.url)
      .slice(0, 30);
    const profile = await getOrCreateProfile(doctor._id);
    profile.variables = profile.variables || {};
    profile.variables.relevantLinks = links;
    profile.markModified('variables');
    await profile.save();
    return NextResponse.json({ success: true, links });
  } catch (e) { return errorResponse(e); }
}
