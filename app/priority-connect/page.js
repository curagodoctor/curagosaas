"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/booking-page/sections/FooterSection";
import { trackPageView, trackButtonClick } from "@/lib/tracking";

const RazorpayButton = () => {
  const formRef = useRef(null);

  useEffect(() => {
    if (formRef.current && formRef.current.children.length === 0) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/payment-button.js";
      script.setAttribute("data-payment_button_id", "pl_SAxva2loHAV71c");
      script.async = true;
      formRef.current.appendChild(script);
    }
  }, []);

  return <form ref={formRef}></form>;
};

export default function PriorityConnectPage() {
  useEffect(() => {
    trackPageView("Priority Connect", "/priority-connect");
  }, []);

  const benefits = [
    "Direct WhatsApp access to Dr Yuvaraj",
    "Quick query resolution",
    "Guidance on Gastroenterology related problems",
    "Report review",
    "Find out if you need consultation",
    "1 month validity",
    "Unlimited queries",
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white pt-24">
        <main className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-10">
              
              <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-3">
                Priority Connect
              </h1>
              <p className="text-lg text-primary-700 flex items-center justify-center gap-2">
                <svg className="w-6 h-6 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Get direct WhatsApp access to Dr. Yuvaraj T
              </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              {/* What You Get Section */}
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-primary-100">
                <h2 className="text-xl font-bold text-primary-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  What you get:
                </h2>
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
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
                      <span className="text-primary-800">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* How It Works Section */}
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-primary-100">
                <h2 className="text-xl font-bold text-primary-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  How it works:
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 font-bold text-primary-600">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-primary-900">Pay ₹99</p>
                      <p className="text-sm text-primary-600">One-time payment for 1 month access</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 font-bold text-primary-600">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-primary-900">Start chatting with Dr Yuvaraj T on WhatsApp</p>
                      <p className="text-sm text-primary-600">Get instant access after payment</p>
                    </div>
                  </div>
                </div>

                {/* Payment Button */}
                <div className="mt-6 pt-6 border-t border-primary-100">
                  <p className="text-center font-semibold text-primary-900 mb-4">
                    Click the button to begin
                  </p>
                  <div className="flex justify-center">
                    <RazorpayButton />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-primary-600 mt-4">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span>Secure payment powered by Razorpay</span>
                  </div>
                  <p className="text-center text-sm text-primary-600 mt-3">
                    After payment, you will receive WhatsApp access
                  </p>
                </div>
              </div>
            </div>

            {/* Caution Section */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 md:p-8 mb-10">
              <h2 className="text-xl font-bold text-yellow-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Caution:
              </h2>
              <ul className="space-y-3 text-yellow-800">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>This is <strong>not a replacement for consultation</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>New medications or invasive or expensive testing will <strong>not be prescribed</strong> over WhatsApp</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Existing reports and medications will be <strong>reviewed and guidance will be provided</strong></span>
                </li>
              </ul>
            </div>

            {/* About Dr Yuvaraj Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-primary-100">
              <div className="grid md:grid-cols-3 gap-6 items-center">
                <div className="flex justify-center md:justify-start">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-primary-200 shadow-lg">
                    <Image
                      src="/profile.svg"
                      alt="Dr. Yuvaraj T"
                      width={160}
                      height={160}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-primary-900 mb-2">
                    Dr. Yuvaraj T
                  </h2>
                  <p className="text-primary-600 font-semibold mb-3">
                    MS, MCh, FMAS, FACRSI
                  </p>
                  <p className="text-primary-600 mb-3">
                    Surgical Gastroenterology | 8+ Years Experience
                  </p>
                  <p className="text-primary-700 leading-relaxed">
                    Expert in GI & HPB Surgery, Laparoscopic & GI Oncosurgery.
                    Currently practicing at SRV Hospital, Chembur.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                    <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                      Advanced Laparoscopy
                    </span>
                    <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                      GI Surgery
                    </span>
                    <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                      HPB Surgery
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Back to Home */}
            <div className="mt-8 text-center">
              <a
                href="/"
                onClick={() => trackButtonClick("Back to Home", "priority_connect")}
                className="inline-block text-sm text-primary-600 hover:text-primary-800 underline"
              >
                ← Back to Home
              </a>
            </div>
          </div>
        </main>

        {/* Footer */}
        <FooterSection
          companyName="Dr Yuvaraj T"
          tagline="Your Health, Our Priority"
          address="SRV Hospital, Tilak Nagar, Chembur, Mumbai"
          phone="+91 7021227203"
          email="team@curago.in"
          showSocialLinks={false}
          showQuickLinks={true}
          quickLinks={[
            { text: "GBSI", url: "/gbsi" },
            { text: "My Clinic", url: "/myclinic" },
            { text: "Forum", url: "/#community" },
            { text: "Priority Connect", url: "/priority-connect" },
            { text: "About", url: "/about" },
          ]}
          copyrightText={`© ${new Date().getFullYear()} Dr Yuvaraj T. All rights reserved.`}
          backgroundColor="primary"
          trackingContext={{ pageName: "Priority Connect", pageSlug: "priority-connect" }}
        />
      </div>
    </>
  );
}
