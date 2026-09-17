import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import PracticeOsDiseaseCluster from '@/models/practice-os/PracticeOsDiseaseCluster';

export const runtime = 'nodejs';

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// PUT — update name / treatments / approved for one cluster (owned only).
export async function PUT(request, { params }) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const update = {};
    if (typeof body.name === 'string' && body.name.trim()) { update.name = body.name.trim(); update.slug = slugify(body.name); }
    if (Array.isArray(body.treatments)) {
      update.treatments = body.treatments
        .map((t) => (typeof t === 'string' ? { name: t, source: 'manual' } : { name: String(t?.name || '').trim(), source: ['profile', 'ai', 'manual'].includes(t?.source) ? t.source : 'manual' }))
        .filter((t) => t.name);
    }
    if (typeof body.approved === 'boolean') {
      update.approved = body.approved;
      update.approvedAt = body.approved ? new Date() : null;
    }
    const cluster = await PracticeOsDiseaseCluster.findOneAndUpdate(
      { _id: id, doctorId: doctor._id }, { $set: update }, { new: true },
    ).lean();
    if (!cluster) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, cluster });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[clusters PUT]', error);
    return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 });
  }
}

// DELETE — remove a cluster (owned only).
export async function DELETE(request, { params }) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { id } = await params;
    const res = await PracticeOsDiseaseCluster.deleteOne({ _id: id, doctorId: doctor._id });
    if (res.deletedCount === 0) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[clusters DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
  }
}
