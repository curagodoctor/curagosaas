import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';
import Doctor from '@/models/Doctor';
import PracticeOsEnrollment from '@/models/practice-os/PracticeOsEnrollment';
import UserMissionProgress from '@/models/practice-os/UserMissionProgress';
import PerformanceScore from '@/models/practice-os/PerformanceScore';
import Mission from '@/models/practice-os/Mission';
import KpiEntry from '@/models/practice-os/KpiEntry';
import JourneyTimeline from '@/models/practice-os/JourneyTimeline';
import Framework from '@/models/practice-os/Framework';
import PracticeOsPurchase from '@/models/practice-os/PracticeOsPurchase';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import { grantPracticeOsAccess, revokePracticeOsAccess, revokePurchaseById, revokeAllPracticeOsAccess } from '@/lib/practice-os/grant';

export const runtime = 'nodejs';

// GET /api/platform/practice-os/users/[id] — full per-doctor Practice OS record.
export async function GET(request, { params }) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const { id } = await params;

    const doctor = await Doctor.findById(id)
      .select('name email specialization qualification subdomain phone')
      .lean();
    if (!doctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }

    const [enrollment, progressRaw, performance, kpis, journey] = await Promise.all([
      PracticeOsEnrollment.findOne({ doctorId: id }).lean(),
      UserMissionProgress.find({ doctorId: id }).lean(),
      PerformanceScore.findOne({ doctorId: id }).lean(),
      KpiEntry.find({ doctorId: id }).sort({ recordedAt: 1 }).lean(),
      JourneyTimeline.find({ doctorId: id }).sort({ occurredAt: -1 }).lean(),
    ]);

    // Join progress with mission title/number.
    const missionIds = progressRaw.map((p) => p.missionId).filter(Boolean);
    const missions = await Mission.find({ _id: { $in: missionIds } })
      .select('missionText category missionNumber dayNumber weekNumber estimatedMinutes')
      .lean();
    const missionById = new Map(missions.map((m) => [String(m._id), m]));

    const progress = progressRaw
      .map((p) => {
        const m = missionById.get(String(p.missionId)) || {};
        return {
          _id: String(p._id),
          missionId: String(p.missionId),
          title: m.missionText || m.category || 'Untitled mission',
          missionNumber: m.missionNumber || 0,
          dayNumber: m.dayNumber || 0,
          weekNumber: m.weekNumber || 0,
          estimatedMinutes: m.estimatedMinutes || 0,
          status: p.status,
          actualMinutes: p.actualMinutes || 0,
          completedAt: p.completedAt || null,
          unlockedAt: p.unlockedAt || null,
        };
      })
      .sort((a, b) => a.missionNumber - b.missionNumber);

    // Access management: all packs + which the doctor currently owns (paid).
    const [allPacks, purchases] = await Promise.all([
      Framework.find({ isActive: true }).select('title priceInInr isPublished').sort({ order: 1, createdAt: 1 }).lean(),
      PracticeOsPurchase.find({ doctorId: id, status: 'completed' }).select('frameworkId amountInInr createdAt').lean(),
    ]);
    const ownedPackIds = purchases.map((p) => String(p.frameworkId)).filter(Boolean);

    // Ghost entitlements: completed purchases whose pack no longer exists (hard
    // deleted) or that never had a pack. These aren't selectable by frameworkId
    // in the Remove dropdown, so surface them for one-click cleanup.
    const purchasedFwIds = purchases.map((p) => p.frameworkId).filter(Boolean);
    const existingFw = purchasedFwIds.length
      ? await Framework.find({ _id: { $in: purchasedFwIds } }).select('_id').lean()
      : [];
    const existingFwIds = new Set(existingFw.map((f) => String(f._id)));
    const ghostPurchases = purchases
      .filter((p) => !p.frameworkId || !existingFwIds.has(String(p.frameworkId)))
      .map((p) => ({
        id: String(p._id),
        frameworkId: p.frameworkId ? String(p.frameworkId) : null,
        amountInInr: p.amountInInr || 0,
        createdAt: p.createdAt || null,
      }));

    return NextResponse.json({
      success: true,
      doctor,
      enrollment: enrollment || null,
      progress,
      performance: performance || null,
      kpis,
      journey,
      packs: allPacks.map((p) => ({ id: String(p._id), title: p.title, priceInInr: p.priceInInr || 0, isPublished: !!p.isPublished })),
      ownedPackIds,
      ghostPurchases,
    });
  } catch (error) {
    console.error('[Practice OS user detail GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load doctor record' }, { status: 500 });
  }
}

// POST /api/platform/practice-os/users/[id] — grant or remove pack access.
// body: { action: 'grant' | 'revoke', frameworkId }
export async function POST(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const { action, frameworkId, purchaseId } = await request.json();

    // Clear a specific ghost/deleted-pack purchase by its id.
    if (action === 'revoke-purchase') {
      if (!purchaseId) return NextResponse.json({ success: false, error: 'Missing purchase' }, { status: 400 });
      await revokePurchaseById(id, purchaseId);
      return NextResponse.json({ success: true, revoked: true });
    }
    // Remove every pack entitlement for this doctor.
    if (action === 'revoke-all') {
      await revokeAllPracticeOsAccess(id);
      return NextResponse.json({ success: true, revoked: true });
    }

    if (!frameworkId) return NextResponse.json({ success: false, error: 'Missing pack' }, { status: 400 });

    if (action === 'grant') {
      await grantPracticeOsAccess(id, frameworkId, {
        paymentId: `admin_${id}_${frameworkId}_${Date.now()}`,
        amountInInr: 0,
      });
      return NextResponse.json({ success: true, granted: true });
    }
    if (action === 'revoke') {
      await revokePracticeOsAccess(id, frameworkId);
      return NextResponse.json({ success: true, revoked: true });
    }
    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Practice OS user access POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to update access' }, { status: 500 });
  }
}
