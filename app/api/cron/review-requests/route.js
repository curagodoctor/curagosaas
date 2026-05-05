import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ReviewRequest from '@/models/ReviewRequest';
import ReviewRequestTemplate from '@/models/ReviewRequestTemplate';
import GmbConnection from '@/models/GmbConnection';
import Doctor from '@/models/Doctor';

/**
 * GET /api/cron/review-requests
 * Cron job to send pending review requests via WhatsApp
 * Should be called every 15 minutes via Vercel Cron or external scheduler
 */
export async function GET(request) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find requests ready to send
    const requests = await ReviewRequest.findReadyToSend()
      .populate('doctorId', 'name displayName whatsappNumber wyltoWebhookId')
      .populate('gmbConnectionId', 'businessName locationName');

    if (requests.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No review requests to send',
        sent: 0,
      });
    }

    let sent = 0;
    let failed = 0;
    const results = [];

    for (const request of requests) {
      try {
        const doctor = request.doctorId;
        const connection = request.gmbConnectionId;

        if (!doctor || !connection) {
          throw new Error('Missing doctor or connection data');
        }

        // Build message from template
        const message = buildMessage(request.messageTemplate, {
          patientName: request.patientName,
          doctorName: doctor.displayName || doctor.name,
          clinicName: connection.businessName || connection.locationName,
          interceptorLink: `${process.env.NEXT_PUBLIC_APP_URL}/review/${request.trackingId}`,
        });

        // Send via WhatsApp (WYLTO API)
        if (request.channel === 'whatsapp') {
          await sendWhatsAppMessage(
            request.patientPhone,
            message,
            doctor.wyltoWebhookId
          );
        }
        // TODO: Add SMS and email support

        // Update request status
        request.status = 'sent';
        request.sentAt = new Date();
        request.sentMessage = message;
        request.lastError = null;
        await request.save();

        // Update template usage
        await ReviewRequestTemplate.updateOne(
          { doctorId: doctor._id, message: request.messageTemplate },
          { $inc: { timesUsed: 1 } }
        );

        sent++;
        results.push({ id: request._id, status: 'sent' });

      } catch (sendError) {
        console.error(`[Review Cron] Failed to send request ${request._id}:`, sendError);

        request.retryCount += 1;
        request.lastError = sendError.message;

        // Mark as failed after 3 retries
        if (request.retryCount >= 3) {
          request.status = 'failed';
        }

        await request.save();
        failed++;
        results.push({ id: request._id, status: 'failed', error: sendError.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${requests.length} review requests`,
      sent,
      failed,
      results,
    });

  } catch (error) {
    console.error('[Review Cron] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Cron job failed' },
      { status: 500 }
    );
  }
}

/**
 * Build message from template with variable substitution
 */
function buildMessage(template, variables) {
  let message = template;

  Object.entries(variables).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  });

  return message;
}

/**
 * Send WhatsApp message via WYLTO API
 */
async function sendWhatsAppMessage(phone, message, webhookId) {
  const apiKey = process.env.WYLTO_OTP_API_KEY;

  if (!apiKey) {
    throw new Error('WYLTO API key not configured');
  }

  // Format phone number
  let formattedPhone = phone.replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '91' + formattedPhone.slice(1);
  } else if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
    formattedPhone = '91' + formattedPhone;
  }

  // Send via WYLTO API
  const response = await fetch('https://api.wylto.com/v1/messages/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      to: formattedPhone,
      type: 'text',
      text: { body: message },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `WYLTO API error: ${response.status}`);
  }

  return response.json();
}

// Allow POST as well for flexibility
export async function POST(request) {
  return GET(request);
}
