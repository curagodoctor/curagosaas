import { Resend } from 'resend';
import { getAudience, unsubscribeUrl } from '@/lib/newsletter/audience';
import { renderNewsletterHtml, renderNewsletterText } from '@/lib/newsletter/template';

const resend = new Resend(process.env.RESEND_API_KEY);
// Newsletters send from the verified Curago sender (noreply@curago.in). An
// optional NEWSLETTER_FROM env var can override it later, but the default is
// always the existing verified address so deliverability is guaranteed.
const FROM = process.env.NEWSLETTER_FROM || process.env.EMAIL_FROM || 'Curago <noreply@curago.in>';
const REPLY_TO = process.env.NEWSLETTER_REPLY_TO || '';

const BATCH_SIZE = 100;   // Resend batch API limit

function buildMessage(newsletter, recipient) {
  const unsub = unsubscribeUrl(recipient.email);
  return {
    from: FROM,
    to: recipient.email,
    subject: newsletter.subject,
    html: renderNewsletterHtml(newsletter, { recipientName: recipient.name, unsubscribeUrl: unsub }),
    text: renderNewsletterText(newsletter, { unsubscribeUrl: unsub }),
    ...(REPLY_TO ? { reply_to: REPLY_TO } : {}),
    // Standards-compliant one-click unsubscribe (Gmail/Outlook honor these).
    headers: {
      'List-Unsubscribe': `<${unsub}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}

/**
 * Send one newsletter to everyone in its segments (deduped, suppression-filtered).
 * Uses Resend's batch API — a handful of calls even for the whole list.
 * Returns { recipients, sent, failed, skipped }.
 */
export async function sendNewsletter(newsletter) {
  const { recipients, suppressed } = await getAudience(newsletter.segments);
  let sent = 0, failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE);
    const messages = chunk.map((r) => buildMessage(newsletter, r));
    try {
      const { data, error } = await resend.batch.send(messages);
      if (error) {
        console.error('[newsletter batch]', error);
        failed += chunk.length;
      } else {
        // Resend returns { data: [{id}, ...] } on success.
        sent += Array.isArray(data?.data) ? data.data.length : chunk.length;
      }
    } catch (e) {
      console.error('[newsletter batch exception]', e?.message);
      failed += chunk.length;
    }
  }

  return { recipients: recipients.length, sent, failed, skipped: suppressed };
}

/** Send a single test copy to one address (does not touch stats/suppression dedupe). */
export async function sendNewsletterTest(newsletter, toEmail, toName = '') {
  const msg = buildMessage(newsletter, { email: toEmail, name: toName });
  const { data, error } = await resend.emails.send(msg);
  if (error) return { success: false, error: error.message || 'Send failed' };
  return { success: true, id: data?.id };
}
