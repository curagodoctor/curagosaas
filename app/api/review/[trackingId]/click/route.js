import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ReviewRequest from '@/models/ReviewRequest';
import GmbConnection from '@/models/GmbConnection';

/**
 * POST /api/review/[trackingId]/click
 * Track when a patient clicks the review link
 */
export async function POST(request, { params }) {
  try {
    const { trackingId } = await params;

    await connectDB();

    // Find review request
    const reviewRequest = await ReviewRequest.findByTrackingId(trackingId)
      .populate('gmbConnectionId', 'businessName locationName');

    if (!reviewRequest) {
      return NextResponse.json(
        { success: false, error: 'Review request not found or expired' },
        { status: 404 }
      );
    }

    // Check if already reviewed or intercepted
    if (['reviewed', 'intercepted'].includes(reviewRequest.status)) {
      return NextResponse.json(
        { success: false, error: 'This review link has already been used' },
        { status: 400 }
      );
    }

    // Update click tracking
    reviewRequest.clickedAt = reviewRequest.clickedAt || new Date();
    reviewRequest.clickCount += 1;
    if (reviewRequest.status === 'sent' || reviewRequest.status === 'delivered') {
      reviewRequest.status = 'clicked';
    }
    await reviewRequest.save();

    return NextResponse.json({
      success: true,
      data: {
        patientName: reviewRequest.patientName,
        businessName: reviewRequest.gmbConnectionId?.businessName || 'Our Clinic',
      },
    });
  } catch (error) {
    console.error('[Review Click] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
