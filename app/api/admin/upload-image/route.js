import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { isAuthenticated } from '@/lib/auth';

// POST - Upload image to Vercel Blob Storage
export async function POST(request) {
  try {
    // Check authentication
    if (!(await isAuthenticated(request))) {
      console.error('❌ Unauthorized upload attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if Blob token is available
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN is not configured');
      return NextResponse.json(
        { success: false, error: 'Blob storage is not configured. Please set BLOB_READ_WRITE_TOKEN in environment variables.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const slug = formData.get('slug') || formData.get('folder') || 'general';

    console.log('📤 Upload request received:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      slug: slug
    });

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-z0-9]/gi, '-') // Replace special chars with dash
      .toLowerCase()
      .substring(0, 50); // Limit length
    const filename = `${sanitizedName}-${timestamp}-${randomString}.${extension}`;

    // Create blob path with folder structure
    const blobPath = `booking-pages/${slug}/${filename}`;
    console.log('📁 Blob path:', blobPath);

    // Upload to Vercel Blob
    console.log('☁️  Uploading to Vercel Blob...');
    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log('✅ Upload successful:', {
      url: blob.url,
      size: blob.size,
      pathname: blob.pathname
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename,
      size: file.size,
      type: file.type,
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    console.error('❌ Error uploading image:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
