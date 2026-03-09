"use client";

import Image from "next/image";

export default function DoctorProfileSection({
  title = "About Dr. Yuvaraj T",
  content,
  imageUrl = "/doctor-profile.jpg",
  credentials = [],
  layout = "left",
}) {
  if (!content) return null;

  const isLeftLayout = layout === "left";

  return (
    <section className="container mx-auto px-4 md:px-6 py-12 md:py-16 lg:py-20 bg-beige-50">
      <div className="max-w-6xl mx-auto">
        <div className={`grid grid-cols-1 ${imageUrl ? 'lg:grid-cols-2' : ''} gap-8 lg:gap-12 items-center ${!isLeftLayout ? "lg:grid-flow-dense" : ""}`}>
          {/* Image */}
          {imageUrl && (
            <div className={`${!isLeftLayout ? "lg:col-start-2" : ""}`}>
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className={`${!isLeftLayout ? "lg:col-start-1 lg:row-start-1" : ""}`}>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-600 mb-6">
              {title}
            </h2>

            {/* Credentials */}
            {credentials && credentials.length > 0 && (
              <div className="mb-6 space-y-2">
                {credentials.map((credential, index) => (
                  <div key={index} className="flex items-center gap-2 text-primary-700">
                    <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">{credential}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Main Content */}
            <div className="prose prose-lg max-w-none text-primary-800 leading-relaxed">
              {content.split('\n').map((paragraph, index) => (
                paragraph.trim() && (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
