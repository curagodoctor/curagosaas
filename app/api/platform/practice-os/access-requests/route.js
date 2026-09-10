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
    return NextResponse.json({ success: true, requests });
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
    if (!id || !['grant', 'deny'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Bad request' }, { status: 400 });
    }
    const req = await PracticeOsAccessRequest.findById(id);
    if (!req) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    req.status = action === 'grant' ? 'granted' : 'denied';
    req.decidedAt = new Date();
    req.decidedBy = admin.email || admin.name || 'admin';
    await req.save();

    if (action === 'grant') {
      await PracticeOsProfile.findOneAndUpdate(
        { doctorId: req.doctorId },
        { $set: { 'optimizationAccess.granted': true, 'optimizationAccess.grantedAt': new Date() } },
        { upsert: true, setDefaultsOnInsert: true },
      );
    } else {
      // Revoke on explicit deny so a previously-granted doctor can be gated again.
      await PracticeOsProfile.findOneAndUpdate(
        { doctorId: req.doctorId },
        { $set: { 'optimizationAccess.granted': false, 'optimizationAccess.grantedAt': null } },
      );
    }

    return NextResponse.json({ success: true, status: req.status });
  } catch (error) {
    console.error('[access-requests PUT]', error);
    return NextResponse.json({ success: false, error: 'Failed to update request' }, { status: 500 });
  }
}
