import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BookingPage from '@/models/BookingPage';

// GET - Fetch clinics for navbar and homepage
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'myclinic';
    const navbarOnly = searchParams.get('navbar') === 'true';

    // Build query
    const query = {
      status: 'published',
      category: category,
    };

    // If navbar-only, only fetch pages marked for navbar display
    if (navbarOnly) {
      query.showInNavbar = true;
    }

    const clinics = await BookingPage.find(query)
      .select('slug title displayName shortDescription metaDescription iconType colorScheme displayOrder')
      .sort({ displayOrder: 1, createdAt: -1 });

    // Map to simplified format for frontend
    const formattedClinics = clinics.map(clinic => ({
      name: clinic.displayName || clinic.title,
      slug: clinic.slug,
      href: `/myclinic/${clinic.slug}`,
      description: clinic.shortDescription || clinic.metaDescription || '',
      iconType: clinic.iconType || 'custom',
      colorScheme: clinic.colorScheme || 'blue',
      displayOrder: clinic.displayOrder,
    }));

    return NextResponse.json({
      success: true,
      clinics: formattedClinics,
    });
  } catch (error) {
    console.error('Error fetching clinics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
