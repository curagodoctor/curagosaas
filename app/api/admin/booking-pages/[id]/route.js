import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BookingPage from '@/models/BookingPage';
import Booking from '@/models/Booking';
import { isAuthenticated } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Helper function to extract all image URLs from a page
function extractImageUrls(page) {
  const urls = [];

  page.sections?.forEach(section => {
    const config = section.config || {};

    // Single image fields
    if (config.imageUrl) urls.push(config.imageUrl);

    // Image arrays (hero carousel, etc.)
    if (Array.isArray(config.images)) {
      config.images.forEach(img => {
        if (typeof img === 'string') urls.push(img);
        else if (img?.url) urls.push(img.url);
      });
    }

    // Testimonials with images
    if (Array.isArray(config.testimonials)) {
      config.testimonials.forEach(t => {
        if (t?.imageUrl) urls.push(t.imageUrl);
      });
    }

    // Benefits/items with icons
    if (Array.isArray(config.items)) {
      config.items.forEach(item => {
        if (item?.iconUrl) urls.push(item.iconUrl);
        if (item?.imageUrl) urls.push(item.imageUrl);
      });
    }

    // Disease icons
    if (Array.isArray(config.icons)) {
      config.icons.forEach(icon => {
        if (typeof icon === 'string') urls.push(icon);
        else if (icon?.url) urls.push(icon.url);
      });
    }
  });

  return urls.filter(url => url && url.startsWith('/uploads/'));
}

// Helper function to delete image file from disk
async function deleteImageFile(imageUrl) {
  try {
    if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;

    const filePath = path.join(process.cwd(), 'public', imageUrl);

    if (existsSync(filePath)) {
      await unlink(filePath);
      console.log('Deleted image:', imageUrl);
    }
  } catch (error) {
    console.error('Error deleting image file:', imageUrl, error);
    // Don't throw - continue even if file deletion fails
  }
}

// Helper function to delete all images from a page
async function deletePageImages(page) {
  const imageUrls = extractImageUrls(page);
  await Promise.all(imageUrls.map(url => deleteImageFile(url)));
  return imageUrls.length;
}

// GET - Get single booking page
export async function GET(request, { params }) {
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
    const page = await BookingPage.findById(id);

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
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
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update booking page
export async function PATCH(request, { params }) {
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
    const updates = await request.json();

    // Check if slug is being updated and if it already exists
    if (updates.slug) {
      const existingPage = await BookingPage.findOne({
        slug: updates.slug,
        _id: { $ne: id },
      });

      if (existingPage) {
        return NextResponse.json(
          { success: false, error: `Slug "${updates.slug}" already exists` },
          { status: 400 }
        );
      }

      // Check for reserved slugs
      const reservedSlugs = ['api', 'admin', '_next', 'main'];
      if (reservedSlugs.includes(updates.slug.toLowerCase())) {
        return NextResponse.json(
          { success: false, error: `Slug "${updates.slug}" is reserved. Please choose another.` },
          { status: 400 }
        );
      }
    }

    // Find and update page
    const page = await BookingPage.findById(id);

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    // Track old images before update (for cleanup)
    const oldImages = extractImageUrls(page);

    // Update fields
    Object.keys(updates).forEach((key) => {
      if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt') {
        // Special handling for sections to remove temp IDs
        if (key === 'sections' && Array.isArray(updates[key])) {
          page[key] = updates[key].map(section => {
            const cleanSection = { ...section };
            // Remove _id if it's a temporary ID (starts with 'temp_')
            if (cleanSection._id && typeof cleanSection._id === 'string' && cleanSection._id.startsWith('temp_')) {
              delete cleanSection._id;
            }
            return cleanSection;
          });
        } else {
          page[key] = updates[key];
        }
      }
    });

    // After updating, find orphaned images and delete them
    const newImages = extractImageUrls(page);
    const orphanedImages = oldImages.filter(url => !newImages.includes(url));

    // Delete orphaned images in the background (don't wait)
    if (orphanedImages.length > 0) {
      Promise.all(orphanedImages.map(url => deleteImageFile(url)))
        .then(() => console.log(`Cleaned up ${orphanedImages.length} orphaned images`))
        .catch(err => console.error('Error cleaning orphaned images:', err));
    }

    // Auto-order sections if they were updated
    if (updates.sections) {
      page.reorderSections();
    }

    // Set publishedAt if status changed to published
    if (updates.status === 'published' && page.status !== 'published') {
      page.publishedAt = new Date();
    }

    await page.save();

    return NextResponse.json({
      success: true,
      page,
      message: 'Page updated successfully',
    });
  } catch (error) {
    console.error('Error updating booking page:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete/Archive booking page
export async function DELETE(request, { params }) {
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
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    const page = await BookingPage.findById(id);

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    // Check if page has bookings
    const bookingCount = await Booking.countDocuments({
      status: 'confirmed',
    });

    // If has bookings and not hard delete, archive instead
    if (bookingCount > 0 && !hardDelete) {
      page.status = 'archived';
      await page.save();

      return NextResponse.json({
        success: true,
        message: `Page archived (has ${bookingCount} confirmed bookings)`,
        archived: true,
      });
    }

    // Hard delete or no bookings
    if (hardDelete) {
      // Delete all associated images before deleting the page
      const deletedImagesCount = await deletePageImages(page);

      await BookingPage.findByIdAndDelete(id);

      return NextResponse.json({
        success: true,
        message: `Page deleted permanently (${deletedImagesCount} images cleaned up)`,
        deletedImages: deletedImagesCount,
      });
    } else {
      // Soft delete (archive) - keep images
      page.status = 'archived';
      await page.save();
      return NextResponse.json({
        success: true,
        message: 'Page archived (images preserved)',
        archived: true,
      });
    }
  } catch (error) {
    console.error('Error deleting booking page:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
