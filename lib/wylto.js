// Wylto WhatsApp webhooks. Each webhook triggers a pre-built WhatsApp flow on
// Wylto's side; we just POST { name, phoneNumber } (plus any extra template
// variables). URLs default to the provided endpoints but can be overridden via
// env without a code change.
const WEBHOOKS = {
  reviewRequest: process.env.WYLTO_WEBHOOK_REVIEW || 'https://server.wylto.com/webhook/V8KzWVBlZtU7OuI00k',
  appointmentBooked: process.env.WYLTO_WEBHOOK_BOOKED || 'https://server.wylto.com/webhook/kbCfoW0JydD0eSsebV',
  appointmentReminder: process.env.WYLTO_WEBHOOK_REMINDER || 'https://server.wylto.com/webhook/WPOT44tB5qQiyllzxk',
};

// Normalize an Indian phone number to E.164 (+91XXXXXXXXXX) as the webhook expects.
export function toE164(phone) {
  const cleaned = String(phone || '').replace(/\D/g, '');
  if (!cleaned) return '';
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith('0')) return `+91${cleaned.slice(1)}`;
  return `+${cleaned}`;
}

/**
 * Fire a Wylto webhook. Best-effort — never throws.
 * @param {'reviewRequest'|'appointmentBooked'|'appointmentReminder'} type
 * @param {{ name?: string, phoneNumber: string, [k:string]: any }} payload
 */
export async function fireWyltoWebhook(type, { name, phoneNumber, ...extra } = {}) {
  const url = WEBHOOKS[type];
  const phone = toE164(phoneNumber);
  if (!url || !phone) {
    console.error(`[Wylto ${type}] NOT SENT — missing ${!url ? 'webhook URL' : 'phone number'} (phoneNumber="${phoneNumber}")`);
    return { success: false, error: 'Missing webhook or phone number' };
  }
  const payload = { name: name || '', phoneNumber: phone, ...extra };
  console.log(`[Wylto ${type}] → sending to ${phone}`, JSON.stringify(payload));
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    // Read Wylto's response so we can see exactly what it says (200 ≠ delivered).
    let body = '';
    try { body = (await res.text()).slice(0, 500); } catch { /* ignore */ }
    if (!res.ok) {
      console.error(`[Wylto ${type}] ✗ HTTP ${res.status} — response: ${body}`);
      return { success: false, error: `HTTP ${res.status}`, status: res.status, body };
    }
    console.log(`[Wylto ${type}] ✓ HTTP ${res.status} — Wylto accepted trigger. Response: ${body || '(empty)'}`);
    return { success: true, status: res.status, body };
  } catch (e) {
    console.error(`[Wylto ${type}] ✗ request failed:`, e.message);
    return { success: false, error: e.message };
  }
}
