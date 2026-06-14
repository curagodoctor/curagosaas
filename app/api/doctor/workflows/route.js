import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Workflow from '@/models/Workflow';
import MessageTemplate from '@/models/MessageTemplate';
import { requireDoctorAuth } from '@/lib/doctorAuth';

export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    let workflows = await Workflow.find({ doctorId: doctor._id })
      .populate('steps.templateId', 'name channel body')
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    // Auto-create default workflow if none exist
    if (workflows.length === 0) {
      let templates = await MessageTemplate.find({ doctorId: doctor._id }).lean();
      if (templates.length === 0) {
        await MessageTemplate.createDefaultsForDoctor(doctor._id);
        templates = await MessageTemplate.find({ doctorId: doctor._id }).lean();
      }

      const smsTemplate = templates.find(t => t.channel === 'sms');
      const emailTemplate = templates.find(t => t.channel === 'email');

      if (smsTemplate && emailTemplate) {
        await Workflow.createDefaultsForDoctor(doctor._id, smsTemplate._id, emailTemplate._id);
        workflows = await Workflow.find({ doctorId: doctor._id })
          .populate('steps.templateId', 'name channel body')
          .sort({ isDefault: -1, createdAt: -1 })
          .lean();
      }
    }

    return NextResponse.json({ success: true, workflows });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Workflows GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const { name, description, steps } = await request.json();

    if (!name || !steps || steps.length === 0) {
      return NextResponse.json({ success: false, error: 'Name and at least one step are required' }, { status: 400 });
    }

    const workflow = await Workflow.create({
      doctorId: doctor._id,
      name,
      description,
      steps,
    });

    return NextResponse.json({ success: true, workflow }, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Workflows POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to create workflow' }, { status: 500 });
  }
}
