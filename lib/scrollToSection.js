// Shared click handler for in-page booking CTAs (sticky button, CTA section,
// header CTA). Authored links are messy in the wild — "#booking", "#booking_form",
// or even "#booking  " with trailing spaces — so we normalize hard:
//   - trim surrounding whitespace
//   - treat an empty or legacy "booking" target as the real "booking_form" id
//   - if the target isn't on this page, fall back to the booking form, then to
//     the home page's booking section
// Only intercepts hash links; real URLs pass through to normal navigation.
export function handleBookingAnchorClick(e, buttonLink) {
  if (typeof buttonLink !== 'string') return;
  const trimmed = buttonLink.trim();
  if (!trimmed.startsWith('#')) return; // real link — let the browser handle it

  e.preventDefault();
  let id = trimmed.slice(1).trim();
  if (!id || id === 'booking') id = 'booking_form';

  let element = document.getElementById(id);
  if (!element && id !== 'booking_form') element = document.getElementById('booking_form');

  if (element) {
    const top = element.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  } else {
    // Form isn't on this page (e.g. a disease sub-page) — go to the homepage's.
    window.location.href = '/#booking_form';
  }
}
