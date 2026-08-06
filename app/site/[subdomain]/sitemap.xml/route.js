import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import BookingPage from '@/models/BookingPage';

// Per-tenant sitemap. Reached because middleware rewrites `<host>/sitemap.xml`
// (subdomain OR custom domain) to `/site/<subdomain>/sitemap.xml`. URLs are built
// from the REQUEST host, so a doctor's sitemap only ever contains THEIR own
// domain — never curago.in.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function baseUrl(request) {
  const host = request.headers.get('host') || '';
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export async function GET(request, { params }) {
  const { subdomain } = await params;
  const base = baseUrl(request);

  let urls = [];
  try {
    await connectDB();
    const doctor = await Doctor.findOne({ subdomain: subdomain.toLowerCase(), isActive: true }).select('_id').lean();
    if (doctor) {
      const pages = await BookingPage.find({ doctorId: doctor._id, status: 'published' })
        .sort({ createdAt: 1 })
        .select('slug updatedAt publishedAt createdAt')
        .lean();
      urls = pages.map((p, i) => ({
        // The first published page is the homepage ("/"); the rest live at "/<slug>".
        loc: i === 0 ? `${base}/` : `${base}/${p.slug}`,
        lastmod: new Date(p.updatedAt || p.publishedAt || p.createdAt || Date.now()).toISOString(),
        priority: i === 0 ? '1.0' : '0.8',
      }));
    }
  } catch (e) {
    console.error('[tenant sitemap]', e.message);
  }

  // Always advertise at least the homepage.
  if (!urls.length) urls.push({ loc: `${base}/`, lastmod: new Date().toISOString(), priority: '1.0' });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
