import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ReviewRequest from '@/models/ReviewRequest';
import GmbConnection from '@/models/GmbConnection';
import { buildReviewLink } from '@/lib/gmb';

/**
 * POST /api/review/[trackingId]/rating
 * Submit rating from review interceptor
 */
export async function POST(request, { params }) {
  try {
    const { trackingId } = await params;
    const { rating } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find review request
    const reviewRequest = await ReviewRequest.findByTrackingId(trackingId)
      .populate('gmbConnectionId');

    if (!reviewRequest) {
      return NextResponse.json(
        { success: false, error: 'Review request not found' },
        { status: 404 }
      );
    }

    // Check if already handled
    if (['reviewed', 'intercepted'].includes(reviewRequest.status)) {
      return NextResponse.json(
        { success: false, error: 'This review has already been submitted' },
        { status: 400 }
      );
    }

    // Update review request
    reviewRequest.interceptorRating = rating;
    reviewRequest.interceptedAt = new Date();

    // If rating is 4+, redirect to Google review
    if (rating >= 4) {
      reviewRequest.redirectedToGoogle = true;
      reviewRequest.status = 'intercepted';
      await reviewRequest.save();

      // Get GMB place ID for review link
      const connection = reviewRequest.gmbConnectionId;

      // Build review URL
      let reviewUrl;
      if (connection?.placeId) {
        reviewUrl = buildReviewLink(connection.placeId);
      } else if (connection?.businessName) {
        // Fallback: Search for business on Google
        reviewUrl = `https://search.google.com/local/reviews?placeid=&q=${encodeURIComponent(connection.businessName)}`;
      } else {
        reviewUrl = 'https://www.google.com/maps';
      }

      return NextResponse.json({
        success: true,
        redirectToGoogle: true,
        reviewUrl,
      });
    } else {
      // Low rating - show feedback form
      reviewRequest.status = 'intercepted';
      await reviewRequest.save();

      return NextResponse.json({
        success: true,
        redirectToGoogle: false,
        showFeedback: true,
      });
    }
  } catch (error) {
    console.error('[Review Rating] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}
