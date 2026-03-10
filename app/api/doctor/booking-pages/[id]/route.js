import { NextResponse } from 'next/server';
import { getCurrentDoctor } from '@/lib/doctorAuth';
import BookingPage from '@/models/BookingPage';
import connectDB from '@/lib/mongodb';

// GET - Get a single booking page by ID
export async function GET(request, { params }) {
  try {
    await connectDB();

    const doctor = await getCurrentDoctor(request);

    if (!doctor) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Find page and verify ownership
    const page = await BookingPage.findOne({
      _id: id,
      doctorId: doctor._id,
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      page,
    });
  } catch (error) {
    console.error('Error fetching booking page:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update a booking page
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const doctor = await getCurrentDoctor(request);

    if (!doctor) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const data = await request.json();

    // Find page and verify ownership
    const page = await BookingPage.findOne({
      _id: id,
      doctorId: doctor._id,
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // If changing slug, check for conflicts
    if (data.slug && data.slug !== page.slug) {
      const existing = await BookingPage.findOne({
        doctorId: doctor._id,
        slug: data.slug,
        _id: { $ne: id },
      });

      if (existing) {
        return NextResponse.json(
          { error: `Slug "${data.slug}" is already in use` },
          { status: 400 }
        );
      }
    }

    // Update allowed fields
    const allowedFields = [
      'slug',
      'title',
      'metaDescription',
      'metaKeywords',
      'status',
      'sections',
      'consultationFee',
      'bookingFee',
      'ogImage',
      'themeColor',
      'headerConfig',
      'footerConfig',
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        page[field] = data[field];
      }
    }

    // Handle status changes
    if (data.status === 'published' && page.status !== 'published') {
      page.publishedAt = new Date();
    }

    // Reorder sections if updated
    if (data.sections && page.sections.length > 0) {
      page.reorderSections();
    }

    page.updatedAt = new Date();
    await page.save();

    return NextResponse.json({
      success: true,
      page,
      message: 'Page updated successfully',
    });
  } catch (error) {
    console.error('Error updating booking page:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a booking page
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const doctor = await getCurrentDoctor(request);

    if (!doctor) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Find and delete page, verify ownership
    const page = await BookingPage.findOneAndDelete({
      _id: id,
      doctorId: doctor._id,
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting booking page:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
