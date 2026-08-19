import { Resend } from 'resend';
import { sendSMS } from './twilio';
import connectDB from './mongodb';
import MessageLog from '@/models/MessageLog';
import MessageQuota from '@/models/MessageQuota';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'Curago <noreply@curago.in>';

// Replace {{variable}} placeholders in a template string
export function resolveVariables(template, variables = {}) {
  if (!template) return '';
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : '';
  });
}

// Send a single message (SMS or email) and log it
export async function sendMessage({ channel, to, subject, body, doctorId, contactId, templateId }) {
  await connectDB();

  // Create log entry
  const log = new MessageLog({
    doctorId,
    contactId,
    channel,
    templateId,
    to,
    subject,
    body,
    status: 'pending',
  });
  await log.save();

  let result;

  if (channel === 'sms') {
    result = await sendSMS(to, body);
  } else if (channel === 'email') {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: subject || 'Message from your doctor',
        html: wrapInEmailTemplate(body),
      });

      if (error) {
        result = { success: false, error: error.message };
      } else {
        result = { success: true, data: { id: data.id } };
      }
    } catch (error) {
      result = { success: false, error: error.message };
    }
  } else {
    result = { success: false, error: `Unsupported channel: ${channel}` };
  }

  // Update log with result
  if (result.success) {
    log.status = 'sent';
    log.sentAt = new Date();
    log.externalId = result.data?.sid || result.data?.id || null;
  } else {
    log.status = 'failed';
    log.error = result.error;
  }
  await log.save();

  return {
    success: result.success,
    messageLogId: log._id,
    externalId: log.externalId,
    error: result.error,
  };
}

// Send messages to multiple contacts with quota checking
export async function sendBulkMessages({ contacts, template, channel, doctor }) {
  await connectDB();

  const results = { sent: 0, failed: 0, errors: [] };

  for (const contact of contacts) {
    // Check quota before each send
    const quota = await MessageQuota.checkQuota(doctor._id, channel);
    if (!quota.allowed) {
      results.errors.push({ contactId: contact._id, error: 'Quota exceeded' });
      results.failed++;
      continue;
    }

    const to = channel === 'sms' ? contact.phone : contact.email;
    if (!to) {
      results.errors.push({ contactId: contact._id, error: `No ${channel === 'sms' ? 'phone' : 'email'} for contact` });
      results.failed++;
      continue;
    }

    // Resolve template variables
    const variables = {
      name: contact.name || '',
      phone: contact.phone || '',
      reviewLink: contact.googleReviewLink || doctor.googleReviewLink || '',
      clinicName: doctor.clinicName || doctor.displayName || doctor.name,
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
      results.sent++;
    } else {
      results.errors.push({ contactId: contact._id, error: result.error });
      results.failed++;
    }
  }

  return results;
}

// Wrap plain text in a simple HTML email template
function wrapInEmailTemplate(bodyText) {
  const htmlBody = bodyText.replace(/\n/g, '<br>');
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="color: #333; font-size: 16px; line-height: 1.6;">
            ${htmlBody}
          </div>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          Sent via <span style="color: #096b17;">CuraGo</span>
        </p>
      </div>
    </body>
    </html>
  `;
}
