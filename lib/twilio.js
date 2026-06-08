const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Format phone number to E.164 (+91XXXXXXXXXX)
function formatPhoneNumber(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  return `+91${cleaned}`;
}

export async function sendSMS(to, body) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn('[Twilio] Not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in env.');
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const formattedPhone = formatPhoneNumber(to);
    if (!formattedPhone) {
      return { success: false, error: 'Invalid phone number' };
    }

    const message = await client.messages.create({
      body,
      from: TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    return {
      success: true,
      data: { sid: message.sid, status: message.status },
    };
  } catch (error) {
    console.error('[Twilio] Send SMS error:', error.message);
    return { success: false, error: error.message };
  }
}
