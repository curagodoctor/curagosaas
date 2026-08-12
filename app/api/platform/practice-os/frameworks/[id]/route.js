import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie, requirePlatformAdmin } from '@/lib/platformAdminAuth';
import Framework from '@/models/practice-os/Framework';
import Module from '@/models/practice-os/Module';
import Mission from '@/models/practice-os/Mission';
import PracticeOsEnrollment from '@/models/practice-os/PracticeOsEnrollment';
import UserMissionProgress from '@/models/practice-os/UserMissionProgress';

// GET /api/platform/practice-os/frameworks/[id] — framework + its modules + missions.
export async function GET(request, { params }) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const { id } = await params;
    const framework = await Framework.findById(id).lean();
    if (!framework) {
      return NextResponse.json({ success: false, error: 'Framework not found' }, { status: 404 });
    }

    const [modules, missions] = await Promise.all([
      Module.find({ frameworkId: id }).sort({ order: 1 }).lean(),
      Mission.find({ frameworkId: id }).sort({ missionNumber: 1, weekNumber: 1, dayNumber: 1 }).lean(),
    ]);

    return NextResponse.json({ success: true, framework, modules, missions });
  } catch (error) {
    console.error('[Practice OS Framework GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load framework' }, { status: 500 });
  }
}

// PATCH /api/platform/practice-os/frameworks/[id] — update framework fields.
export async function PATCH(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    // Restore a soft-deleted pack: clear deletedAt and reactivate it. (#26)
    if (body.restore) {
      const restored = await Framework.findByIdAndUpdate(
        id, { $set: { deletedAt: null, isActive: true } }, { new: true }
      );
      if (!restored) return NextResponse.json({ success: false, error: 'Framework not found' }, { status: 404 });
      return NextResponse.json({ success: true, framework: restored });
    }

    const allowed = ['title', 'description', 'category', 'coverImage', 'order', 'isActive',
      'tagline', 'summary', 'outcomes', 'priceInInr', 'isPublished'];
    const update = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }
    if ('priceInInr' in update) update.priceInInr = Math.max(0, Number(update.priceInInr) || 0);
    if ('outcomes' in update) {
      update.outcomes = Array.isArray(update.outcomes)
        ? update.outcomes.map((o) => String(o).trim()).filter(Boolean)
        : String(update.outcomes || '').split('\n').map((o) => o.trim()).filter(Boolean);
    }

    const framework = await Framework.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!framework) {
      return NextResponse.json({ success: false, error: 'Framework not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, framework });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Practice OS Framework PATCH]', error);
    return NextResponse.json({ success: false, error: 'Failed to update framework' }, { status: 500 });
  }
}

// DELETE /api/platform/practice-os/frameworks/[id]
//  - default: SOFT delete — hide the pack (and stop reminders) but keep its
//    content + enrollments so it can be restored. (#26)
//  - ?permanent=true: HARD delete + cascade (only meant for an already-deleted
//    pack you want gone for good).
export async function DELETE(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const { id } = await params;
    const permanent = new URL(request.url).searchParams.get('permanent') === 'true';

    if (permanent) {
      await Promise.all([
        Mission.deleteMany({ frameworkId: id }),
        Module.deleteMany({ frameworkId: id }),
        PracticeOsEnrollment.deleteMany({ frameworkId: id }),
        UserMissionProgress.deleteMany({ frameworkId: id }),
        Framework.findByIdAndDelete(id),
      ]);
      return NextResponse.json({ success: true, permanent: true });
    }

    // Soft delete — deletedAt + isActive:false + unpublish hides it from doctors
    // and the reminder cron (which filters deletedAt:null), but nothing is lost.
    const framework = await Framework.findByIdAndUpdate(
      id,
      { $set: { deletedAt: new Date(), isActive: false, isPublished: false } },
      { new: true }
    );
    if (!framework) return NextResponse.json({ success: false, error: 'Framework not found' }, { status: 404 });
    return NextResponse.json({ success: true, softDeleted: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Practice OS Framework DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete framework' }, { status: 500 });
  }
}
