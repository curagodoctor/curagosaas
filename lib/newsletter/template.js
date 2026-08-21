import { NEWSLETTER_SECTIONS } from '@/models/Newsletter';

const LABEL_BY_KEY = Object.fromEntries(NEWSLETTER_SECTIONS.map((s) => [s.key, s.label]));

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Turn plain text into email-safe HTML: paragraphs on blank lines, <br> on single
// newlines. (Keeps the composer simple — no rich editor needed.)
function textToHtml(text) {
  const blocks = String(text || '').trim().split(/\n{2,}/);
  return blocks
    .map((b) => `<p style="margin:0 0 14px 0;">${esc(b).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/**
 * Render the newsletter to a responsive, TLDR-style HTML email.
 * opts: { recipientName, unsubscribeUrl }
 */
export function renderNewsletterHtml(newsletter, opts = {}) {
  const { recipientName = '', unsubscribeUrl = '#' } = opts;
  const intro = newsletter.intro || 'One idea to build a stronger clinical practice.';
  const preheader = newsletter.preheader || intro;

  // Sections in the fixed template order, numbered, only those with a body.
  const ordered = NEWSLETTER_SECTIONS
    .map((meta) => (newsletter.sections || []).find((s) => s.key === meta.key) || { key: meta.key })
    .map((s, i) => ({ ...s, n: i + 1, label: (s.heading && s.heading.trim()) || LABEL_BY_KEY[s.key] }))
    .filter((s) => s.body && String(s.body).trim());

  const sectionsHtml = ordered.map((s) => `
    <tr><td style="padding:0 32px;">
      <div style="border-top:1px solid #EDF1EB;padding-top:26px;margin-top:26px;">
        <div style="font-family:'DM Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#F26A1B;font-weight:600;">
          ${String(s.n).padStart(2, '0')} — ${esc(s.label)}
        </div>
        <div style="font-size:16px;line-height:1.62;color:#1f2937;margin-top:10px;">
          ${textToHtml(s.body)}
        </div>
      </div>
    </td></tr>`).join('');

  // Optional CTA button (pairs with "Your Next Move").
  const ctaHtml = (newsletter.ctaLabel && newsletter.ctaUrl) ? `
    <tr><td style="padding:24px 32px 0 32px;">
      <a href="${esc(newsletter.ctaUrl)}" style="display:inline-block;background:#F26A1B;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 26px;border-radius:9px;">
        ${esc(newsletter.ctaLabel)} &rarr;
      </a>
    </td></tr>` : '';

  const greeting = recipientName
    ? `<p style="margin:0 0 6px 0;font-size:15px;color:#5E6B5F;">Hi ${esc((recipientName || '').split(' ')[0])},</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>${esc(newsletter.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F7F9F5;-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F9F5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(16,26,19,.06);">

        <!-- Masthead -->
        <tr><td style="padding:28px 32px 0 32px;">
          <div style="font-family:'DM Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#096B17;font-weight:600;">
            The Practice Builder
          </div>
          <h1 style="margin:14px 0 0 0;font-size:24px;line-height:1.25;color:#101A13;font-weight:700;letter-spacing:-0.02em;">
            ${esc(newsletter.subject)}
          </h1>
          <p style="margin:10px 0 0 0;font-size:15px;color:#5E6B5F;font-style:italic;">${esc(intro)}</p>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:22px 32px 0 32px;">${greeting}</td></tr>

        <!-- Sections -->
        ${sectionsHtml}

        <!-- CTA -->
        ${ctaHtml}

        <!-- Footer -->
        <tr><td style="padding:32px;">
          <div style="border-top:1px solid #EDF1EB;padding-top:20px;font-size:12px;line-height:1.6;color:#9ca3af;">
            You're receiving this because you're part of the Curago community.<br>
            <a href="${esc(unsubscribeUrl)}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
            &nbsp;·&nbsp; &copy; ${new Date().getFullYear()} Curago
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Plain-text fallback (better deliverability + accessibility).
export function renderNewsletterText(newsletter, opts = {}) {
  const { unsubscribeUrl = '' } = opts;
  const lines = [
    'THE PRACTICE BUILDER',
    newsletter.subject || '',
    newsletter.intro || 'One idea to build a stronger clinical practice.',
    '',
  ];
  NEWSLETTER_SECTIONS.forEach((meta, i) => {
    const s = (newsletter.sections || []).find((x) => x.key === meta.key);
    if (s && s.body && s.body.trim()) {
      lines.push(`${String(i + 1).padStart(2, '0')} — ${(s.heading || meta.label).toUpperCase()}`);
      lines.push(s.body.trim());
      lines.push('');
    }
  });
  if (newsletter.ctaLabel && newsletter.ctaUrl) {
    lines.push(`${newsletter.ctaLabel}: ${newsletter.ctaUrl}`, '');
  }
  lines.push('—', `Unsubscribe: ${unsubscribeUrl}`, `© ${new Date().getFullYear()} Curago`);
  return lines.join('\n');
}
