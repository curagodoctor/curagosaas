"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ScheduleConfirmation() {
  const [bookingInfo, setBookingInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get booking info from sessionStorage
    const storedInfo = sessionStorage.getItem("bookingInfo");
    if (storedInfo) {
      setBookingInfo(JSON.parse(storedInfo));
      // Clear sessionStorage after reading
      sessionStorage.removeItem("bookingInfo");
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-beige-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-primary-700 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!bookingInfo) {
    return (
      <div className="min-h-screen bg-beige-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-primary-900 mb-4">
            No Booking Found
          </h1>
          <p className="text-primary-700 mb-6">
            It looks like you haven't made a booking yet.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Book Consultation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-beige-50 to-white">
      <main className="container mx-auto px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          {/* Success Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 animate-slide-up">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4 text-center">
              Thank You!
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-green-600 mb-6 text-center">
              Your Booking is Confirmed.
            </h2>
            <p className="text-center text-primary-800 mb-8 text-lg">
              We have received your request for a consultation with Dr. Yuvaraj T.
            </p>

            {/* Booking Details */}
            <div className="bg-beige-50 rounded-2xl p-6 md:p-8 mb-6 border-2 border-primary-200">
              <h2 className="text-xl font-bold text-primary-900 mb-4">
                Your Booking Details
              </h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-primary-700 font-semibold w-32">Name:</span>
                  <span className="text-primary-900">{bookingInfo.name}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-primary-700 font-semibold w-32">Date:</span>
                  <span className="text-primary-900">{bookingInfo.date}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-primary-700 font-semibold w-32">Time:</span>
                  <span className="text-primary-900">{bookingInfo.time}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-primary-700 font-semibold w-32">Mode:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      bookingInfo.mode === "online"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {bookingInfo.mode === "online" ? "Online" : "In Clinic"}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Steps Section */}
            <div className="bg-white rounded-2xl p-6 md:p-8 mb-6 border-2 border-primary-200">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">
                Next Steps for Your Consultation
              </h2>

              <div className="space-y-6">
                {/* For Online Consultations */}
                {bookingInfo.mode === "online" && (
                  <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-200">
                    <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      For Online Consultations
                    </h3>
                    <p className="text-blue-800 mb-3">
                      A secure meeting link has been sent to your registered email address. Please check your <strong>Inbox or Spam</strong> folder for the invitation.
                    </p>
                    {bookingInfo.meetLink && (
                      <a
                        href={bookingInfo.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Join Meeting
                      </a>
                    )}
                  </div>
                )}

                {/* For In-Clinic Consultations */}
                {bookingInfo.mode === "in-clinic" && (
                  <div className="bg-green-50 rounded-xl p-5 border-2 border-green-200">
                    <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      For In-Clinic (Offline) Consultations
                    </h3>
                    <p className="text-green-800">
                      When you arrive at <strong>SRV Hospital, Chembur</strong>, please inform the reception counter that you have a <strong>CuraGo pre-booked consultation</strong> with Dr. Yuvaraj.
                    </p>
                  </div>
                )}

                {/* Documentation */}
                <div className="bg-accent-50 rounded-xl p-5 border-2 border-accent-200">
                  <h3 className="font-bold text-primary-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Documentation
                  </h3>
                  <p className="text-primary-800">
                    Your official invoice and booking summary are currently being sent to your provided email ID.
                  </p>
                </div>
              </div>
            </div>

            {/* Important Guidelines */}
            <div className="bg-yellow-50 rounded-2xl p-6 md:p-8 mb-6 border-2 border-yellow-200">
              <h2 className="text-2xl font-bold text-yellow-900 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Important Guidelines
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-yellow-900 mb-1">Punctuality</h3>
                    <p className="text-yellow-800">
                      Please show up exactly on time. There are other patients lined up, and sticking to your scheduled slot ensures a faster, more efficient consultation for everyone.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-yellow-900 mb-1">Preparation</h3>
                    <p className="text-yellow-800">
                      Keep your previous reports (Scans, Endoscopy, or Blood Tests) ready for review during the session.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-primary-200 my-8" />

            {/* Need Assistance Section */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-primary-900 mb-4">
                Need Assistance?
              </h3>
              <p className="text-primary-700 mb-6">
                If you face any difficulties or need to reschedule, reach out to our team immediately.
              </p>
              <a
                href="https://wa.me/918369743571?text=Hi%2C%20I%20have%20booked%20a%20consultation%20via%20CuraGo.%20Please%20guide%20me%20with%20the%20next%20steps."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                CHAT NOW
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
