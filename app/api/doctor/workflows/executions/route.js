import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkflowExecution from '@/models/WorkflowExecution';
import Workflow from '@/models/Workflow';
import Contact from '@/models/Contact';
import { requireDoctorAuth } from '@/lib/doctorAuth';

export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query = { doctorId: doctor._id };
    if (contactId) query.contactId = contactId;
    if (status) query.status = status;

    const [executions, total] = await Promise.all([
      WorkflowExecution.find(query)
        .populate('workflowId', 'name')
        .populate('contactId', 'name phone email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      WorkflowExecution.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      executions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Executions GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch executions' }, { status: 500 });
  }
}
