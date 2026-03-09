"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackPurchase } from "@/lib/tracking";

function PaymentStatusHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasVerifiedRef = useRef(false);

  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    if (hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;

    const verifyPayment = async () => {
      try {
        const paymentId =
          searchParams.get("razorpay_payment_id") ||
          searchParams.get("payment_id");

        if (!paymentId) {
          setStatus("error");
          setMessage("Payment ID missing. Please try again.");
          return;
        }

        const reservationId = sessionStorage.getItem("reservationId");
        const bookingData = sessionStorage.getItem("pendingBooking");

        if (!reservationId || !bookingData) {
          setStatus("error");
          setMessage(
            "Booking information not found. Please contact support."
          );
          return;
        }

        let booking;
        try {
          booking = JSON.parse(bookingData);
        } catch {
          setStatus("error");
          setMessage("Corrupted booking data. Please contact support.");
          return;
        }

        const response = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id: paymentId,
            reservationId,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data?.success) {
          setStatus("error");
          setMessage(
            data?.error || "Payment verification failed. Please contact support."
          );
          return;
        }

        sessionStorage.setItem(
          "bookingInfo",
          JSON.stringify({
            name: booking.name,
            date: booking.date,
            time: booking.time,
            mode: booking.mode,
            meetLink: data.booking?.meetLink,
            paymentId: data.booking?.paymentId,
          })
        );

        sessionStorage.removeItem("reservationId");
        sessionStorage.removeItem("pendingBooking");

        // Track purchase event
        trackPurchase(
          paymentId,
          150,
          {
            date: booking.date,
            time: booking.time,
            mode: booking.mode
          }
        );

        setStatus("success");
        setMessage("Payment verified successfully! Redirecting...");

        setTimeout(() => {
          router.replace("/schedule-confirmation");
        }, 1500);
      } catch (err) {
        console.error("Payment verification error:", err);
        setStatus("error");
        setMessage(
          "Something went wrong while verifying payment. Please contact support."
        );
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-beige-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        {status === "processing" && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-primary-900 mb-2">
              Processing Payment
            </h1>
            <p className="text-primary-700">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-600"
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
            <h1 className="text-2xl font-bold text-green-600 mb-2">
              Payment Successful
            </h1>
            <p className="text-primary-700">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              Payment Failed
            </h1>
            <p className="text-primary-700 mb-6">{message}</p>
            <button
              onClick={() => router.replace("/")}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-beige-50 flex items-center justify-center px-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-primary-900 mb-2">
              Loading...
            </h1>
          </div>
        </div>
      }
    >
      <PaymentStatusHandler />
    </Suspense>
  );
}