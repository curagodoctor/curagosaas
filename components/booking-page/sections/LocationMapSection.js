"use client";

import { useState } from "react";
import { trackButtonClick } from "@/lib/tracking";
import { toMapEmbedUrl } from "@/lib/mapEmbed";

export default function LocationMapSection({
  sectionId,
  title = "", // Will auto-generate based on count if empty
  // Support for multiple locations (new format)
  locations = [],
  // Legacy single location props (backward compatibility)
  address = "",
  mapUrl = "",
  showDirectionsButton = true,
  trackingContext = { pageSlug: "page" },
}) {
  const [activeTab, setActiveTab] = useState(0);

  // Build locations array - support both new and legacy formats
  let locationList = locations;

  // If no locations array but legacy props exist, create single location
  if ((!locationList || locationList.length === 0) && (address || mapUrl)) {
    locationList = [{
      name: "Main Location",
      address: address,
      mapUrl: mapUrl,
    }];
  }

  // If still no locations, don't render section
  if (!locationList || locationList.length === 0) {
    return null;
  }

  // Auto-generate title based on count if not provided
  const displayTitle = title || (locationList.length === 1 ? "Our Location" : "Our Locations");

  const activeLocation = locationList[activeTab] || locationList[0];

  // Normalize whatever was pasted (share link, place URL, iframe snippet, or
  // nothing) into a URL that actually embeds; falls back to the address.
  const embedUrl = toMapEmbedUrl(activeLocation.mapUrl, activeLocation.address);

  return (
    <section id={sectionId} className="bg-beige-50 py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-600 mb-4">
              {displayTitle}
            </h2>
          </div>

          {/* Location Tabs - Only show if multiple locations */}
          {locationList.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {locationList.map((location, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                    activeTab === index
                      ? "bg-primary-600 text-white shadow-md"
                      : "bg-white text-primary-700 hover:bg-primary-50 border border-primary-200"
                  }`}
                >
                  {location.name || `Location ${index + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* Active Location Details */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Location Info Header */}
            <div className="p-6 md:p-8 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-primary-800 mb-2">
                    {activeLocation.name || "Our Location"}
                  </h3>
                  <p className="text-primary-700 flex items-start gap-2">
                    <span className="flex-shrink-0 mt-1">📍</span>
                    <span>{activeLocation.address}</span>
                  </p>
                </div>
                {showDirectionsButton && activeLocation.address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(activeLocation.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackButtonClick(`Get Directions - ${activeLocation.name}`, `${trackingContext.pageSlug}_location_map_section`)}
                    className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Get Directions
                  </a>
                )}
              </div>
            </div>

            {/* Map Embed */}
            {embedUrl ? (
              <div className="aspect-video md:aspect-[16/9] lg:aspect-[21/9]">
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "350px" }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                ></iframe>
              </div>
            ) : (
              <div className="aspect-video md:aspect-[16/9] bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-500 p-8">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm mb-2">Map not configured</p>
                  <p className="text-xs text-gray-400">Add a Google Maps embed URL in settings</p>
                </div>
              </div>
            )}
          </div>

          {/* All Locations Summary - Show if multiple locations */}
          {locationList.length > 1 && (
            <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locationList.map((location, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`p-4 rounded-xl text-left transition-all ${
                    activeTab === index
                      ? "bg-primary-100 border-2 border-primary-500"
                      : "bg-white border-2 border-transparent hover:border-primary-200 shadow-sm hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      activeTab === index ? "bg-primary-600 text-white" : "bg-primary-100 text-primary-600"
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-primary-900 text-sm">
                        {location.name || `Location ${index + 1}`}
                      </h4>
                      <p className="text-xs text-primary-700 mt-1 line-clamp-2">
                        {location.address}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
