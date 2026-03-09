"use client";

import { useEffect, useRef } from "react";
import Section from "./Section";

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
 
export default function GutBrainIndexSection() {

  return (
    <Section bgColor="bg-white" id="gut-brain-index">
      <div className="max-w-4xl mx-auto text-center">
    


        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-900 mb-4 leading-tight">
          Understand your <span className="text-primary-600">GBSI</span>
        </h2>
        <p className="text-xl text-primary-800 mb-8">
          Gut Brain Sensitivity Index
        </p>

        <p className="text-xl text-primary-800 mb-12 leading-relaxed">
          Take the 5-minute clinical profiler designed by a Surgical Gastroenterologist.
          Get personalized insights into your gut-brain connection and understand what your symptoms really mean.
        </p>

        <div className="bg-beige-200 p-6 md:p-8 rounded-2xl shadow-lg mb-12 border border-primary-100">
          <div className="space-y-4 mb-8">
            <div>
              <h3 className="font-bold text-primary-900 mb-1">Evidence-Based</h3>
              <p className="text-primary-800 text-sm">
                Based on validated clinical research and gastroenterology standards
              </p>
            </div>

            <div>
              <h3 className="font-bold text-primary-900 mb-1">Just 5 Minutes</h3>
              <p className="text-primary-800 text-sm">
                Quick yet comprehensive assessment of your gut-brain symptoms
              </p>
            </div>

            <div>
              <h3 className="font-bold text-primary-900 mb-1">100% Confidential</h3>
              <p className="text-primary-800 text-sm">
                Your responses are secure and reviewed by a specialist
              </p>
            </div>
          </div>

          <RazorpayButton />
          <p className="text-sm text-gray-600 mt-2">
            Check your Gut-Brain Axis orientation
          </p>
        </div>

        <p className="text-sm text-primary-700">
          ✓ No credit card required • ✓ Instant results • ✓ Doctor-reviewed insights
        </p>
      </div>
    </Section>
  );
}
