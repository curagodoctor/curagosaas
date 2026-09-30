import connectDB from '@/lib/mongodb';
import { verifyActionToken } from '@/lib/practice-os/actionToken';
import { publishDayBlog } from '@/lib/practice-os/autoContent';

export const runtime = 'nodejs';
export const maxDuration = 60;

// GET /p/publish/<token> — opened straight from the daily-task email. The signed
// token is the only auth. Publishes that day's blog page and shows a standalone
// confirmation page (no login, no app chrome).
const page = (title, bodyHtml) => `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;margin:0;background:#F7F9F5;color:#101A13;">
<div style="max-width:520px;margin:0 auto;padding:64px 20px;">
<div style="background:#fff;border-radius:14px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,.07);text-align:center;">
<div style="margin-bottom:18px;"><span style="color:#096B17;font-size:20px;font-weight:700;">Curago</span>
<span style="color:#5E6B5F;font-size:12px;margin-left:8px;">Dominate Organic Search</span></div>
${bodyHtml}</div></div></body></html>`;

const html = (status, body) =>
  new Response(page(status === 200 ? 'Published' : 'Link problem', body), {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });

export async function GET(request, { params }) {
  const { token } = await params;
  const claim = verifyActionToken(token);
  if (!claim || claim.action !== 'publish') {
    return html(400, `<h1 style="font-size:22px;margin:0 0 10px;">This link isn't valid anymore</h1>
      <p style="color:#5E6B5F;font-size:15px;line-height:1.6;margin:0;">The publish link has expired or is incorrect. Open the task in your dashboard to publish it there.</p>`);
  }
  try {
    await connectDB();
    const result = await publishDayBlog(claim.doctorId, claim.missionId);
    if (!result.success) {
      return html(200, `<h1 style="font-size:22px;margin:0 0 10px;">Couldn't publish just yet</h1>
        <p style="color:#5E6B5F;font-size:15px;line-height:1.6;margin:0;">${result.error || 'Please try again from your dashboard.'}</p>`);
    }
    const view = /^https?:\/\//i.test(result.url) ? result.url : '';
    return html(200, `
      <div style="font-size:44px;line-height:1;margin:0 0 12px;">✓</div>
      <h1 style="font-size:23px;margin:0 0 8px;">You're live</h1>
      <p style="color:#5E6B5F;font-size:15px;line-height:1.6;margin:0 0 22px;">"<strong style="color:#101A13;">${result.title}</strong>" is now published on your website.</p>
      ${view ? `<a href="${view}" style="display:inline-block;background:#096B17;color:#fff;padding:13px 30px;border-radius:9px;text-decoration:none;font-weight:600;font-size:16px;">View the page →</a>` : ''}
      <p style="color:#99A399;font-size:12.5px;margin:18px 0 0;">You can close this tab.</p>`);
  } catch (e) {
    console.error('[p/publish]', e);
    return html(500, `<h1 style="font-size:22px;margin:0 0 10px;">Something went wrong</h1>
      <p style="color:#5E6B5F;font-size:15px;line-height:1.6;margin:0;">Please try again in a moment, or publish from your dashboard.</p>`);
  }
}
