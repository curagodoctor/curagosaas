"use client";

import { trackButtonClick } from "@/lib/tracking";

export default function BookNowStickyButton({
  buttonText = "Book Now",
  buttonLink = "#booking",
  tooltipText = "Book your appointment",
  position = "bottom-left", // bottom-right, bottom-left
  backgroundColor = "#1e40af",
  textColor = "#ffffff",
  trackingContext = { pageSlug: "page" },
}) {
  // Position classes
  const positionClasses = {
    "bottom-right": "bottom-6 right-20",
    "bottom-left": "bottom-6 left-6",
  }[position] || "bottom-6 left-6";

  // Tooltip position based on button position
  const tooltipPositionClasses = {
    "bottom-right": "bottom-full right-0 mb-2",
    "bottom-left": "bottom-full left-0 mb-2",
  }[position] || "bottom-full left-0 mb-2";

  const handleClick = (e) => {
    trackButtonClick(buttonText, `${trackingContext.pageSlug}_sticky_book_now`);

    // If it's an anchor link, scroll smoothly
    if (buttonLink.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(buttonLink);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <a
      href={buttonLink}
      onClick={handleClick}
      className={`fixed ${positionClasses} z-50 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center gap-2 group font-semibold text-sm`}
      style={{ backgroundColor, color: textColor }}
      aria-label={tooltipText}
    >
      {/* Calendar Icon */}
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span>{buttonText}</span>

      {/* Tooltip */}
      {tooltipText && (
        <span
          className={`absolute ${tooltipPositionClasses} px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none`}
        >
          {tooltipText}
        </span>
      )}
    </a>
  );
}
