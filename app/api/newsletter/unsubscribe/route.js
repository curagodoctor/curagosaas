import connectDB from '@/lib/mongodb';
import { verifyUnsubscribeToken } from '@/lib/newsletter/audience';
import NewsletterUnsubscribe from '@/models/NewsletterUnsubscribe';

export const runtime = 'nodejs';

function page(title, message, ok = true) {
  const color = ok ? '#096B17' : '#b4695c';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#F7F9F5;color:#101A13;">
  <div style="max-width:440px;margin:12vh auto;background:#fff;border:1px solid #DDE4D9;border-radius:14px;padding:36px 32px;text-align:center;">
    <div style="font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${color};font-weight:600;">Curago</div>
    <h1 style="font-size:20px;margin:14px 0 8px;">${title}</h1>
    <p style="font-size:15px;line-height:1.6;color:#5E6B5F;margin:0;">${message}</p>
  </div>
</body></html>`;
}

function html(body, status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

async function unsubscribe(token) {
  const email = verifyUnsubscribeToken(token);
  if (!email) {
    return html(page('Invalid link', 'This unsubscribe link is invalid or has expired.', false), 400);
  }
  await connectDB();
  await NewsletterUnsubscribe.updateOne(
    { email },
    { $setOnInsert: { email, reason: 'unsubscribe', unsubscribedAt: new Date() } },
    { upsert: true }
  );
  return html(page('You’re unsubscribed', `${email} will no longer receive The Practice Builder newsletter. You’ll still get essential account emails.`));
}

// GET — click from the email footer.
export async function GET(request) {
  const token = new URL(request.url).searchParams.get('token');
  return unsubscribe(token);
}

// POST — RFC 8058 one-click (List-Unsubscribe-Post) from Gmail/Outlook.
export async function POST(request) {
  const token = new URL(request.url).searchParams.get('token');
  return unsubscribe(token);
}
