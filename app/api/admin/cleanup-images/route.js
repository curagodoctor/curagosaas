import { NextResponse } from 'next/server';
import { readdir, unlink, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import connectDB from '@/lib/mongodb';
import BookingPage from '@/models/BookingPage';
import { isAuthenticated } from '@/lib/auth';

// Helper function to extract all image URLs from all pages
async function getAllUsedImageUrls() {
  await connectDB();

  const pages = await BookingPage.find({}).select('sections').lean();
  const urls = new Set();

  pages.forEach(page => {
    page.sections?.forEach(section => {
      const config = section.config || {};

      // Single image fields
      if (config.imageUrl) urls.add(config.imageUrl);

      // Image arrays
      if (Array.isArray(config.images)) {
        config.images.forEach(img => {
          if (typeof img === 'string') urls.add(img);
          else if (img?.url) urls.add(img.url);
        });
      }

      // Testimonials with images
      if (Array.isArray(config.testimonials)) {
        config.testimonials.forEach(t => {
          if (t?.imageUrl) urls.add(t.imageUrl);
        });
      }

      // Benefits/items with icons
      if (Array.isArray(config.items)) {
        config.items.forEach(item => {
          if (item?.iconUrl) urls.add(item.iconUrl);
          if (item?.imageUrl) urls.add(item.imageUrl);
        });
      }

      // Disease icons
      if (Array.isArray(config.icons)) {
        config.icons.forEach(icon => {
          if (typeof icon === 'string') urls.add(icon);
          else if (icon?.url) urls.add(icon.url);
        });
      }
    });
  });

  return Array.from(urls).filter(url => url && url.startsWith('/uploads/'));
}

// Helper function to get all files in uploads directory
async function getAllUploadedFiles() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'booking-pages');

  if (!existsSync(uploadsDir)) {
    return [];
  }

  const files = [];

  async function scanDir(dir) {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scanDir(fullPath);
      } else {
        // Convert to URL format
        const relativePath = fullPath.replace(path.join(process.cwd(), 'public'), '').replace(/\\/g, '/');
        files.push(relativePath);
      }
    }
  }

  await scanDir(uploadsDir);
  return files;
}

// POST - Cleanup orphaned images
export async function POST(request) {
  try {
    // Check authentication
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get action from request body
    const { action } = await request.json();

    // Get all used image URLs from database
    const usedUrls = await getAllUsedImageUrls();
    const usedSet = new Set(usedUrls);

    // Get all uploaded files
    const allFiles = await getAllUploadedFiles();

    // Find orphaned files
    const orphanedFiles = allFiles.filter(file => !usedSet.has(file));

    if (action === 'scan') {
      // Just return the list without deleting
      return NextResponse.json({
        success: true,
        orphanedFiles,
        orphanedCount: orphanedFiles.length,
        totalFiles: allFiles.length,
        usedFiles: allFiles.length - orphanedFiles.length,
      });
    }

    if (action === 'delete') {
      // Delete orphaned files
      const deleted = [];
      const errors = [];

      for (const fileUrl of orphanedFiles) {
        try {
          const filePath = path.join(process.cwd(), 'public', fileUrl);

          if (existsSync(filePath)) {
            await unlink(filePath);
            deleted.push(fileUrl);
          }
        } catch (error) {
          console.error('Error deleting file:', fileUrl, error);
          errors.push({ file: fileUrl, error: error.message });
        }
      }

      return NextResponse.json({
        success: true,
        deleted: deleted.length,
        errors: errors.length,
        deletedFiles: deleted,
        errorFiles: errors,
        message: `Cleaned up ${deleted.length} orphaned images`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "scan" or "delete"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error cleaning up images:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
