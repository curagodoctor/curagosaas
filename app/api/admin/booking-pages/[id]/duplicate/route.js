import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BookingPage from '@/models/BookingPage';
import { isAuthenticated } from '@/lib/auth';

// POST - Duplicate booking page
export async function POST(request, { params }) {
  try {
    // Check authentication
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // In Next.js 15+, params is a promise and must be awaited
    const { id } = await params;
    const originalPage = await BookingPage.findById(id);

    if (!originalPage) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    // Generate unique slug by appending "-copy" and number if needed
    let newSlug = `${originalPage.slug}-copy`;
    let counter = 1;

    while (await BookingPage.findOne({ slug: newSlug })) {
      newSlug = `${originalPage.slug}-copy-${counter}`;
      counter++;
    }

    // Create duplicate with new slug and draft status
    const duplicatePage = new BookingPage({
      slug: newSlug,
      title: `${originalPage.title} (Copy)`,
      metaDescription: originalPage.metaDescription,
      metaKeywords: originalPage.metaKeywords,
      status: 'draft',
      sections: originalPage.sections.map(section => ({
        type: section.type,
        order: section.order,
        visible: section.visible,
        config: section.config,
      })),
      consultationFee: originalPage.consultationFee,
      bookingFee: originalPage.bookingFee,
      views: 0,
      bookings: 0,
      createdBy: 'admin',
    });

    await duplicatePage.save();

    return NextResponse.json({
      success: true,
      page: duplicatePage,
      message: 'Page duplicated successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error duplicating booking page:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
