import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BookingPage from '@/models/BookingPage';
import { isAuthenticated } from '@/lib/auth';

// Clinic configurations to migrate (using actual slugs from database)
const clinicConfigs = {
  'gs': {
    category: 'myclinic',
    displayName: 'Gallbladder Clinic',
    shortDescription: 'Specialized care for gallbladder conditions including gallstones, cholecystitis, and biliary disorders.',
    displayOrder: 1,
    iconType: 'gallbladder',
    colorScheme: 'green',
    showInNavbar: true,
  },
  'ibsconsult': {
    category: 'myclinic',
    displayName: 'IBS Clinic',
    shortDescription: 'Expert management of Irritable Bowel Syndrome with personalized treatment plans and dietary guidance.',
    displayOrder: 2,
    iconType: 'ibs',
    colorScheme: 'blue',
    showInNavbar: true,
  },
  'second-opinion': {
    category: 'myclinic',
    displayName: 'Second Opinion Clinic',
    shortDescription: 'Get expert second opinions on your diagnosis and treatment plans from Dr. Yuvaraj.',
    displayOrder: 3,
    iconType: 'second-opinion',
    colorScheme: 'purple',
    showInNavbar: true,
  },
  'online-consult': {
    category: 'myclinic',
    displayName: 'Online Clinic',
    shortDescription: 'Convenient video consultations from the comfort of your home. Available across India.',
    displayOrder: 4,
    iconType: 'online',
    colorScheme: 'orange',
    showInNavbar: true,
  },
};

// POST - Run migration to update clinic pages
export async function POST(request) {
  try {
    // Check authentication
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const results = [];

    for (const [slug, config] of Object.entries(clinicConfigs)) {
      const page = await BookingPage.findOne({ slug });

      if (page) {
        // Update the page with new fields
        Object.assign(page, config);
        await page.save();
        results.push({ slug, status: 'updated', id: page._id });
      } else {
        results.push({ slug, status: 'not_found' });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results,
    });
  } catch (error) {
    console.error('Error running migration:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET - Check current status of clinic pages
export async function GET(request) {
  try {
    // Check authentication
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const slugs = Object.keys(clinicConfigs);
    const pages = await BookingPage.find({ slug: { $in: slugs } })
      .select('slug title category showInNavbar displayName iconType colorScheme status');

    return NextResponse.json({
      success: true,
      pages,
      expectedSlugs: slugs,
    });
  } catch (error) {
    console.error('Error checking clinic pages:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
