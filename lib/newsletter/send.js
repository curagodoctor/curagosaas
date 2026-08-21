import { Resend } from 'resend';
import { getAudience, unsubscribeUrl } from '@/lib/newsletter/audience';
import { renderNewsletterHtml, renderNewsletterText } from '@/lib/newsletter/template';
import NewsletterSettings from '@/models/NewsletterSettings';

const resend = new Resend(process.env.RESEND_API_KEY);
// Newsletters send from the verified Curago sender (noreply@curago.in). An
// optional NEWSLETTER_FROM env var can override it later, but the default is
// always the existing verified address so deliverability is guaranteed.
const FROM = process.env.NEWSLETTER_FROM || process.env.EMAIL_FROM || 'Curago <noreply@curago.in>';

const BATCH_SIZE = 100;   // Resend batch API limit

// A stable UTM campaign slug for a newsletter.
function campaignSlug(newsletter) {
  const base = (newsletter.subject || 'newsletter').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  return base || String(newsletter._id || 'newsletter');
}

function buildMessage(newsletter, recipient, { settings, campaign, replyTo }) {
  const unsub = unsubscribeUrl(recipient.email);
  return {
    from: FROM,
    to: recipient.email,
    subject: newsletter.subject,
    html: renderNewsletterHtml(newsletter, { recipientName: recipient.name, unsubscribeUrl: unsub, settings, campaign }),
    text: renderNewsletterText(newsletter, { unsubscribeUrl: unsub, settings, campaign }),
    ...(replyTo ? { replyTo } : {}),
    // Standards-compliant one-click unsubscribe (Gmail/Outlook honor these).
    headers: {
      'List-Unsubscribe': `<${unsub}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}

async function loadContext(newsletter) {
  let settings = {};
  try { settings = (await NewsletterSettings.get())?.toObject?.() || {}; } catch { /* ignore */ }
  const replyTo = newsletter.replyTo || settings.replyToDefault || process.env.NEWSLETTER_REPLY_TO || '';
  return { settings, campaign: campaignSlug(newsletter), replyTo };
}

/**
 * Send one newsletter to everyone in its segments (deduped, suppression-filtered).
 * Uses Resend's batch API. Returns { recipients, sent, failed, skipped }.
 */
export async function sendNewsletter(newsletter) {
  const { recipients, suppressed } = await getAudience(newsletter.segments);
  const ctx = await loadContext(newsletter);
  let sent = 0, failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE);
    const messages = chunk.map((r) => buildMessage(newsletter, r, ctx));
    try {
      const { data, error } = await resend.batch.send(messages);
      if (error) {
        console.error('[newsletter batch]', error);
        failed += chunk.length;
      } else {
        sent += Array.isArray(data?.data) ? data.data.length : chunk.length;
      }
    } catch (e) {
      console.error('[newsletter batch exception]', e?.message);
      failed += chunk.length;
    }
  }

  return { recipients: recipients.length, sent, failed, skipped: suppressed };
}

/** Send a single test copy to one address. */
export async function sendNewsletterTest(newsletter, toEmail, toName = '') {
  const ctx = await loadContext(newsletter);
  const msg = buildMessage(newsletter, { email: toEmail, name: toName }, ctx);
  const { data, error } = await resend.emails.send(msg);
  if (error) return { success: false, error: error.message || 'Send failed' };
  return { success: true, id: data?.id };
}
