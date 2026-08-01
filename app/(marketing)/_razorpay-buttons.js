'use client';

import { useEffect } from 'react';

/**
 * Renders Razorpay Payment Buttons into `.rzp-btn[data-rzp]` placeholders on the
 * landing page. The page is static HTML (dangerouslySetInnerHTML) which can't run
 * injected <script> tags, so we create the form + script as real DOM nodes here —
 * that makes the browser execute Razorpay's payment-button.js and render the button.
 */
export default function RazorpayButtons() {
  useEffect(() => {
    const holders = document.querySelectorAll('.rzp-btn[data-rzp]');
    holders.forEach((holder) => {
      if (holder.getAttribute('data-mounted')) return;
      const id = holder.getAttribute('data-rzp');
      if (!id) return;
      holder.setAttribute('data-mounted', '1');

      const form = document.createElement('form');
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/payment-button.js';
      script.async = true;
      script.setAttribute('data-payment_button_id', id);
      form.appendChild(script);
      holder.appendChild(form);
    });
  }, []);

  return null;
}
