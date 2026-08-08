// Per-tenant robots.txt generator. Middleware rewrites `<host>/robots.txt` (any
// doctor subdomain or custom domain) here. Host + Sitemap are built from the
// REQUEST host, so every doctor site points at ITS OWN domain — never curago.in.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const host = request.headers.get('host') || '';
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const base = `${proto}://${host}`;

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
