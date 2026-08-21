import connectDB from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import Newsletter from '@/models/Newsletter';
import { renderNewsletterHtml } from '@/lib/newsletter/template';

export const runtime = 'nodejs';

// GET — the rendered email HTML for the composer preview iframe.
export async function GET(request, { params }) {
  const { authenticated } = await requirePlatformAdmin();
  if (!authenticated) return new Response('Unauthorized', { status: 401 });

  await connectDB();
  const { id } = await params;
  const nl = await Newsletter.findById(id).lean();
  if (!nl) return new Response('Not found', { status: 404 });

  const html = renderNewsletterHtml(nl, { recipientName: 'Dr. Sharma', unsubscribeUrl: '#' });
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
