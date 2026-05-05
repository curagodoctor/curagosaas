import { NextResponse } from 'next/server';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import connectDB from '@/lib/mongodb';
import GmbConnection from '@/models/GmbConnection';
import GmbPost from '@/models/GmbPost';
import { createPost } from '@/lib/gmb';

/**
 * GET /api/doctor/gmb/posts
 * Get all posts for the doctor
 */
export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    await connectDB();

    // Build query
    const query = { doctorId: doctor._id };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Get posts with pagination
    const [posts, total] = await Promise.all([
      GmbPost.find(query)
        .sort({ scheduledAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      GmbPost.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[GMB Posts GET] Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Please login to continue' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get posts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/doctor/gmb/posts
 * Create a new post
 */
export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    const body = await request.json();

    await connectDB();

    // Get active GMB connection
    const connection = await GmbConnection.findActiveByDoctor(doctor._id);
    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'No GMB connection found. Please connect your Google Business account.' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Post content is required' },
        { status: 400 }
      );
    }

    if (body.content.length > 1500) {
      return NextResponse.json(
        { success: false, error: 'Post content cannot exceed 1500 characters' },
        { status: 400 }
      );
    }

    // Parse scheduled date
    let scheduledAt = new Date();
    if (body.scheduledAt) {
      scheduledAt = new Date(body.scheduledAt);
      if (isNaN(scheduledAt.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid scheduled date' },
          { status: 400 }
        );
      }
    }

    // Determine initial status
    const isImmediate = !body.scheduledAt || scheduledAt <= new Date();
    const status = isImmediate ? 'publishing' : 'scheduled';

    // Create post record
    const post = await GmbPost.create({
      doctorId: doctor._id,
      gmbConnectionId: connection._id,
      content: body.content.trim(),
      mediaType: body.mediaType || 'none',
      mediaUrl: body.mediaUrl,
      postType: body.postType || 'STANDARD',
      eventTitle: body.eventTitle,
      eventStartDate: body.eventStartDate,
      eventEndDate: body.eventEndDate,
      offerTitle: body.offerTitle,
      offerTerms: body.offerTerms,
      couponCode: body.couponCode,
      redeemUrl: body.redeemUrl,
      offerStartDate: body.offerStartDate,
      offerEndDate: body.offerEndDate,
      ctaType: body.ctaType || 'NONE',
      ctaUrl: body.ctaUrl,
      scheduledAt,
      status,
    });

    // If publishing immediately, attempt to publish now
    if (isImmediate) {
      try {
        const result = await createPost(connection._id, connection.locationId, {
          content: post.content,
          mediaType: post.mediaType,
          mediaUrl: post.mediaUrl,
          postType: post.postType,
          eventTitle: post.eventTitle,
          eventStartDate: post.eventStartDate,
          eventEndDate: post.eventEndDate,
          offerTitle: post.offerTitle,
          offerTerms: post.offerTerms,
          couponCode: post.couponCode,
          redeemUrl: post.redeemUrl,
          ctaType: post.ctaType,
          ctaUrl: post.ctaUrl,
        });

        post.status = 'published';
        post.publishedAt = new Date();
        post.gmbPostId = result.name;
        post.gmbPostUrl = result.searchUrl;
        await post.save();
      } catch (publishError) {
        console.error('[GMB Posts] Publish error:', publishError);
        post.status = 'failed';
        post.lastError = publishError.message;
        post.retryCount = 1;
        await post.save();

        return NextResponse.json({
          success: true,
          post,
          warning: 'Post created but failed to publish: ' + publishError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      post,
      message: isImmediate ? 'Post published successfully' : 'Post scheduled successfully',
    });
  } catch (error) {
    console.error('[GMB Posts POST] Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Please login to continue' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create post' },
      { status: 500 }
    );
  }
}
