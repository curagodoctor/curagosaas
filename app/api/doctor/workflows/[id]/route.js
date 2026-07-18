import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Workflow from '@/models/Workflow';
import MessageTemplate from '@/models/MessageTemplate';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { requireFeatureOr403, FEATURES } from '@/lib/entitlements';

export async function PATCH(request, { params }) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const locked = await requireFeatureOr403(doctor._id, FEATURES.WORKFLOWS);
    if (locked) return locked;

    const { id } = await params;
    const body = await request.json();

    const workflow = await Workflow.findOne({ _id: id, doctorId: doctor._id });
    if (!workflow) {
      return NextResponse.json({ success: false, error: 'Workflow not found' }, { status: 404 });
    }

    // Coerce step templateIds to valid templates. A step can arrive with a
    // missing/orphaned templateId (e.g. its template was deleted), which would
    // otherwise fail validation. Fall back to the doctor's template for that channel.
    if (Array.isArray(body.steps)) {
      let templates = await MessageTemplate.find({ doctorId: doctor._id }).lean();
      if (templates.length === 0) {
        await MessageTemplate.createDefaultsForDoctor(doctor._id);
        templates = await MessageTemplate.find({ doctorId: doctor._id }).lean();
      }
      const validIds = new Set(templates.map((t) => String(t._id)));
      const byChannel = {
        sms: templates.find((t) => t.channel === 'sms')?._id,
        email: templates.find((t) => t.channel === 'email')?._id,
      };
      body.steps = body.steps.map((s) => {
        let templateId = s.templateId;
        if (!templateId || !validIds.has(String(templateId))) {
          templateId = byChannel[s.channel] || byChannel.sms || byChannel.email;
        }
        return { ...s, templateId };
      });
    }

    const allowedFields = ['name', 'description', 'steps', 'isActive'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        workflow[field] = body[field];
      }
    }

    await workflow.save();
    return NextResponse.json({ success: true, workflow });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Workflows PATCH]', error);
    return NextResponse.json({ success: false, error: 'Failed to update workflow' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const locked = await requireFeatureOr403(doctor._id, FEATURES.WORKFLOWS);
    if (locked) return locked;

    const { id } = await params;

    // Any workflow (including seeded defaults) can be deleted; the doctor's
    // workflowsInitialized flag prevents deleted defaults from regenerating.
    const result = await Workflow.findOneAndDelete({ _id: id, doctorId: doctor._id });
    if (!result) {
      return NextResponse.json({ success: false, error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Workflows DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete workflow' }, { status: 500 });
  }
}
