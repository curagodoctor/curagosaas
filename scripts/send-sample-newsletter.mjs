// One-off: send a single SAMPLE newsletter to one address so we can eyeball it.
// Does NOT touch the 120-person list — this is a direct test send only.
//   node --env-file=.env.local scripts/send-sample-newsletter.mjs
//
// Renders with the same HTML the newsletter module uses (kept in sync with
// lib/newsletter/template.js).

import { Resend } from 'resend';

const TO = 'vattikutiraghavendra3@gmail.com';
const FROM = process.env.NEWSLETTER_FROM || process.env.EMAIL_FROM || 'Curago <noreply@curago.in>';
const resend = new Resend(process.env.RESEND_API_KEY);

const SECTIONS = [
  { key: 'observation',    label: 'The Observation' },
  { key: 'problem',        label: 'The Problem' },
  { key: 'insight',        label: 'The Insight' },
  { key: 'framework',      label: 'The Framework' },
  { key: 'doThisToday',    label: 'Do This Today' },
  { key: 'realWorld',      label: 'Real World' },
  { key: 'practiceSafety', label: 'Practice Safety' },
  { key: 'yourNextMove',   label: 'Your Next Move' },
  { key: 'oneQuestion',    label: 'One Question' },
];

const newsletter = {
  subject: 'The patient who almost didn’t call',
  preheader: 'Why your Google profile decides the visit before you ever meet.',
  intro: 'One idea to build a stronger clinical practice.',
  ctaLabel: 'Build your free profile',
  ctaUrl: 'https://curago.in',
  sections: [
    { key: 'observation',    heading: 'The Observation', body: '78% of patients look you up online before they book. Most never tell you they did — they just quietly decide.' },
    { key: 'problem',        heading: 'The Problem',      body: 'Doctors assume their degrees speak for themselves. Online, an empty or half-filled Google profile speaks louder — and it says “not sure about this one.”' },
    { key: 'insight',        heading: 'The Insight',      body: 'Patients aren’t judging your competence. They can’t. They’re judging the signals they *can* read: photos, reviews, response, clarity. Trust is built on proxies.' },
    { key: 'framework',      heading: 'The Framework',    body: 'The 3-second test: open your practice on a phone as a stranger would. In three seconds, can they tell what you treat, where you are, and that other people trust you? If not, that’s your gap.' },
    { key: 'doThisToday',    heading: 'Do This Today',    body: 'Add three real photos to your Google Business Profile: your clinic entrance, the waiting area, and you. Ten minutes. It’s the single highest-trust, lowest-effort fix there is.' },
    { key: 'realWorld',      heading: 'Real World',       body: 'A paediatrician in Nashik went from 2 to 40 reviews in six weeks by asking every satisfied parent at checkout with a one-line WhatsApp. Bookings from search doubled — same practice, same skill, clearer signal.' },
    { key: 'practiceSafety', heading: 'Practice Safety',  body: 'Stay within NMC norms: share information, never superlatives. “Paediatric care in Nashik” is fine. “Best paediatrician” is not. Being findable is not advertising.' },
    { key: 'yourNextMove',   heading: 'Your Next Move',   body: 'Pick one: photos today, or your first five review requests this week. One move, done, beats a plan you admire.' },
    { key: 'oneQuestion',    heading: 'One Question',      body: 'If a patient judged your practice only by what’s online right now — would they choose you?' },
  ],
};

// --- render (mirror of lib/newsletter/template.js) ---
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function textToHtml(t){return String(t||'').trim().split(/\n{2,}/).map(b=>`<p style="margin:0 0 14px 0;">${esc(b).replace(/\n/g,'<br>')}</p>`).join('');}
function render(nl, unsub){
  const intro = nl.intro;
  const ordered = SECTIONS.map((m,i)=>{const s=nl.sections.find(x=>x.key===m.key)||{};return {...s,n:i+1,label:(s.heading&&s.heading.trim())||m.label};}).filter(s=>s.body&&s.body.trim());
  const sectionsHtml = ordered.map(s=>`
    <tr><td style="padding:0 32px;">
      <div style="border-top:1px solid #EDF1EB;padding-top:26px;margin-top:26px;">
        <div style="font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#F26A1B;font-weight:600;">${String(s.n).padStart(2,'0')} — ${esc(s.label)}</div>
        <div style="font-size:16px;line-height:1.62;color:#1f2937;margin-top:10px;">${textToHtml(s.body)}</div>
      </div>
    </td></tr>`).join('');
  const ctaHtml = (nl.ctaLabel&&nl.ctaUrl)?`
    <tr><td style="padding:24px 32px 0 32px;">
      <a href="${esc(nl.ctaUrl)}" style="display:inline-block;background:#F26A1B;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 26px;border-radius:9px;">${esc(nl.ctaLabel)} &rarr;</a>
    </td></tr>`:'';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><title>${esc(nl.subject)}</title></head>
<body style="margin:0;padding:0;background:#F7F9F5;-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(nl.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F9F5;padding:24px 12px;"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(16,26,19,.06);">
      <tr><td style="padding:28px 32px 0 32px;">
        <div style="font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#096B17;font-weight:600;">The Practice Builder</div>
        <h1 style="margin:14px 0 0 0;font-size:24px;line-height:1.25;color:#101A13;font-weight:700;letter-spacing:-0.02em;">${esc(nl.subject)}</h1>
        <p style="margin:10px 0 0 0;font-size:15px;color:#5E6B5F;font-style:italic;">${esc(intro)}</p>
      </td></tr>
      <tr><td style="padding:22px 32px 0 32px;"><p style="margin:0 0 6px 0;font-size:15px;color:#5E6B5F;">Hi Dr. Raghavendra,</p></td></tr>
      ${sectionsHtml}
      ${ctaHtml}
      <tr><td style="padding:32px;"><div style="border-top:1px solid #EDF1EB;padding-top:20px;font-size:12px;line-height:1.6;color:#9ca3af;">You're receiving this because you're part of the Curago community.<br><a href="${esc(unsub)}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a> &nbsp;·&nbsp; &copy; ${new Date().getFullYear()} Curago</div></td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

const unsub = 'https://curago.in/api/newsletter/unsubscribe?token=sample';
const html = render(newsletter, unsub);

const { data, error } = await resend.emails.send({
  from: FROM,
  to: TO,
  subject: newsletter.subject,
  html,
  headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
});

if (error) { console.error('FAILED:', error); process.exit(1); }
console.log(`Sent sample newsletter to ${TO} from "${FROM}" — id: ${data?.id}`);
