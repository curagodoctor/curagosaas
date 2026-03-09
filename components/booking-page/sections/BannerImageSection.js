"use client";

import Image from "next/image";

export default function BannerImageSection({
  imageUrl,
  title,
  subtitle,
  alignment = "center",
  overlayOpacity = 0.4,
}) {
  if (!imageUrl) return null;

  const alignmentClass = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  }[alignment] || "text-center items-center";

  return (
    <section className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden">
      <Image
        src={imageUrl}
        alt={title || "Banner"}
        fill
        className="object-cover"
        priority
      />
      <div
        className="absolute inset-0 bg-black flex items-center justify-center"
        style={{ opacity: overlayOpacity }}
      />
      <div className={`absolute inset-0 flex flex-col ${alignmentClass} justify-center p-6 md:p-12 lg:p-16`}>
        {title && (
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl drop-shadow-lg">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
