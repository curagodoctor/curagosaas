import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GmbPost from '@/models/GmbPost';
import GmbConnection from '@/models/GmbConnection';
import { createPost } from '@/lib/gmb';

/**
 * GET /api/cron/gmb-publish
 * Cron job to publish scheduled GMB posts
 * Should be called every 5 minutes via Vercel Cron or external scheduler
 */
export async function GET(request) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find posts ready to publish
    const posts = await GmbPost.findReadyToPublish();

    if (posts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No posts to publish',
        published: 0,
      });
    }

    let published = 0;
    let failed = 0;
    const results = [];

    for (const post of posts) {
      try {
        // Update status to publishing
        post.status = 'publishing';
        await post.save();

        // Get connection
        const connection = post.gmbConnectionId;
        if (!connection || connection.status !== 'active') {
          throw new Error('GMB connection not active');
        }

        // Publish to GMB
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

        // Update post with success
        post.status = 'published';
        post.publishedAt = new Date();
        post.gmbPostId = result.name;
        post.gmbPostUrl = result.searchUrl;
        post.lastError = null;
        await post.save();

        published++;
        results.push({ id: post._id, status: 'published' });

      } catch (publishError) {
        console.error(`[GMB Cron] Failed to publish post ${post._id}:`, publishError);

        post.retryCount += 1;
        post.lastError = publishError.message;

        // Mark as failed after 3 retries
        if (post.retryCount >= 3) {
          post.status = 'failed';
        } else {
          post.status = 'scheduled'; // Keep scheduled for retry
        }

        await post.save();
        failed++;
        results.push({ id: post._id, status: 'failed', error: publishError.message });
      }
    }

    // Update last sync time for connections
    const connectionIds = [...new Set(posts.map(p => p.gmbConnectionId?._id?.toString()).filter(Boolean))];
    if (connectionIds.length > 0) {
      await GmbConnection.updateMany(
        { _id: { $in: connectionIds } },
        { lastSyncAt: new Date() }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${posts.length} posts`,
      published,
      failed,
      results,
    });

  } catch (error) {
    console.error('[GMB Cron] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Cron job failed' },
      { status: 500 }
    );
  }
}

// Allow POST as well for flexibility
export async function POST(request) {
  return GET(request);
}
