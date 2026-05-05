import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ReviewRequest from '@/models/ReviewRequest';

/**
 * POST /api/review/[trackingId]/feedback
 * Submit feedback from review interceptor (for low ratings)
 */
export async function POST(request, { params }) {
  try {
    const { trackingId } = await params;
    const { feedback } = await request.json();

    if (!feedback || feedback.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Feedback is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find review request
    const reviewRequest = await ReviewRequest.findByTrackingId(trackingId);

    if (!reviewRequest) {
      return NextResponse.json(
        { success: false, error: 'Review request not found' },
        { status: 404 }
      );
    }

    // Update with feedback
    reviewRequest.interceptorFeedback = feedback.trim();
    reviewRequest.status = 'intercepted';
    await reviewRequest.save();

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
    });
  } catch (error) {
    console.error('[Review Feedback] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
