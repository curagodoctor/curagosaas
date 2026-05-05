'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function ReviewInterceptorPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestData, setRequestData] = useState(null);
  const [step, setStep] = useState('rating'); // 'rating', 'feedback', 'redirect', 'thanks'
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    trackClick();
  }, []);

  const trackClick = async () => {
    try {
      const res = await fetch(`/api/review/${params.trackingId}/click`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        setRequestData(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSelect = async (rating) => {
    setSelectedRating(rating);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/review/${params.trackingId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      const data = await res.json();

      if (data.success) {
        if (rating >= 4) {
          // Redirect to Google review
          setStep('redirect');
          setTimeout(() => {
            if (data.reviewUrl) {
              window.location.href = data.reviewUrl;
            }
          }, 2000);
        } else {
          // Show feedback form
          setStep('feedback');
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/review/${params.trackingId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      const data = await res.json();

      if (data.success) {
        setStep('thanks');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin text-4xl text-[#096b17] mb-4">&#9696;</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#096b17]/5 to-[#096b17]/10 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        {/* Logo/Clinic Name */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">{requestData?.businessName || 'Our Clinic'}</h2>
        </div>

        {/* Rating Step */}
        {step === 'rating' && (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Hi {requestData?.patientName?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-gray-600 mb-8">
              How would you rate your recent experience with us?
            </p>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingSelect(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={submitting}
                  className="p-2 transition-transform hover:scale-110 disabled:opacity-50"
                >
                  <svg
                    className={`w-12 h-12 transition-colors ${
                      star <= (hoveredRating || selectedRating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                    fill={star <= (hoveredRating || selectedRating) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-500">Tap a star to rate</p>
          </div>
        )}

        {/* Feedback Step (for low ratings) */}
        {step === 'feedback' && (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              We're sorry to hear that
            </h1>
            <p className="text-gray-600 mb-6">
              Please share what went wrong so we can improve.
            </p>

            <form onSubmit={handleFeedbackSubmit}>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={5}
                placeholder="Tell us about your experience..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17]/20 focus:border-[#096b17] resize-none mb-4"
              />

              <button
                type="submit"
                disabled={submitting || !feedback.trim()}
                className="w-full py-3 bg-[#096b17] text-white font-medium rounded-lg hover:bg-[#075212] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>

            <p className="text-sm text-gray-500 mt-4">
              Your feedback is private and helps us improve.
            </p>
          </div>
        )}

        {/* Redirect Step (for high ratings) */}
        {step === 'redirect' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thank you for your {selectedRating}-star rating!
            </h1>
            <p className="text-gray-600 mb-6">
              We're thrilled you had a great experience. Redirecting you to Google to share your review...
            </p>
            <div className="animate-spin w-8 h-8 mx-auto border-2 border-[#096b17] border-t-transparent rounded-full" />
          </div>
        )}

        {/* Thanks Step (after feedback) */}
        {step === 'thanks' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#096b17]/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#096b17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thank you for your feedback
            </h1>
            <p className="text-gray-600">
              We appreciate you taking the time to share your experience. Your feedback helps us improve our services.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
