import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BookingPage from '@/models/BookingPage';

// GET - Get published booking page by slug
export async function GET(request, { params }) {
  try {
    await connectDB();

    // In Next.js 15+, params is a promise and must be awaited
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const preview = searchParams.get('preview') === 'true';

    // Build query
    const query = { slug };

    // Only show published pages unless preview is requested
    if (!preview) {
      query.status = 'published';
    }

    const page = await BookingPage.findOne(query).select(
      'slug title metaDescription metaKeywords sections consultationFee bookingFee'
    );

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    // Increment view count (only for published pages, not previews)
    if (!preview && page.status === 'published') {
      await BookingPage.findByIdAndUpdate(page._id, {
        $inc: { views: 1 },
      });
    }

    // Filter only visible sections and sort by order
    const visibleSections = page.sections
      .filter((section) => section.visible)
      .sort((a, b) => a.order - b.order);

    return NextResponse.json({
      success: true,
      page: {
        slug: page.slug,
        title: page.title,
        metaDescription: page.metaDescription,
        metaKeywords: page.metaKeywords,
        sections: visibleSections,
        consultationFee: page.consultationFee,
        bookingFee: page.bookingFee,
      },
    });
  } catch (error) {
    console.error('Error fetching booking page:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
