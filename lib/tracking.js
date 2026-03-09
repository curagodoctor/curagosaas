// GTM Tracking Utility

// Initialize dataLayer
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
}

// Get referral code from URL
const getRefFromUrl = () => {
  if (typeof window === 'undefined') return undefined;
  const ref = new URL(window.location.href).searchParams.get('ref');
  return ref || undefined;
};

// Track page views
export const trackPageView = (title, path) => {
  if (typeof window === 'undefined') return;

  const loc = window.location;
  const page_path = path ?? `${loc.pathname}${loc.search}${loc.hash}`;

  window.dataLayer?.push({
    event: 'page_view',
    page_title: title,
    page_path,
    page_location: loc.href,
    referrer_code: getRefFromUrl(),
  });

  console.log(`✅ GTM: Page view - ${title}`);
};

// Track add to cart (form fill and button clicks)
export const trackAddToCart = (itemName, source, value = 150) => {
  if (typeof window === 'undefined') return;

  window.dataLayer?.push({
    event: 'add_to_cart',
    ecommerce: {
      currency: 'INR',
      value: value,
      items: [{
        item_name: itemName,
        item_category: 'Consultation',
        price: value,
        quantity: 1
      }]
    },
    source: source,
    referrer_code: getRefFromUrl(),
  });

  console.log(`✅ GTM: Add to cart - ${itemName} from ${source}`);
};

// Track button clicks
export const trackButtonClick = (buttonName, location) => {
  if (typeof window === 'undefined') return;

  window.dataLayer?.push({
    event: 'button_click',
    button_name: buttonName,
    button_location: location,
    referrer_code: getRefFromUrl(),
  });

  console.log(`✅ GTM: Button click - ${buttonName} at ${location}`);
};

// Track scroll depth
export const trackScrollDepth = (percentage) => {
  if (typeof window === 'undefined') return;

  window.dataLayer?.push({
    event: 'scroll',
    scroll_depth: percentage,
    page_path: window.location.pathname,
  });

  console.log(`✅ GTM: Scroll - ${percentage}%`);
};

// Track WhatsApp clicks
export const trackWhatsAppClick = (source) => {
  if (typeof window === 'undefined') return;

  window.dataLayer?.push({
    event: 'whatsapp_click',
    source: source,
    referrer_code: getRefFromUrl(),
  });

  console.log(`✅ GTM: WhatsApp click from ${source}`);
};

// Track purchase (will be called from payment callback)
export const trackPurchase = (transactionId, value, bookingDetails) => {
  if (typeof window === 'undefined') return;

  window.dataLayer?.push({
    event: 'purchase',
    ecommerce: {
      transaction_id: transactionId,
      value: value,
      currency: 'INR',
      items: [{
        item_name: `${bookingDetails.mode} Consultation`,
        item_category: 'Consultation',
        price: value,
        quantity: 1
      }]
    },
    booking_date: bookingDetails.date,
    booking_time: bookingDetails.time,
    consultation_mode: bookingDetails.mode,
    referrer_code: getRefFromUrl(),
  });

  console.log(`✅ GTM: Purchase - ₹${value} (${transactionId})`);
};

// Track form submissions
export const trackFormSubmit = (formName, formData) => {
  if (typeof window === 'undefined') return;

  // First track as add_to_cart
  trackAddToCart(`${formName} - Slot Booking`, 'booking_form', 150);

  window.dataLayer?.push({
    event: 'form_submit',
    form_name: formName,
    consultation_mode: formData.mode,
    referrer_code: getRefFromUrl(),
  });

  console.log(`✅ GTM: Form submit - ${formName}`);
};

// Track appointment booked (OTP-based booking without payment)
export const trackAppointmentBooked = (bookingData) => {
  if (typeof window === 'undefined') return;

  const eventData = {
    event: 'appointment_booked',
    event_category: 'booking',
    event_label: bookingData.pageSlug ? `${bookingData.pageSlug}_otp_booking` : 'otp_booking',
    phone: bookingData.phone,
    email: bookingData.email,
    event_id: bookingData.eventId,
    booking_id: bookingData.bookingId,
    booking_mode: bookingData.mode,
    booking_date: bookingData.date,
    booking_time: bookingData.time,
    page_slug: bookingData.pageSlug,
    page_name: bookingData.pageName,
    referrer_code: getRefFromUrl(),
  };

  window.dataLayer?.push(eventData);

  // Also fire gtag event for GA4
  if (window.gtag) {
    window.gtag('event', 'appointment_booked', {
      event_category: 'booking',
      event_label: eventData.event_label,
      value: 0,
      booking_mode: bookingData.mode,
      booking_date: bookingData.date,
      phone: bookingData.phone,
      email: bookingData.email,
      event_id: bookingData.eventId,
    });
  }

  console.log('✅ GTM: Appointment booked event fired', eventData);
  return eventData;
};
