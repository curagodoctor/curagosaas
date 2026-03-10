import { NextResponse } from 'next/server';
import { getCurrentDoctor } from '@/lib/doctorAuth';
import BookingPage from '@/models/BookingPage';
import connectDB from '@/lib/mongodb';

// GET - List all booking pages for the current doctor
export async function GET(request) {
  try {
    await connectDB();

    const doctor = await getCurrentDoctor(request);

    if (!doctor) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query - ALWAYS filter by doctorId
    const query = { doctorId: doctor._id };

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
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new booking page for the current doctor
export async function POST(request) {
  try {
    await connectDB();

    const doctor = await getCurrentDoctor(request);

    if (!doctor) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // For multi-tenant, the slug must be unique per doctor
    // We can use a simple slug since each doctor has their own subdomain
    const slug = data.slug || 'main';
    const title = data.title || `${doctor.displayName || doctor.name}'s Clinic`;

    // Check if slug already exists for this doctor
    const existingPage = await BookingPage.findOne({
      doctorId: doctor._id,
      slug: slug
    });

    if (existingPage) {
      return NextResponse.json(
        { error: `You already have a page with slug "${slug}"` },
        { status: 400 }
      );
    }

    // Create default sections for a new clinic page
    const defaultSections = data.sections || [
      {
        type: 'hero',
        enabled: true,
        order: 0,
        settings: {
          title: doctor.displayName || doctor.name,
          subtitle: doctor.specialization || 'Healthcare Professional',
          showBookButton: true,
          bookButtonText: 'Book Appointment',
        },
      },
      {
        type: 'about',
        enabled: true,
        order: 1,
        settings: {
          title: 'About',
          content: doctor.bio || 'Welcome to my clinic. Book an appointment to get started.',
        },
      },
      {
        type: 'booking-form',
        enabled: true,
        order: 2,
        settings: {
          title: 'Book an Appointment',
        },
      },
    ];

    // Create page with doctorId
    const page = new BookingPage({
      slug,
      title,
      doctorId: doctor._id,
      metaDescription: data.metaDescription || `Book an appointment with ${doctor.displayName || doctor.name}`,
      metaKeywords: data.metaKeywords || [doctor.specialization, 'doctor', 'appointment'].filter(Boolean),
      status: data.status || 'published', // Auto-publish for doctors
      sections: defaultSections,
      consultationFee: data.consultationFee || 0,
      bookingFee: data.bookingFee || 0,
      createdBy: doctor._id.toString(),
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
      { error: error.message },
      { status: 500 }
    );
  }
}
