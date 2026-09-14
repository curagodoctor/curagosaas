import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BookingPage from '@/models/BookingPage';
import BlogArticle from '@/models/BlogArticle';
import Booking from '@/models/Booking';
import Doctor from '@/models/Doctor';
import { sendPracticeOsReminderEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const maxDuration = 60;

// GET /api/cron/practice-os-monthly-summary — §14 monthly rollup. Registered daily
// on Vercel; only sends on the 1st (or with ?force=1). Emails each doctor with a
// published site a month-in-review: pages, posts, page views, new appointments.
export async function GET(request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const force = new URL(request.url).searchParams.get('force') === '1';
    if (!force && new Date().getDate() !== 1) {
      return NextResponse.json({ success: true, skipped: 'not-first-of-month' });
    }

    await connectDB();
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthLabel = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const doctorIds = await BookingPage.distinct('doctorId', { status: 'published' });
    let sent = 0, skipped = 0;

    for (const doctorId of doctorIds) {
      try {
        const doctor = await Doctor.findById(doctorId).select('email name displayName subdomain customDomain customDomainVerified isActive').lean();
        if (!doctor?.email || doctor.isActive === false || (!doctor.subdomain && !doctor.customDomain)) { skipped++; continue; }

        const [pages, blogAgg, newBookings, newPosts] = await Promise.all([
          BookingPage.find({ doctorId, status: 'published' }).select('views').lean(),
          BlogArticle.aggregate([
            { $match: { doctorId, status: 'published' } },
            { $group: { _id: null, views: { $sum: '$analytics.views' }, count: { $sum: 1 } } },
          ]),
          Booking.countDocuments({ doctorId, createdAt: { $gte: monthAgo } }),
          BlogArticle.countDocuments({ doctorId, status: 'published', publishedAt: { $gte: monthAgo } }),
        ]);

        const pageViews = pages.reduce((s, p) => s + (p.views || 0), 0);
        const blogViews = blogAgg[0]?.views || 0;
        const blogCount = blogAgg[0]?.count || 0;
        const siteUrl = doctor.customDomain && doctor.customDomainVerified
          ? `https://${doctor.customDomain}` : `https://${doctor.subdomain}.curago.in`;

        const body = [
          `Here's your practice's month in review — ${monthLabel}.`,
          ``,
          `• New pages published this month: ${newPosts.toLocaleString('en-IN')}`,
          `• Total published pages: ${pages.length.toLocaleString('en-IN')}`,
          `• Education articles: ${blogCount.toLocaleString('en-IN')}${blogCount ? ` (${blogViews.toLocaleString('en-IN')} views)` : ''}`,
          `• Total website visits: ${pageViews.toLocaleString('en-IN')}`,
          `• New appointment requests this month: ${newBookings.toLocaleString('en-IN')}`,
          ``,
          `Patients find you over months, not days — keep publishing and keep your details fresh.`,
        ].join('\n');

        await sendPracticeOsReminderEmail({
          email: doctor.email,
          name: doctor.displayName || doctor.name || '',
          subject: `Your practice this month — ${monthLabel}`,
          heading: 'Your month in review',
          body,
          ctaLabel: 'View my website',
          ctaUrl: siteUrl,
        });
        sent++;
      } catch (e) {
        console.error('[practice-os-monthly-summary] doctor failed:', doctorId, e.message);
        skipped++;
      }
    }

    return NextResponse.json({ success: true, doctors: doctorIds.length, sent, skipped });
  } catch (error) {
    console.error('[practice-os-monthly-summary]', error);
    return NextResponse.json({ success: false, error: error.message || 'Cron failed' }, { status: 500 });
  }
}

export async function POST(request) { return GET(request); }
