import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BlogArticle from '@/models/BlogArticle';
import BookingPage from '@/models/BookingPage';
import Doctor from '@/models/Doctor';
import { sendPracticeOsReminderEmail } from '@/lib/email';

export const runtime = 'nodejs';

// GET /api/cron/content-scheduler — publish blog articles and website pages whose
// scheduled time has arrived, and email the doctor that their content is live.
// Daily on Vercel (mirrors the newsletter-scheduler pattern).
export async function GET(request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const now = new Date();

    const [blogs, pages] = await Promise.all([
      BlogArticle.find({ status: 'scheduled', scheduledAt: { $lte: now } }).limit(200),
      BookingPage.find({ status: 'scheduled', scheduledAt: { $lte: now } }).limit(200),
    ]);

    let published = 0;
    // Cache doctor lookups so multiple items for one doctor don't refetch.
    const doctorCache = new Map();
    const getDoctor = async (id) => {
      const key = String(id);
      if (doctorCache.has(key)) return doctorCache.get(key);
      const d = await Doctor.findById(id).select('email name displayName subdomain customDomain').lean();
      doctorCache.set(key, d);
      return d;
    };
    const siteBase = (d) => d?.customDomain ? `https://${d.customDomain}` : (d?.subdomain ? `https://${d.subdomain}.curago.in` : '');
    const notify = async (d, heading, body, url) => {
      if (!d?.email) return;
      try {
        await sendPracticeOsReminderEmail({
          email: d.email, name: d.displayName || d.name || '',
          subject: 'Your page is now live', heading, body,
          ctaLabel: url ? 'View it' : '', ctaUrl: url || '',
        });
      } catch (e) { console.error('[content-scheduler] email failed:', e.message); }
    };

    for (const b of blogs) {
      try {
        b.status = 'published';
        if (!b.publishedAt) b.publishedAt = now;
        await b.save();
        published++;
        const d = await getDoctor(b.doctorId);
        const url = siteBase(d) ? `${siteBase(d)}/blog/${b.slug}` : '';
        await notify(d, 'Your blog post is live', `"${b.title}" has been published to your website.`, url);
      } catch (e) { console.error('[content-scheduler] blog publish failed:', e.message); }
    }

    for (const p of pages) {
      try {
        p.status = 'published';
        if (!p.publishedAt) p.publishedAt = now;
        await p.save();
        published++;
        const d = await getDoctor(p.doctorId);
        const url = siteBase(d) ? `${siteBase(d)}/${p.slug === 'home' ? '' : p.slug}` : '';
        await notify(d, 'Your page is live', `"${p.title || p.slug}" has been published to your website.`, url);
      } catch (e) { console.error('[content-scheduler] page publish failed:', e.message); }
    }

    return NextResponse.json({ success: true, published, blogs: blogs.length, pages: pages.length });
  } catch (error) {
    console.error('[content-scheduler]', error);
    return NextResponse.json({ success: false, error: error.message || 'Cron failed' }, { status: 500 });
  }
}

export async function POST(request) { return GET(request); }
