import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import connectDB from '@/lib/mongodb';
import { restartDoctorTasks } from '@/lib/practice-os/adminTasks';

export const runtime = 'nodejs';

// POST /api/platform/doctors/<id>/restart-tasks — admin override: reset the
// doctor's Practice OS task progress so they begin from Day 1 again. Published
// content, scores and history are left intact.
export async function POST(request, { params }) {
  const { authenticated } = await requirePlatformAdmin();
  if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await connectDB();
  try {
    const result = await restartDoctorTasks(id);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[restart-tasks]', error);
    return NextResponse.json({ success: false, error: 'Could not restart tasks.' }, { status: 500 });
  }
}
