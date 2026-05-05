import { NextResponse } from 'next/server';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import connectDB from '@/lib/mongodb';
import GmbPost from '@/models/GmbPost';
import { deletePost as deleteGmbPost } from '@/lib/gmb';

/**
 * GET /api/doctor/gmb/posts/[id]
 * Get a single post
 */
export async function GET(request, { params }) {
  try {
    const doctor = await requireDoctorAuth(request);
    const { id } = await params;

    await connectDB();

    const post = await GmbPost.findOne({
      _id: id,
      doctorId: doctor._id,
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error('[GMB Post GET] Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Please login to continue' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get post' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/doctor/gmb/posts/[id]
 * Update a post (only if not published)
 */
export async function PATCH(request, { params }) {
  try {
    const doctor = await requireDoctorAuth(request);
    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const post = await GmbPost.findOne({
      _id: id,
      doctorId: doctor._id,
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Can only edit draft or scheduled posts
    if (!['draft', 'scheduled'].includes(post.status)) {
      return NextResponse.json(
        { success: false, error: 'Cannot edit a published or failed post' },
        { status: 400 }
      );
    }

    // Update allowed fields
    const allowedFields = [
      'content', 'mediaType', 'mediaUrl', 'postType',
      'eventTitle', 'eventStartDate', 'eventEndDate',
      'offerTitle', 'offerTerms', 'couponCode', 'redeemUrl',
      'offerStartDate', 'offerEndDate',
      'ctaType', 'ctaUrl', 'scheduledAt', 'status',
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        post[field] = body[field];
      }
    });

    // Validate content
    if (post.content && post.content.length > 1500) {
      return NextResponse.json(
        { success: false, error: 'Post content cannot exceed 1500 characters' },
        { status: 400 }
      );
    }

    await post.save();

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error('[GMB Post PATCH] Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Please login to continue' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update post' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/doctor/gmb/posts/[id]
 * Delete a post
 */
export async function DELETE(request, { params }) {
  try {
    const doctor = await requireDoctorAuth(request);
    const { id } = await params;

    await connectDB();

    const post = await GmbPost.findOne({
      _id: id,
      doctorId: doctor._id,
    }).populate('gmbConnectionId');

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // If published on GMB, try to delete from GMB first
    if (post.status === 'published' && post.gmbPostId) {
      try {
        await deleteGmbPost(post.gmbConnectionId._id, post.gmbPostId);
      } catch (gmbError) {
        console.error('[GMB Post DELETE] GMB delete error:', gmbError);
        // Continue to delete locally even if GMB delete fails
      }
    }

    // Update status to deleted (soft delete)
    post.status = 'deleted';
    await post.save();

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('[GMB Post DELETE] Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Please login to continue' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete post' },
      { status: 500 }
    );
  }
}
