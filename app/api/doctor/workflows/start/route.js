import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Workflow from '@/models/Workflow';
import WorkflowExecution from '@/models/WorkflowExecution';
import Contact from '@/models/Contact';
import Clinic from '@/models/Clinic';
import MessageQuota from '@/models/MessageQuota';
import Subscription from '@/models/Subscription';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { sendMessage, resolveVariables } from '@/lib/messaging';

export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    // Check subscription is active
    const isSubscribed = await Subscription.isActive(doctor._id);
    if (!isSubscribed) {
      return NextResponse.json({
        success: false,
        error: 'SUBSCRIPTION_EXPIRED',
        message: 'Your trial has expired. Please subscribe to continue using workflows.',
      }, { status: 403 });
    }

    const { contactId, workflowId } = await request.json();

    if (!contactId) {
      return NextResponse.json({ success: false, error: 'contactId is required' }, { status: 400 });
    }

    // Verify contact belongs to doctor
    const contact = await Contact.findOne({ _id: contactId, doctorId: doctor._id });
    if (!contact) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    // Check if contact already has an active workflow
    const existing = await WorkflowExecution.getActiveForContact(doctor._id, contactId);
    if (existing) {
      return NextResponse.json({ success: false, error: 'Contact already has an active workflow' }, { status: 400 });
    }

    // Get workflow (default if not specified)
    const query = workflowId
      ? { _id: workflowId, doctorId: doctor._id, isActive: true }
      : { doctorId: doctor._id, isDefault: true, isActive: true };

    const workflow = await Workflow.findOne(query).populate('steps.templateId');
    if (!workflow || workflow.steps.length === 0) {
      return NextResponse.json({ success: false, error: 'No active workflow found' }, { status: 404 });
    }

    const firstStep = workflow.steps.sort((a, b) => a.stepOrder - b.stepOrder)[0];

    // Calculate nextRunAt for the first step
    const now = new Date();
    const nextRunAt = new Date(now);
    nextRunAt.setDate(nextRunAt.getDate() + firstStep.delayDays);

    // Create execution
    const execution = await WorkflowExecution.create({
      doctorId: doctor._id,
      workflowId: workflow._id,
      contactId: contact._id,
      currentStepIndex: 0,
      status: 'active',
      nextRunAt,
      startedAt: now,
    });

    // If Day 0 (no delay), send immediately
    let immediateResult = null;
    if (firstStep.delayDays === 0 && firstStep.templateId) {
      const template = firstStep.templateId;
      const clinic = await Clinic.findOne({ doctorId: doctor._id, isActive: true }).sort({ isPrimary: -1 }).lean();

      const channel = firstStep.channel;
      const to = channel === 'sms' ? contact.phone : contact.email;

      if (to) {
        // Check quota
        const quota = await MessageQuota.checkQuota(doctor._id, channel);
        if (quota.allowed) {
          const variables = {
            name: contact.name || '',
            phone: contact.phone || '',
            reviewLink: contact.googleReviewLink || '',
            clinicName: clinic?.name || doctor.displayName || doctor.name,
            doctorName: doctor.displayName || doctor.name,
          };

          const resolvedBody = resolveVariables(template.body, variables);
          const resolvedSubject = template.subject ? resolveVariables(template.subject, variables) : undefined;

          const result = await sendMessage({
            channel,
            to,
            subject: resolvedSubject,
            body: resolvedBody,
            doctorId: doctor._id,
            contactId: contact._id,
            templateId: template._id,
          });

          if (result.success) {
            await MessageQuota.deductQuota(doctor._id, channel);
          }

          // Log the step result
          execution.logs.push({
            stepIndex: 0,
            channel,
            status: result.success ? 'sent' : 'failed',
            sentAt: new Date(),
            error: result.error || undefined,
          });

          // Advance to next step
          const sortedSteps = workflow.steps.sort((a, b) => a.stepOrder - b.stepOrder);
          if (sortedSteps.length > 1) {
            execution.currentStepIndex = 1;
            const nextStep = sortedSteps[1];
            const nextRun = new Date();
            nextRun.setDate(nextRun.getDate() + nextStep.delayDays);
            execution.nextRunAt = nextRun;
          } else {
            execution.status = 'completed';
            execution.completedAt = new Date();
          }

          await execution.save();
          immediateResult = result;
        }
      }
    }

    // Update contact status to 'review-sent'
    await Contact.findByIdAndUpdate(contact._id, { status: 'review-sent' });

    return NextResponse.json({
      success: true,
      execution: {
        _id: execution._id,
        status: execution.status,
        currentStepIndex: execution.currentStepIndex,
        nextRunAt: execution.nextRunAt,
      },
      immediateMessageSent: immediateResult?.success || false,
    }, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'Contact already has an active workflow' }, { status: 400 });
    }
    console.error('[Workflow Start]', error);
    return NextResponse.json({ success: false, error: 'Failed to start workflow' }, { status: 500 });
  }
}
