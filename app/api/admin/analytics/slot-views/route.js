import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import SlotView from "@/models/SlotView";
import Booking from "@/models/Booking";

// GET - Get slot view analytics
export async function GET(request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const modeFilter = searchParams.get('mode');
    const pageSlug = searchParams.get('pageSlug');

    // Build query
    let query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (modeFilter && modeFilter !== 'all') {
      query.modeOfContact = modeFilter;
    }

    if (pageSlug && pageSlug !== 'all') {
      query.pageSlug = pageSlug;
    }

    // Get all slot views with filters
    const slotViews = await SlotView.find(query)
      .sort({ createdAt: -1 })
      .limit(1000);

    // Calculate statistics
    const totalViews = slotViews.length;
    const onlineViews = slotViews.filter(v => v.modeOfContact === 'online').length;
    const inClinicViews = slotViews.filter(v => v.modeOfContact === 'in-clinic').length;
    const converted = slotViews.filter(v => v.convertedToBooking).length;
    const conversionRate = totalViews > 0 ? ((converted / totalViews) * 100).toFixed(2) : 0;

    // Get unique users (by email)
    const uniqueEmails = new Set(slotViews.map(v => v.email));
    const uniqueUsers = uniqueEmails.size;

    // Group by page
    const byPage = slotViews.reduce((acc, view) => {
      const page = view.pageSlug || 'unknown';
      if (!acc[page]) {
        acc[page] = { count: 0, pageName: view.pageName || page };
      }
      acc[page].count++;
      return acc;
    }, {});

    // Group by date
    const byDate = slotViews.reduce((acc, view) => {
      const date = new Date(view.createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    }, {});

    // Group by gender
    const byGender = slotViews.reduce((acc, view) => {
      const gender = view.gender || 'Unknown';
      if (!acc[gender]) {
        acc[gender] = 0;
      }
      acc[gender]++;
      return acc;
    }, {});

    // Group by referrer
    const byReferrer = slotViews.reduce((acc, view) => {
      const referrer = view.referrer || 'direct';
      if (!acc[referrer]) {
        acc[referrer] = 0;
      }
      acc[referrer]++;
      return acc;
    }, {});

    // Age statistics
    const ages = slotViews.map(v => v.age).filter(Boolean);
    const avgAge = ages.length > 0 ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalViews,
        onlineViews,
        inClinicViews,
        converted,
        conversionRate,
        uniqueUsers,
        avgAge,
      },
      breakdown: {
        byPage: Object.entries(byPage).map(([slug, data]) => ({
          slug,
          pageName: data.pageName,
          count: data.count,
        })),
        byDate: Object.entries(byDate)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        byGender: Object.entries(byGender).map(([gender, count]) => ({ gender, count })),
        byReferrer: Object.entries(byReferrer)
          .map(([referrer, count]) => ({ referrer, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10), // Top 10 referrers
      },
      views: slotViews,
    });
  } catch (error) {
    console.error("Error fetching slot view analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics", details: error.message },
      { status: 500 }
    );
  }
}
