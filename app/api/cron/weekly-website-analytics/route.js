import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BookingPage from '@/models/BookingPage';
import BlogArticle from '@/models/BlogArticle';
import Booking from '@/models/Booking';
import Doctor from '@/models/Doctor';
import { sendPracticeOsReminderEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const maxDuration = 60;

// GET /api/cron/weekly-website-analytics — once a week, email every doctor who has
// a published website a snapshot of their site's activity. Registered daily on
// Vercel; only actually sends on Mondays (or with ?force=1 for testing).
export async function GET(request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL(request.url);
    const force = url.searchParams.get('force') === '1';
    // Weekly cadence on a daily cron: only run on Mondays unless forced.
    if (!force && new Date().getDay() !== 1) {
      return NextResponse.json({ success: true, skipped: 'not-monday' });
    }

    await connectDB();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Doctors who actually have a published website.
    const doctorIds = await BookingPage.distinct('doctorId', { status: 'published' });
    let sent = 0, skipped = 0;

    for (const doctorId of doctorIds) {
      try {
        const doctor = await Doctor.findById(doctorId).select('email name displayName subdomain customDomain isActive').lean();
        if (!doctor?.email || doctor.isActive === false || (!doctor.subdomain && !doctor.customDomain)) { skipped++; continue; }

        const [pages, blogAgg, newBookings] = await Promise.all([
          BookingPage.find({ doctorId, status: 'published' }).select('views bookings').lean(),
          BlogArticle.aggregate([
            { $match: { doctorId, status: 'published' } },
            { $group: { _id: null, views: { $sum: '$analytics.views' }, count: { $sum: 1 } } },
          ]),
          Booking.countDocuments({ doctorId, createdAt: { $gte: weekAgo } }),
        ]);

        const pageViews = pages.reduce((s, p) => s + (p.views || 0), 0);
        const publishedPages = pages.length;
        const blogViews = blogAgg[0]?.views || 0;
        const blogCount = blogAgg[0]?.count || 0;
        const siteUrl = doctor.customDomain ? `https://${doctor.customDomain}` : `https://${doctor.subdomain}.curago.in`;

        const body = [
          `Here's how your website did over the past week.`,
          ``,
          `• Website visits (total): ${pageViews.toLocaleString('en-IN')}`,
          `• New appointment requests this week: ${newBookings.toLocaleString('en-IN')}`,
          `• Published pages: ${publishedPages}`,
          `• Blog articles: ${blogCount}${blogCount ? ` (${blogViews.toLocaleString('en-IN')} views)` : ''}`,
          ``,
          `Keep your profile and content fresh to help more patients find you.`,
        ].join('\n');

        await sendPracticeOsReminderEmail({
          email: doctor.email,
          name: doctor.displayName || doctor.name || '',
          subject: 'Your website this week',
          heading: 'Your weekly website snapshot',
          body,
          ctaLabel: 'View my website',
          ctaUrl: siteUrl,
        });
        sent++;
      } catch (e) {
        console.error('[weekly-website-analytics] doctor failed:', doctorId, e.message);
        skipped++;
      }
    }

    return NextResponse.json({ success: true, doctors: doctorIds.length, sent, skipped });
  } catch (error) {
    console.error('[weekly-website-analytics]', error);
    return NextResponse.json({ success: false, error: error.message || 'Cron failed' }, { status: 500 });
  }
}

export async function POST(request) { return GET(request); }
