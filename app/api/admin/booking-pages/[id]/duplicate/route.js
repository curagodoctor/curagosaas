import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BookingPage from '@/models/BookingPage';
import { isAuthenticated } from '@/lib/auth';
import { getCurrentDoctor } from '@/lib/doctorAuth';

// POST - Duplicate booking page
export async function POST(request, { params }) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const doctor = await getCurrentDoctor(request);
    const doctorId = doctor?._id;

    await connectDB();

    // In Next.js 15+, params is a promise and must be awaited
    const { id } = await params;

    const query = { _id: id };
    if (doctorId) query.doctorId = doctorId;

    const originalPage = await BookingPage.findOne(query);

    if (!originalPage) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    // Generate unique slug by appending "-copy" and number if needed
    let newSlug = `${originalPage.slug}-copy`;
    let counter = 1;

    const slugQuery = { slug: newSlug };
    if (doctorId) slugQuery.doctorId = doctorId;

    while (await BookingPage.findOne(slugQuery)) {
      newSlug = `${originalPage.slug}-copy-${counter}`;
      slugQuery.slug = newSlug;
      counter++;
    }

    // Create duplicate with new slug and draft status
    const duplicatePage = new BookingPage({
      doctorId: doctorId || undefined,
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
