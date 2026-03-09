"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const RazorpayButton = () => {
  const formRef = useRef(null);

  useEffect(() => {
    if (formRef.current) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/payment-button.js";
      script.setAttribute("data-payment_button_id", "pl_S8wSDVLqgev40j");
      script.async = true;
      formRef.current.appendChild(script);
    }
  }, []);

  return <form ref={formRef}></form>;
};

export default function GBSIHeroSection() {
  return (
    <section className="relative bg-white overflow-hidden pt-20">
      <div className="relative z-10 w-full">
        <div className="animate-fade-in">
          {/* Desktop Image */}
          <div className="hidden md:block w-full">
            <Image
              src="/1.svg"
              alt="Dr. Yuvaraj T - Surgical Gastroenterologist"
              width={1920}
              height={1080}
              className="w-full h-auto object-contain"
              priority
            />
            {/* Text Below Image */}
            <div className="flex flex-col items-center justify-center text-center px-4 py-12 bg-white">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-light text-primary-600 mb-4 max-w-4xl">
                Your Gut is Your Second Brain.<br />
                Is Connection Broken?
              </h1>
              <p className="text-xl lg:text-2xl font-light text-primary-600 max-w-3xl mb-8">
                Beyond the antacids, stool softners and 'normal' scans
              </p>
              {/* Primary CTA - Razorpay Payment Button */}
              <RazorpayButton />
              <p className="text-sm text-gray-600 mt-2">
                Check your Gut-Brain Axis orientation
              </p>
            </div>
          </div>

          {/* Mobile Image */}
          <div className="block md:hidden w-full">
            <Image
              src="/2.svg"
              alt="Dr. Yuvaraj T - Surgical Gastroenterologist"
              width={768}
              height={1024}
              className="w-full h-auto object-cover"
              priority
            />
            {/* CTA Button for Mobile */}
            <div className="flex flex-col items-center justify-center text-center px-4 py-4 bg-white">
              {/* Primary CTA - Razorpay Payment Button */}
              <RazorpayButton />
              <p className="text-sm text-gray-600 mt-2">
                Check your Gut-Brain Axis orientation
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
