import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import BookingPage from '@/models/BookingPage';
import BlogArticle from '@/models/BlogArticle';
import Booking from '@/models/Booking';

export const runtime = 'nodejs';

// GET — §9 basic website analytics for the control-center widget: the same
// numbers as the weekly email, live.
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [pages, blogAgg, newBookings] = await Promise.all([
      BookingPage.find({ doctorId: doctor._id, status: 'published' }).select('views').lean(),
      BlogArticle.aggregate([
        { $match: { doctorId: doctor._id, status: 'published' } },
        { $group: { _id: null, views: { $sum: '$analytics.views' }, count: { $sum: 1 } } },
      ]),
      Booking.countDocuments({ doctorId: doctor._id, createdAt: { $gte: weekAgo } }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        visits: pages.reduce((s, p) => s + (p.views || 0), 0),
        publishedPages: pages.length,
        blogCount: blogAgg[0]?.count || 0,
        blogViews: blogAgg[0]?.views || 0,
        newRequests7d: newBookings,
        hasSite: (pages.length > 0) || !!doctor.subdomain || !!doctor.customDomain,
      },
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[website-stats]', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
