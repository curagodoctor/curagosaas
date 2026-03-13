import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BookingPage from '@/models/BookingPage';
import { getCurrentDoctor } from '@/lib/doctorAuth';

// GET - List all booking pages
export async function GET(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const doctorId = doctor._id;

    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query with required doctorId
    const query = { doctorId };
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    // Get pages with pagination
    const [pages, total] = await Promise.all([
      BookingPage.find(query)
        .select('slug title status views bookings updatedAt publishedAt')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BookingPage.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      pages,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching booking pages:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new booking page
export async function POST(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const doctorId = doctor._id;

    await connectDB();

    const data = await request.json();

    // Validate required fields
    if (!data.slug || !data.title) {
      return NextResponse.json(
        { success: false, error: 'Slug and title are required' },
        { status: 400 }
      );
    }

    // Check for reserved slugs
    const reservedSlugs = ['api', 'admin', '_next', 'main'];
    if (reservedSlugs.includes(data.slug.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: `Slug "${data.slug}" is reserved. Please choose another.` },
        { status: 400 }
      );
    }

    // Check if slug already exists for this doctor
    const existingQuery = { slug: data.slug };
    if (doctorId) existingQuery.doctorId = doctorId;
    const existingPage = await BookingPage.findOne(existingQuery);
    if (existingPage) {
      return NextResponse.json(
        { success: false, error: `Slug "${data.slug}" already exists` },
        { status: 400 }
      );
    }

    // Create page
    const page = new BookingPage({
      doctorId: doctorId || undefined,
      slug: data.slug,
      title: data.title,
      metaDescription: data.metaDescription || '',
      metaKeywords: data.metaKeywords || [],
      status: data.status || 'draft',
      sections: data.sections || [],
      consultationFee: data.consultationFee || 1000,
      bookingFee: data.bookingFee || 150,
      createdBy: 'admin',
    });

    // Auto-order sections
    if (page.sections && page.sections.length > 0) {
      page.reorderSections();
    }

    await page.save();

    return NextResponse.json({
      success: true,
      page,
      message: 'Booking page created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking page:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
