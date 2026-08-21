import { NEWSLETTER_SECTIONS } from '@/models/Newsletter';

const LABEL_BY_KEY = Object.fromEntries(NEWSLETTER_SECTIONS.map((s) => [s.key, s.label]));

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Turn plain text into email-safe HTML: paragraphs on blank lines, <br> on single
// newlines.
function textToHtml(text) {
  const blocks = String(text || '').trim().split(/\n{2,}/);
  return blocks
    .map((b) => `<p style="margin:0 0 14px 0;">${esc(b).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

// Estimated read time from all section bodies (~200 wpm, min 1).
export function computeReadTime(newsletter) {
  const words = (newsletter.sections || [])
    .map((s) => (s.body || '').trim().split(/\s+/).filter(Boolean).length)
    .reduce((a, b) => a + b, 0);
  return Math.max(1, Math.round(words / 200));
}

// Append UTM params to a link so newsletter traffic is attributable.
export function withUtm(url, campaign) {
  if (!url || !/^https?:\/\//i.test(url)) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('utm_source', 'newsletter');
    u.searchParams.set('utm_medium', 'email');
    if (campaign) u.searchParams.set('utm_campaign', campaign);
    return u.toString();
  } catch { return url; }
}

/**
 * Render the newsletter to a responsive, TLDR-style HTML email.
 * opts: { recipientName, unsubscribeUrl, settings, campaign }
 */
export function renderNewsletterHtml(newsletter, opts = {}) {
  const { recipientName = '', unsubscribeUrl = '#', settings = {}, campaign = '' } = opts;
  const intro = newsletter.intro || 'One idea to build a stronger clinical practice.';
  const preheader = newsletter.preheader || intro;
  const readTime = computeReadTime(newsletter);

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
        ${s.imageUrl ? `<img src="${esc(s.imageUrl)}" alt="" style="display:block;width:100%;max-width:100%;height:auto;border-radius:10px;margin:14px 0 4px 0;" />` : ''}
        <div style="font-size:16px;line-height:1.62;color:#1f2937;margin-top:10px;">
          ${textToHtml(s.body)}
        </div>
      </div>
    </td></tr>`).join('');

  // Hero banner
  const heroHtml = newsletter.heroImage ? `
    <tr><td style="padding:0;">
      <img src="${esc(newsletter.heroImage)}" alt="" style="display:block;width:100%;max-width:100%;height:auto;" />
    </td></tr>` : '';

  // Read-time badge
  const readTimeHtml = newsletter.showReadTime !== false ? `
    <span style="display:inline-block;font-family:'DM Mono',ui-monospace,monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#5E6B5F;background:#EDF1EB;border-radius:999px;padding:4px 10px;">${readTime} min read</span>` : '';

  // Founder byline
  const founderHtml = (settings.showFounder && settings.founderName) ? `
    <tr><td style="padding:20px 32px 0 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        ${settings.founderPhotoUrl ? `<td style="padding-right:12px;"><img src="${esc(settings.founderPhotoUrl)}" width="44" height="44" alt="" style="display:block;width:44px;height:44px;border-radius:999px;object-fit:cover;" /></td>` : ''}
        <td>
          <div style="font-size:14px;font-weight:600;color:#101A13;">${esc(settings.founderName)}</div>
          ${settings.founderCredential ? `<div style="font-size:12px;color:#5E6B5F;">${esc(settings.founderCredential)}</div>` : ''}
        </td>
      </tr></table>
    </td></tr>` : '';

  // PDF download button
  const pdfHtml = newsletter.pdfUrl ? `
    <tr><td style="padding:22px 32px 0 32px;">
      <a href="${esc(withUtm(newsletter.pdfUrl, campaign))}" style="display:inline-block;border:1px solid #DDE4D9;color:#096B17;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:9px;">
        &#128206; ${esc(newsletter.pdfLabel || 'Download the guide')}
      </a>
    </td></tr>` : '';

  // Optional CTA button
  const ctaHtml = (newsletter.ctaLabel && newsletter.ctaUrl) ? `
    <tr><td style="padding:24px 32px 0 32px;">
      <a href="${esc(withUtm(newsletter.ctaUrl, campaign))}" style="display:inline-block;background:#F26A1B;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 26px;border-radius:9px;">
        ${esc(newsletter.ctaLabel)} &rarr;
      </a>
    </td></tr>` : '';

  const greeting = recipientName
    ? `<p style="margin:0 0 6px 0;font-size:15px;color:#5E6B5F;">Hi ${esc((recipientName || '').split(' ')[0])},</p>`
    : '';

  // Footer: social links + postal address
  const socials = (settings.socialLinks || []).filter((l) => l.url);
  const socialHtml = socials.length ? `
    <div style="margin-bottom:10px;">
      ${socials.map((l) => `<a href="${esc(l.url)}" style="color:#5E6B5F;text-decoration:underline;font-size:12px;margin-right:14px;">${esc(l.label || l.url)}</a>`).join('')}
    </div>` : '';
  const addressHtml = settings.postalAddress
    ? `<div style="margin-bottom:8px;">${esc(settings.postalAddress).replace(/\n/g, '<br>')}</div>` : '';

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

        <!-- Hero -->
        ${heroHtml}

        <!-- Masthead -->
        <tr><td style="padding:28px 32px 0 32px;">
          <div style="font-family:'DM Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#096B17;font-weight:600;">
            The Practice Builder
          </div>
          <h1 style="margin:14px 0 0 0;font-size:24px;line-height:1.25;color:#101A13;font-weight:700;letter-spacing:-0.02em;">
            ${esc(newsletter.subject)}
          </h1>
          <p style="margin:10px 0 12px 0;font-size:15px;color:#5E6B5F;font-style:italic;">${esc(intro)}</p>
          ${readTimeHtml}
        </td></tr>

        <!-- Founder byline -->
        ${founderHtml}

        <!-- Greeting -->
        <tr><td style="padding:22px 32px 0 32px;">${greeting}</td></tr>

        <!-- Sections -->
        ${sectionsHtml}

        <!-- PDF -->
        ${pdfHtml}

        <!-- CTA -->
        ${ctaHtml}

        <!-- Footer -->
        <tr><td style="padding:32px;">
          <div style="border-top:1px solid #EDF1EB;padding-top:20px;font-size:12px;line-height:1.6;color:#9ca3af;">
            ${socialHtml}
            ${addressHtml}
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
  const { unsubscribeUrl = '', settings = {}, campaign = '' } = opts;
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
  if (newsletter.pdfUrl) lines.push(`${newsletter.pdfLabel || 'Download the guide'}: ${withUtm(newsletter.pdfUrl, campaign)}`, '');
  if (newsletter.ctaLabel && newsletter.ctaUrl) lines.push(`${newsletter.ctaLabel}: ${withUtm(newsletter.ctaUrl, campaign)}`, '');
  lines.push('—');
  if (settings.postalAddress) lines.push(settings.postalAddress, '');
  lines.push(`Unsubscribe: ${unsubscribeUrl}`, `© ${new Date().getFullYear()} Curago`);
  return lines.join('\n');
}
