import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import connectDB from '@/lib/mongodb';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';
import { getOptimizationAccessState, hasActiveOptimizationSubscription } from '@/lib/practice-os/access';

// Direct per-doctor control of Dominate Organic Search access (no access-request
// needed) — so admins can grant/extend/revoke 7-day or 28-day access, or make it
// permanent (founder-style comp), from the unified doctor page.
const DAY = 24 * 60 * 60 * 1000;

export async function GET(request, { params }) {
  const { authenticated } = await requirePlatformAdmin();
  if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const profile = await PracticeOsProfile.findOne({ doctorId: id }).select('optimizationAccess').lean();
  const oa = profile?.optimizationAccess || {};
  const [state, subscribed] = await Promise.all([
    getOptimizationAccessState(id).catch(() => null),
    hasActiveOptimizationSubscription(id).catch(() => false),
  ]);
  const now = Date.now();
  const expiresAt = oa.expiresAt ? new Date(oa.expiresAt) : null;
  const grantedAt = oa.grantedAt ? new Date(oa.grantedAt) : null;
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - now) / DAY) : null;
  const grantLengthDays = grantedAt && expiresAt ? Math.round((expiresAt.getTime() - grantedAt.getTime()) / DAY) : null;
  return NextResponse.json({
    success: true,
    granted: !!oa.granted,
    permanent: !!oa.permanent,
    subscribed, // active ₹5,000/mo subscription
    grantedAt: oa.grantedAt || null,
    expiresAt: oa.expiresAt || null,
    daysLeft,
    grantLengthDays, // 7 or 28 (the original grant length), if a dated grant
    phase: state?.phase || 'none', // active | grace | locked | none
  });
}

export async function POST(request, { params }) {
  const { authenticated } = await requirePlatformAdmin();
  if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const { action, days } = await request.json();
  const durationDays = [7, 28].includes(Number(days)) ? Number(days) : 28;
  if (!['grant', 'extend', 'permanent', 'revoke'].includes(action)) {
    return NextResponse.json({ success: false, error: 'Bad action' }, { status: 400 });
  }
  const now = new Date();
  const profile = await PracticeOsProfile.findOne({ doctorId: id }).select('optimizationAccess').lean();
  const curExpiry = profile?.optimizationAccess?.expiresAt ? new Date(profile.optimizationAccess.expiresAt) : null;

  let set;
  if (action === 'grant') {
    set = { 'optimizationAccess.granted': true, 'optimizationAccess.grantedAt': now, 'optimizationAccess.expiresAt': new Date(now.getTime() + durationDays * DAY), 'optimizationAccess.permanent': false };
  } else if (action === 'extend') {
    const base = curExpiry && curExpiry > now ? curExpiry : now;
    set = { 'optimizationAccess.granted': true, 'optimizationAccess.expiresAt': new Date(base.getTime() + durationDays * DAY), 'optimizationAccess.permanent': false };
  } else if (action === 'permanent') {
    set = { 'optimizationAccess.granted': true, 'optimizationAccess.permanent': true };
  } else { // revoke
    set = { 'optimizationAccess.granted': false, 'optimizationAccess.permanent': false, 'optimizationAccess.expiresAt': null };
  }
  await PracticeOsProfile.findOneAndUpdate({ doctorId: id }, { $set: set }, { upsert: true, setDefaultsOnInsert: true });
  return NextResponse.json({ success: true });
}
