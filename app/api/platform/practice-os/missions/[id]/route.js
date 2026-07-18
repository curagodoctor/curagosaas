import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie, requirePlatformAdmin } from '@/lib/platformAdminAuth';
import Mission from '@/models/practice-os/Mission';

// GET /api/platform/practice-os/missions/[id]
export async function GET(request, { params }) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const { id } = await params;
    const mission = await Mission.findById(id).lean();
    if (!mission) return NextResponse.json({ success: false, error: 'Mission not found' }, { status: 404 });
    return NextResponse.json({ success: true, mission });
  } catch (error) {
    console.error('[Practice OS Mission GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load mission' }, { status: 500 });
  }
}

// Fields an admin may edit on a mission.
const EDITABLE = [
  'weekNumber', 'dayNumber', 'missionNumber', 'category', 'purpose', 'missionText',
  'education', 'buttons', 'aiContext', 'evidence', 'reflection', 'reward',
  'kpiFields', 'completionRules', 'unlockDelayDays', 'isActive', 'status',
];

// PATCH /api/platform/practice-os/missions/[id]
export async function PATCH(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const update = {};
    for (const key of EDITABLE) {
      if (key in body) update[key] = body[key];
    }

    const mission = await Mission.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
    if (!mission) return NextResponse.json({ success: false, error: 'Mission not found' }, { status: 404 });
    return NextResponse.json({ success: true, mission });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Practice OS Mission PATCH]', error);
    return NextResponse.json({ success: false, error: 'Failed to update mission' }, { status: 500 });
  }
}

// DELETE /api/platform/practice-os/missions/[id]
export async function DELETE(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const { id } = await params;
    await Mission.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Practice OS Mission DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete mission' }, { status: 500 });
  }
}
