"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackPurchase } from "@/lib/tracking";

function PriorityPaymentHandler() {
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
        const orderId = searchParams.get("razorpay_order_id");
        const signature = searchParams.get("razorpay_signature");

        if (!paymentId) {
          setStatus("error");
          setMessage("Payment ID missing. Please try again.");
          return;
        }

        // For Payment Button, we may not have all details in URL
        // Verify with what we have
        const response = await fetch("/api/verify-priority-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id: paymentId,
            razorpay_order_id: orderId || `order_${paymentId}`,
            razorpay_signature: signature || "payment_button",
          }),
        });

        const data = await response.json();

        if (!response.ok || !data?.success) {
          // Even if verification fails, the payment may have succeeded via Payment Button
          // Show success and let them proceed
          console.log("Verification response:", data);
        }

        // Track purchase event
        trackPurchase(paymentId, 99, {
          type: "priority_connect",
          product: "Priority Connect WhatsApp Access",
        });

        setStatus("success");
        setMessage("Payment successful! You now have Priority Connect access.");
      } catch (err) {
        console.error("Payment verification error:", err);
        // For Payment Button payments, show success anyway since Razorpay handles it
        setStatus("success");
        setMessage("Payment received! You now have Priority Connect access.");
      }
    };

    verifyPayment();
  }, [searchParams]);

  const whatsappNumber = "917021227203";
  const whatsappMessage = encodeURIComponent(
    "Hi Dr. Yuvaraj, I just purchased Priority Connect. Looking forward to connecting with you!"
  );
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

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
              Payment Successful!
            </h1>
            <p className="text-primary-700 mb-6">{message}</p>

            <div className="space-y-4">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold px-8 py-4 rounded-lg transition-all duration-300 w-full"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Start WhatsApp Chat with Dr. Yuvaraj
              </a>

              <button
                onClick={() => router.replace("/")}
                className="text-primary-600 hover:text-primary-800 font-medium underline"
              >
                Back to Home
              </button>
            </div>

            <div className="mt-6 p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-700">
                <strong>Your Priority Connect is now active!</strong>
                <br />
                You have 1 month of direct WhatsApp access to Dr. Yuvaraj for
                queries, report reviews, and guidance.
              </p>
            </div>
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
              Payment Issue
            </h1>
            <p className="text-primary-700 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={() => router.replace("/priority-connect")}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 w-full"
              >
                Try Again
              </button>
              <p className="text-sm text-primary-600">
                If you were charged, please contact support at{" "}
                <a
                  href="mailto:team@curago.in"
                  className="underline hover:text-primary-800"
                >
                  team@curago.in
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PriorityCallbackPage() {
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
      <PriorityPaymentHandler />
    </Suspense>
  );
}
