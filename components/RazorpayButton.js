"use client";

import { useEffect, useRef } from "react";

export default function RazorpayButton({ paymentButtonId }) {
  const formRef = useRef(null);

  useEffect(() => {
    if (formRef.current && formRef.current.children.length === 0) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/payment-button.js";
      script.setAttribute("data-payment_button_id", paymentButtonId);
      script.async = true;
      formRef.current.appendChild(script);
    }

    return () => {
      if (formRef.current) {
        formRef.current.innerHTML = "";
      }
    };
  }, [paymentButtonId]);

  return <form ref={formRef} className="w-full flex justify-center"></form>;
}
