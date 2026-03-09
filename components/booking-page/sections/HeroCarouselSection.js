"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { trackButtonClick } from "@/lib/tracking";

export default function HeroCarouselSection({
  images = [],
  autoPlaySpeed = 3000,
  showIndicators = true,
  showDoctorCredentials = false,
  doctorName = "Dr. Yuvaraj T",
  doctorTitle = "Consultant GI & HPB Surgeon",
  doctorCredentials = ["MCh Surgical Gastroenterology (KEMH, Mumbai)", "FMAS, FACRSI"],
  trackingContext = { pageSlug: "page" },
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Filter out images with empty urls
  const validImages = images.filter(image => {
    const url = typeof image === 'string' ? image : image?.url;
    return url && url.trim() !== '';
  });

  // Auto-scroll carousel
  useEffect(() => {
    if (validImages.length > 1 && autoPlaySpeed > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % validImages.length);
      }, autoPlaySpeed);

      return () => clearInterval(interval);
    }
  }, [validImages.length, autoPlaySpeed]);

  if (!validImages || validImages.length === 0) {
    return null;
  }

  // Use validImages instead of images throughout the component
  const displayImages = validImages;

  return (
    <section className="relative w-full overflow-hidden bg-gray-100">
      <div className="relative w-full pt-20 md:pt-24">
        <div className="relative w-full overflow-hidden">
          {/* Carousel Images */}
          <div className="relative w-full h-[150px] sm:h-[250px] md:h-[350px] lg:h-[500px] xl:h-[600px]">
            {displayImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
                  index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                <Image
                  src={image.url || image}
                  alt={image.alt || `Slide ${index + 1}`}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover object-[center_30%] sm:object-[center_35%]"
                  quality={90}
                  unoptimized
                />
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <p className="text-white text-lg md:text-xl font-semibold text-center">
                      {image.caption}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Carousel Indicators */}
          {showIndicators && displayImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
              {displayImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentSlide(index);
                    trackButtonClick(`Carousel Slide ${index + 1}`, `${trackingContext.pageSlug}_hero_carousel`);
                  }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "bg-primary-600 w-8"
                      : "bg-white/50 hover:bg-white/75"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Doctor Credentials - Compact */}
      {showDoctorCredentials && (
        <div className="bg-white py-3">
          <div className="container mx-auto px-6">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm md:text-base">
              <h2 className="font-bold text-primary-600 whitespace-nowrap">
                {doctorName}
              </h2>
              <span className="text-primary-700">|</span>
              <span className="text-primary-800 font-semibold">
                {doctorTitle}
              </span>
              {doctorCredentials.map((credential, index) => (
                <span key={index} className="flex items-center gap-3">
                  <span className="text-primary-700 text-xs md:text-sm">|</span>
                  <span className="text-primary-700 text-xs md:text-sm">
                    {credential}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
