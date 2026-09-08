// Per-tenant robots.txt generator. Middleware rewrites `<host>/robots.txt` (any
// doctor subdomain or custom domain) here with ?subdomain=<sub>. Host + Sitemap
// point at the doctor's PRIMARY domain (verified custom domain else subdomain),
// so a subdomain never advertises itself once a custom domain is live.
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import { primaryBaseUrl } from '@/lib/primaryDomain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const reqHost = request.headers.get('host') || '';
  const proto = request.headers.get('x-forwarded-proto') || (reqHost.includes('localhost') ? 'http' : 'https');
  let base = `${proto}://${reqHost}`;

  const subdomain = (request.nextUrl.searchParams.get('subdomain') || '').toLowerCase();
  if (subdomain) {
    try {
      await connectDB();
      const doctor = await Doctor.findOne({ subdomain, isActive: true })
        .select('subdomain customDomain customDomainVerified').lean();
      if (doctor) base = primaryBaseUrl(doctor) || base;
    } catch (e) {
      console.error('[tenant robots]', e.message);
    }
  }
  const host = base.replace(/^https?:\/\//, '');

  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Host: ${host}`,
    `Sitemap: ${base}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
