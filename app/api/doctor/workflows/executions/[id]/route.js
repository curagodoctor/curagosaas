import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkflowExecution from '@/models/WorkflowExecution';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { requireFeatureOr403, FEATURES } from '@/lib/entitlements';

export const runtime = 'nodejs';

// DELETE /api/doctor/workflows/executions/[id]
// Stop (cancel) a workflow that's running/paused for a contact, so the doctor can
// remove it or start a different one. Scoped to the authenticated doctor.
export async function DELETE(request, { params }) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const locked = await requireFeatureOr403(doctor._id, FEATURES.WORKFLOWS);
    if (locked) return locked;

    const { id } = await params;
    const result = await WorkflowExecution.findOneAndUpdate(
      { _id: id, doctorId: doctor._id, status: { $in: ['active', 'paused'] } },
      { $set: { status: 'cancelled' } },
      { new: true }
    );
    if (!result) {
      return NextResponse.json({ success: false, error: 'Workflow not found or already ended' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Execution cancel]', error);
    return NextResponse.json({ success: false, error: 'Failed to stop workflow' }, { status: 500 });
  }
}
