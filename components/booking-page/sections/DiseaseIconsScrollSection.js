"use client";

import Image from "next/image";

export default function DiseaseIconsScrollSection({
  icons = [],
  speed = "medium",
}) {
  // Default icons if none provided
  const defaultIcons = [2, 3, 4, 5, 6, 7, 8].map(num => ({
    url: `/All diseases/${num}.svg`,
    alt: `Disease ${num}`
  }));

  // Filter out icons with empty urls
  const validIcons = icons.filter(icon => {
    const url = typeof icon === 'string' ? icon : icon?.url;
    return url && url.trim() !== '';
  });

  const displayIcons = validIcons.length > 0 ? validIcons : defaultIcons;

  // Speed classes
  const speedClass = {
    slow: "animate-scroll-slow",
    medium: "animate-scroll",
    fast: "animate-scroll-fast",
  }[speed] || "animate-scroll";

  return (
    <section className="bg-white overflow-hidden py-0 lg:py-2">
      <div className="relative">
        <div className={`flex ${speedClass} items-center`}>
          {/* First set */}
          {displayIcons.map((icon, index) => (
            <div
              key={`first-${index}`}
              className="flex-shrink-0 w-[60px] h-[60px] md:w-[80px] md:h-[80px] lg:w-[100px] lg:h-[100px] mx-3 md:mx-4"
            >
              <Image
                src={icon.url || icon}
                alt={icon.alt || `Icon ${index + 1}`}
                width={100}
                height={100}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
          {/* Duplicate set for seamless loop */}
          {displayIcons.map((icon, index) => (
            <div
              key={`second-${index}`}
              className="flex-shrink-0 w-[60px] h-[60px] md:w-[80px] md:h-[80px] lg:w-[100px] lg:h-[100px] mx-3 md:mx-4"
            >
              <Image
                src={icon.url || icon}
                alt={icon.alt || `Icon ${index + 1}`}
                width={100}
                height={100}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
