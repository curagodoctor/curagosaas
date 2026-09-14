import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';
import PracticeOsAccessRequest from '@/models/practice-os/PracticeOsAccessRequest';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';

export const runtime = 'nodejs';

// GET — list access requests (newest first). ?status=pending to filter.
export async function GET(request) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const status = new URL(request.url).searchParams.get('status');
    const q = status ? { status } : {};
    const requests = await PracticeOsAccessRequest.find(q).sort({ createdAt: -1 }).limit(200).lean();
    // Enrich with each doctor's live access (expiry / permanent) so admin sees state.
    const ids = [...new Set(requests.map((r) => String(r.doctorId)))];
    const profiles = await PracticeOsProfile.find({ doctorId: { $in: ids } }).select('doctorId optimizationAccess').lean();
    const byDoctor = Object.fromEntries(profiles.map((p) => [String(p.doctorId), p.optimizationAccess || {}]));
    const enriched = requests.map((r) => ({ ...r, access: byDoctor[String(r.doctorId)] || {} }));
    return NextResponse.json({ success: true, requests: enriched });
  } catch (error) {
    console.error('[access-requests GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load requests' }, { status: 500 });
  }
}

// PUT — decide a request: { id, action: 'grant' | 'deny' }. Granting flips the
// doctor's optimizationAccess (the boundary the doctor-side gate reads).
export async function PUT(request) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const { id, action } = await request.json();
    // grant = 30-day access · extend = +30 more days · permanent = never expires
    // (founder override) · deny/revoke = gate again.
    if (!id || !['grant', 'extend', 'permanent', 'deny'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Bad request' }, { status: 400 });
    }
    const req = await PracticeOsAccessRequest.findById(id);
    if (!req) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const now = new Date();
    const DAY = 24 * 60 * 60 * 1000;
    req.status = action === 'deny' ? 'denied' : 'granted';
    req.decidedAt = now;
    req.decidedBy = admin.email || admin.name || 'admin';
    await req.save();

    const profile = await PracticeOsProfile.findOne({ doctorId: req.doctorId }).select('optimizationAccess').lean();
    const curExpiry = profile?.optimizationAccess?.expiresAt ? new Date(profile.optimizationAccess.expiresAt) : null;

    let set;
    if (action === 'grant') {
      set = { 'optimizationAccess.granted': true, 'optimizationAccess.grantedAt': now, 'optimizationAccess.expiresAt': new Date(now.getTime() + 30 * DAY), 'optimizationAccess.permanent': false };
    } else if (action === 'extend') {
      // Add 30 days from whichever is later — now or the current expiry.
      const base = curExpiry && curExpiry > now ? curExpiry : now;
      set = { 'optimizationAccess.granted': true, 'optimizationAccess.expiresAt': new Date(base.getTime() + 30 * DAY), 'optimizationAccess.permanent': false };
    } else if (action === 'permanent') {
      set = { 'optimizationAccess.granted': true, 'optimizationAccess.permanent': true };
    } else { // deny / revoke
      set = { 'optimizationAccess.granted': false, 'optimizationAccess.permanent': false, 'optimizationAccess.expiresAt': null };
    }
    await PracticeOsProfile.findOneAndUpdate({ doctorId: req.doctorId }, { $set: set }, { upsert: true, setDefaultsOnInsert: true });

    return NextResponse.json({ success: true, status: req.status });
  } catch (error) {
    console.error('[access-requests PUT]', error);
    return NextResponse.json({ success: false, error: 'Failed to update request' }, { status: 500 });
  }
}
