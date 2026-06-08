import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkflowExecution from '@/models/WorkflowExecution';
import Clinic from '@/models/Clinic';
import MessageQuota from '@/models/MessageQuota';
import { sendMessage, resolveVariables } from '@/lib/messaging';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const executions = await WorkflowExecution.findReadyToProcess();

    if (executions.length === 0) {
      return NextResponse.json({ success: true, message: 'No workflows to process', processed: 0 });
    }

    let processed = 0;
    let failed = 0;
    const results = [];

    for (const execution of executions) {
      try {
        const workflow = execution.workflowId;
        const contact = execution.contactId;
        const doctor = execution.doctorId;

        if (!workflow || !contact || !doctor) {
          execution.status = 'failed';
          execution.logs.push({ stepIndex: execution.currentStepIndex, channel: 'unknown', status: 'failed', sentAt: new Date(), error: 'Missing data' });
          await execution.save();
          failed++;
          continue;
        }

        const sortedSteps = workflow.steps.sort((a, b) => a.stepOrder - b.stepOrder);
        const currentStep = sortedSteps[execution.currentStepIndex];

        if (!currentStep) {
          execution.status = 'completed';
          execution.completedAt = new Date();
          await execution.save();
          processed++;
          continue;
        }

        // Populate template
        await execution.populate('workflowId');
        const step = execution.workflowId.steps.sort((a, b) => a.stepOrder - b.stepOrder)[execution.currentStepIndex];

        // Need to populate the templateId
        const MessageTemplate = (await import('@/models/MessageTemplate')).default;
        const template = await MessageTemplate.findById(step.templateId);

        if (!template) {
          execution.logs.push({ stepIndex: execution.currentStepIndex, channel: step.channel, status: 'failed', sentAt: new Date(), error: 'Template not found' });
          execution.status = 'failed';
          await execution.save();
          failed++;
          continue;
        }

        const channel = step.channel;
        const to = channel === 'sms' ? contact.phone : contact.email;

        if (!to) {
          execution.logs.push({ stepIndex: execution.currentStepIndex, channel, status: 'skipped', sentAt: new Date(), error: `No ${channel === 'sms' ? 'phone' : 'email'} for contact` });
          // Skip this step but continue workflow
        } else {
          // Check quota
          const quota = await MessageQuota.checkQuota(doctor._id, channel);
          if (!quota.allowed) {
            execution.logs.push({ stepIndex: execution.currentStepIndex, channel, status: 'failed', sentAt: new Date(), error: 'Quota exceeded' });
          } else {
            const clinic = await Clinic.findOne({ doctorId: doctor._id, isActive: true }).sort({ isPrimary: -1 }).lean();
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

            execution.logs.push({
              stepIndex: execution.currentStepIndex,
              channel,
              status: result.success ? 'sent' : 'failed',
              sentAt: new Date(),
              error: result.error || undefined,
            });
          }
        }

        // Advance to next step or complete
        const nextStepIndex = execution.currentStepIndex + 1;
        if (nextStepIndex < sortedSteps.length) {
          execution.currentStepIndex = nextStepIndex;
          const nextStep = sortedSteps[nextStepIndex];
          const nextRun = new Date();
          nextRun.setDate(nextRun.getDate() + nextStep.delayDays);
          execution.nextRunAt = nextRun;
        } else {
          execution.status = 'completed';
          execution.completedAt = new Date();
        }

        await execution.save();
        processed++;
        results.push({ id: execution._id, status: execution.status });
      } catch (stepError) {
        console.error(`[Workflow Cron] Error processing ${execution._id}:`, stepError);
        execution.logs.push({ stepIndex: execution.currentStepIndex, channel: 'unknown', status: 'failed', sentAt: new Date(), error: stepError.message });
        await execution.save();
        failed++;
        results.push({ id: execution._id, status: 'error', error: stepError.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${executions.length} workflow executions`,
      processed,
      failed,
      results,
    });
  } catch (error) {
    console.error('[Workflow Cron] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  return GET(request);
}
