"use client";

import { trackButtonClick } from "@/lib/tracking";

export default function CTAButtonSection({
  title,
  subtitle,
  buttonText = "Book Now",
  buttonLink = "#booking",
  buttonStyle = "primary", // primary, secondary, outline
  alignment = "center", // left, center, right
  backgroundColor = "beige", // white, beige, gradient
  size = "large", // small, medium, large
  showIcon = true,
  trackingContext = { pageSlug: "page" },
}) {
  const alignmentClass = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  }[alignment] || "text-center items-center";

  const bgClass = {
    white: "bg-white",
    beige: "bg-beige-50",
    gradient: "bg-gradient-to-br from-primary-50 to-beige-100",
  }[backgroundColor] || "bg-beige-50";

  const buttonStyleClass = {
    primary:
      "bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl",
    secondary:
      "bg-primary-100 hover:bg-primary-200 text-primary-800 shadow-md hover:shadow-lg",
    outline:
      "bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white shadow-md hover:shadow-lg",
  }[buttonStyle] || "bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl";

  const buttonSizeClass = {
    small: "py-2 px-6 text-sm md:text-base",
    medium: "py-3 px-8 text-base md:text-lg",
    large: "py-4 px-10 text-lg md:text-xl",
  }[size] || "py-4 px-10 text-lg md:text-xl";

  const handleClick = () => {
    trackButtonClick(
      buttonText,
      `${trackingContext.pageSlug}_cta_section`
    );
  };

  return (
    <section className={`container mx-auto px-4 md:px-6 py-12 md:py-16 lg:py-20 ${bgClass}`}>
      <div className={`max-w-4xl mx-auto flex flex-col ${alignmentClass}`}>
        {/* Title */}
        {title && (
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-900 mb-4">
            {title}
          </h2>
        )}

        {/* Subtitle */}
        {subtitle && (
          <p className="text-base md:text-lg lg:text-xl text-primary-700 mb-8 max-w-2xl">
            {subtitle}
          </p>
        )}

        {/* CTA Button */}
        <a
          href={buttonLink}
          onClick={handleClick}
          className={`inline-flex items-center justify-center gap-3 font-bold rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-300 ${buttonStyleClass} ${buttonSizeClass}`}
        >
          {buttonText}
          {showIcon && (
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          )}
        </a>
      </div>
    </section>
  );
}
